# MCP Operations

## Safe production route

The MCP process is separate from the main API and runs under PM2 as `alazab-mcp`.
The main API proxies `/api/mcp/*` to the local MCP process.

## Required environment

```env
MCP_PORT=4005
MCP_BASE_URL=http://127.0.0.1:4005
MCP_REQUIRE_INTERNAL_KEY=false
MCP_INTERNAL_KEY=

MAINTENANCE_GATEWAY_URL=https://zrrffsjbfkphridqyais.supabase.co/functions/v1/maintenance-gateway
MAINTENANCE_API_KEY=...

DAFTRA_SUBDOMAIN=alazab-co
DAFTRA_URL=https://alazab-co.daftra.com/api2
DAFTRA_API_KEY=...

WA_INGEST_PG_HOST=127.0.0.1
WA_INGEST_PG_PORT=5433
WA_INGEST_PG_DATABASE=azab_hooks
WA_INGEST_PG_USER=azab_hooks
WA_INGEST_PG_PASSWORD=...
WHATSAPP_SEAFILE_URL=http://127.0.0.1:3099

SEAFILE_BASE_URL=https://seafile.alazab.com
SEAFILE_ID=a57d578c-4fc8-433b-83b4-c8d1afc4d860
SEAFILE_TOKEN=...
```

## Checks

```bash
cd /var/www/core/alazab.com/server
npm run check
pm2 reload ecosystem.config.js --env production
curl -sS http://127.0.0.1:4005/health | jq .
curl -sS http://127.0.0.1:4005/tools | jq '.data.count'
curl -sS https://alazab.com/api/mcp/health | jq .
```

## Call format

```json
{
  "tool": "maintenance.get_status",
  "payload": {
    "request_id": "..."
  }
}
```

or:

```json
{
  "action": "maintenance.get_status",
  "payload": {
    "request_id": "..."
  }
}
```
