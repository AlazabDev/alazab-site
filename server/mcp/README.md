# Alazab MCP Gateway

This production-safe MCP gateway runs locally on `127.0.0.1:${MCP_PORT:-4005}` and is exposed by the main API through `/api/mcp`.

## Endpoints

```bash
GET  /health
GET  /tools
POST /call
POST /mcp
POST /v1
GET  /catalog/daftra
GET  /catalog/maintenance
```

Main API proxy endpoints:

```bash
GET  https://alazab.com/api/mcp/health
GET  https://alazab.com/api/mcp/tools
POST https://alazab.com/api/mcp/call
POST https://alazab.com/api/mcp/v1
```

## Main tool groups

- `maintenance.*` — request creation, status, stage transitions, notes, cancellation, lifecycle test.
- `daftra.*` — generated Daftra OpenAPI operation caller plus common CRUD shortcuts.
- `wa_ingest.*` — WhatsApp → Seafile PostgreSQL monitoring.
- `whatsapp_seafile.*` — local webhook service health.
- `seafile.*` — Seafile library checks.
- `system_info`, `health`, `ping`, `list_tools`, `tool_schema`.

## Examples

```bash
curl -sS http://127.0.0.1:4005/tools | jq .
```

```bash
curl -sS -X POST http://127.0.0.1:4005/call \
  -H 'Content-Type: application/json' \
  -d '{"tool":"maintenance.get_status","payload":{"request_id":"<uuid>"}}' | jq .
```

```bash
curl -sS -X POST http://127.0.0.1:4005/call \
  -H 'Content-Type: application/json' \
  -d '{"tool":"daftra.list_operations","payload":{"search":"invoice","limit":20}}' | jq .
```

```bash
curl -sS -X POST http://127.0.0.1:4005/call \
  -H 'Content-Type: application/json' \
  -d '{"tool":"wa_ingest.stats","payload":{}}' | jq .
```
