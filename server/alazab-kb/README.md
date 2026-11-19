# Alazab Knowledge Base

Public, unauthenticated knowledge base with PostgreSQL, versioned documents, Arabic/English token search, REST and MCP Streamable HTTP.

## Deploy on the existing server

Requires Python 3.11+, psql, PostgreSQL DB URL, an existing HTTPS vhost (or DNS+certificate to create one). Does not provision a new server or database cluster.

```bash
export AZ_KB_DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/DATABASE'
export AZ_KB_PUBLIC_HOST='kb.alazab.com'
bash install.sh
```

`install.sh` runs additive DDL in schema `az_kb`, installs a systemd service and checks local health. It does not edit nginx or DNS. Merge `nginx-location.conf` into your **existing** canonical vhost; then run `nginx -t && systemctl reload nginx`. Ensure HTTPS and DNS resolve correctly.

## API

- `GET https://kb.alazab.com/health`
- `GET https://kb.alazab.com/api/search?q=magicplan&status=approved`
- `GET https://kb.alazab.com/api/documents/<slug>`
- `POST https://kb.alazab.com/api/documents` JSON object with slug, title, content, project, category, status, source, expected_revision
- `POST https://kb.alazab.com/mcp` MCP Streamable HTTP endpoint (client sets correct headers)

## Example

```bash
curl https://kb.alazab.com/api/documents -H 'Content-Type: application/json' -d '{"slug":"magicplan-axis-standard","title":"Magicplan axis standard","project":"magicplan","category":"technical-standard","status":"approved","source":"Arabesque validated OBJ reference","content":"OBJ: X=width, Y=height, Z=depth. Confirm acceptance in Magicplan Object Manager before release."}'
```

No application authentication is implemented, including on write actions, per the requested public setup. Anyone on the internet can add or alter entries, including entries marked approved. Revision history helps audit changes but is not tamper-proof against direct database administration. Never store passwords, tokens, or confidential information in this public base. PostgreSQL itself stays bound to internal interfaces.

## Verification

1. `systemctl status alazab-kb --no-pager`
2. `curl -i https://kb.alazab.com/health`
3. Save a test document via POST, search by slug, read it, then POST an update with `expected_revision:1` and retrieve its history with MCP `knowledge_history`.
4. Connect ChatGPT using a custom MCP connector for `https://kb.alazab.com/mcp` if your client permits no-auth HTTP MCP connections. The connector addition requires a one-time user action in ChatGPT settings and is not automatically completed by this deployment.
