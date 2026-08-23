#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

fail() { echo "[FAIL] $1" >&2; exit 1; }
ok()   { echo "[OK]   $1"; }

command -v node >/dev/null 2>&1 || fail "node is required"
command -v pnpm >/dev/null 2>&1 || fail "pnpm is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 24 ] || fail "Node 24+ required; found $(node -v)"
ok "Node $(node -v)"

pnpm install --frozen-lockfile
pnpm run type-check
pnpm run lint
pnpm exec vitest run --passWithNoTests
pnpm run build
[ -f dist/index.html ] || fail "frontend build did not produce dist/index.html"
ok "frontend validation and build"

(
  cd server
  npm ci
  npm run check
  npm run lint
)
ok "backend validation"

if grep -RInE 'http://alazab\.com|http://www\.alazab\.com' .env src server --exclude-dir=node_modules --exclude-dir=dist 2>/dev/null; then
  fail "insecure production alazab.com URL found"
fi
ok "production URLs use HTTPS"

if grep -RIn '/var/www/core/alazab.com' server/config scripts 2>/dev/null; then
  fail "legacy /var/www/core deployment path found"
fi
ok "legacy deployment path removed from active production config"

echo
printf '%s\n' "Production preflight passed."
