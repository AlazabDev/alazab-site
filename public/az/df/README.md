# Alazab Daftra Toolkit (`/df`)

Static, expandable public toolkit for Daftra reference data and future modules.

**Current working feature:** variables browser at `index.html` backed exclusively by `vars.json` (331 definitions in 9 sections). No credentials or private Daftra account data are included.

**Module dashboard:** `dashboard.html`, driven by `config/modules.json`.

**Planned domains:** work-orders, invoices, suppliers, templates, reports. Planned folders contain documentation only, not functional integrations.

**Validation:** `python3 scripts/validate.py`.

**Publishing:** see `docs/DEPLOY.md`. **Architecture:** see `docs/ARCHITECTURE.md`.

Do not place API keys, secrets, personally identifying account records or write-capable Daftra API calls in this publicly hosted directory. Future integrations requiring authentication need a separate backend.
