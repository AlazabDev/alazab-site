# Technical handover — production MCP stability

Date: 2026-11-26

Repository: AlazabDev/alazab-site
Workstream: production process recovery and knowledge continuity.

## Verified
- Clean PM2 reset reduced observed load and CPU wait; historical restart logs were removed.
- The original Daftra startup file is not tracked; the tracked source contains 305 operations rather than the established 301.
- Repository review found a compatibility projection preserving the 301-operation scope, with a pinned source hash and full group/count validation.
- Knowledge service code uses the existing OAuth transport and bounded access to public/az.

## Resume
- Review the repair branch, CI and runtime smoke tests before deploying.
- Confirm the existing knowledge service and OAuth resource audience on the actual host.
- Start services individually; confirm stability before saving PM2 state.
- Do not infer deployment success from source changes alone.

No credentials, client records or financial data are included here.
