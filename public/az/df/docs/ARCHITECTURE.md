# Daftra Toolkit — Architecture

## Public deployment tree

- `index.html`: existing working variables UI (backward-compatible)
- `vars.json`: canonical variables catalog; never duplicate definitions in HTML
- `dashboard.html`: module hub driven by `config/modules.json`
- `config/modules.json`: registry (`ready` vs `planned`)
- `modules/<slug>/`: future implementation per domain
- `assets/`: shared static assets
- `docs/`: conventions and operational notes
- `scripts/validate.py`: offline structural validation

## Module contract

1. Add directory `modules/<slug>/` and implementation files.
2. Keep user-facing view at `modules/<slug>/index.html` when deployable.
3. Add its entry `./modules/<slug>/index.html` in `config/modules.json` and set `status` to `ready` only when implemented and tested.
4. Put read-only public reference data in JSON under `modules/<slug>/data/` if needed.
5. Never put Daftra credentials, tokens, API responses containing private account data, or server-side write endpoints in this public folder.
6. Writes to Daftra must use a separate authenticated backend/connector, with permission checks and audit logging. This static scaffold does not implement writes.

## Compatibility

The published `/df/index.html` remains the variables browser; `/df/vars.json` is unchanged. New navigation is `/df/dashboard.html`.
