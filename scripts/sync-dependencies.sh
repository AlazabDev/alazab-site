#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="$(git branch --show-current)"
if [[ "$BRANCH" != "development" ]]; then
  echo "ERROR: dependency synchronization must run on development, current=$BRANCH" >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(`.`)[0]')"
if (( NODE_MAJOR < 24 )); then
  echo "ERROR: Node >=24 is required" >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is required" >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is required" >&2
  exit 1
fi

printf '\n===== TOOLCHAIN =====\n'
node -v
pnpm -v
npm -v

printf '\n===== FRONTEND: UPDATE WITHIN DECLARED RANGES =====\n'
pnpm update

# Curated major-family upgrades verified for this repository architecture.
# TypeScript 7 is intentionally NOT selected yet: typescript-eslint v8.65+
# detects TS7 as unsupported. TypeScript 6.0.3 is the latest supported stable line.
pnpm add \
  react@19.2.8 \
  react-dom@19.2.8 \
  @supabase/supabase-js@2.112.2 \
  @tanstack/react-query@5.102.2 \
  react-router-dom@7.18.2 \
  @elevenlabs/react@1.12.0

pnpm add -D \
  vite@8.2.2 \
  @vitejs/plugin-react-swc@4.3.3 \
  typescript@6.0.3 \
  eslint@10.9.0 \
  @eslint/js@10.9.0 \
  typescript-eslint@8.67.0 \
  @types/node@26.2.0 \
  @types/react@19.2.18 \
  @types/react-dom@19.2.5 \
  lovable-tagger@1.3.3 \
  tailwindcss@3.4.19 \
  vite-plugin-pwa@1.3.0

# These were declared but are not used by the current Vite configuration/source.
pnpm remove vite-tsconfig-paths cookie-parser 2>/dev/null || true

printf '\n===== FRONTEND: VALIDATE =====\n'
pnpm run type-check
pnpm run lint
pnpm exec vitest run --passWithNoTests
pnpm run build

printf '\n===== BACKEND: CLEAN + UPDATE =====\n'
cd "$ROOT/server"

# Remove frontend/browser-only or unused backend packages before updating.
npm uninstall \
  @elevenlabs/react \
  react-helmet-async \
  react-tiktok \
  @hono/node-server \
  2>/dev/null || true

# Update all packages within the currently declared compatible semver ranges.
npm update

# Explicit compatibility anchors for the production backend.
# Express stays on v4 because this codebase contains Express-4 route patterns.
npm install \
  express@^4.22.2 \
  @modelcontextprotocol/express@2.0.0 \
  @modelcontextprotocol/node@2.0.0 \
  @modelcontextprotocol/server@2.0.0 \
  @supabase/supabase-js@2.112.2 \
  zod@4.4.3

npm install -D \
  eslint@10.9.0 \
  @eslint/js@10.9.0 \
  glob@13.0.6 \
  npm-check-updates@22.0.1 \
  prettier@3.8.3

printf '\n===== BACKEND: VALIDATE =====\n'
npm run check
npm run lint
npm run webhook:central:check

if [[ -f "mcp/daftra/openapi/Default module.openapi.json" ]]; then
  npm run mcp:daftra:catalog
  npm run mcp:daftra:smoke
else
  echo "SKIP: Daftra OpenAPI source is not installed on this checkout"
fi

printf '\n===== DEPENDENCY TREES =====\n'
cd "$ROOT"
pnpm list --depth 0
printf '\n--- backend ---\n'
cd "$ROOT/server"
npm ls --depth=0

printf '\n===== AUDIT =====\n'
cd "$ROOT"
pnpm audit --prod || true
cd "$ROOT/server"
npm audit --omit=dev || true

printf '\n===== CHANGED FILES =====\n'
cd "$ROOT"
git status --short

printf '\nDEPENDENCY SYNCHRONIZATION COMPLETE\n'
