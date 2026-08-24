# Production Dependency Policy

This repository intentionally uses two package-manager boundaries:

- Frontend (`/`): **pnpm 11.20.0** with `pnpm-lock.yaml`
- Backend (`/server`): **npm** with `server/package-lock.json`

`server` must not be re-added to the pnpm workspace. This prevents one lockfile from trying to own both application layers.

## Runtime baseline

- Node.js: **24.19.x** in production and CI
- Frontend package manager: **pnpm 11.20.0**
- Backend package manager: npm bundled with the production Node 24 runtime

## Compatibility anchors

The dependency synchronizer deliberately keeps the following major lines:

| Stack | Production line | Reason |
|---|---:|---|
| React / React DOM | 19.2.x | Current application runtime |
| Vite | 8.2.x | Current stable Vite generation; React SWC and PWA plugins support Vite 8 |
| TypeScript | 6.0.x | Latest stable TypeScript line supported by current typescript-eslint v8; do not move to TS 7 until official support lands |
| ESLint | 10.x | Supported by typescript-eslint v8.56+ |
| typescript-eslint | 8.x | Current maintained major |
| Tailwind CSS | 3.4.19 | v3 LTS; v4 is a framework migration, not a routine dependency update |
| Express | 4.22.x | Existing backend contains Express 4 route semantics; Express 5 requires a dedicated migration |
| Zod | 4.4.x | MCP code imports Zod v4 APIs |
| MCP TypeScript SDK | 2.0.x | Stable MCP v2 / 2026-07-28 protocol line |
| Supabase JS | 2.112.x | Shared frontend/backend client family |

## Update command

Run only from the `development` branch:

```bash
pnpm run deps:sync
```

The command:

1. Updates packages inside their declared semver ranges.
2. Applies vetted major-family upgrades and pins compatibility anchors.
3. Removes packages that are not part of the current runtime architecture.
4. Regenerates both lockfiles using their owning package manager.
5. Runs frontend typecheck, lint, tests, and production build.
6. Runs backend syntax and lint checks, central-webhook checks, and Daftra MCP checks when the authoritative OpenAPI file is present.
7. Prints the resulting dependency trees and production audits.

Do not hand-edit either lockfile. Do not run `pnpm install` inside `server`. Do not run root `npm install`.

## Upgrade gates

Major upgrades to **TypeScript 7**, **Tailwind 4**, or **Express 5** require a dedicated migration branch and passing production CI before they can replace these compatibility anchors.
