# Azab Daftra MCP v2

A server-side MCP gateway that turns business intent into verified Daftra API operations. It is intentionally not a thin OpenAPI wrapper: the complete supplied OpenAPI document is loaded as the authoritative runtime registry, while agents work through discovery, planning, entity resolution, validation, execution, read-back verification and audit layers.

## Source contract

The production source is `openapi/Default module.openapi.json`.

Expected immutable source facts:

- 301 operations
- 206 paths
- 70 actual OpenAPI groups/subgroups
- 25 top-level domains
- GET 140
- POST 74
- PUT 44
- PATCH 0
- DELETE 43
- SHA256 `c264e9df687a75f7aec5f06e1d25c5f931cf01937069ae4003c1802eb0102c63`

Production starts with `DAFTRA_OPENAPI_STRICT_HASH=true`; a different source file fails startup instead of silently changing agent capabilities.

## Runtime layers

`registry.js` parses every source operation and retains the exact request/response schema.

`planner.js` resolves Arabic/English business intent into one operation and refuses ambiguous matches.

`resolver.js` resolves business names to Daftra IDs (projects, clients, suppliers, products, cost centers, treasuries, staff, branches, stores and work orders).

`schema-validator.js` validates required fields and common OpenAPI constraints before a write reaches Daftra.

`client.js` handles path expansion, media types, Daftra authentication, supported idempotency and normalized responses.

`verifier.js` performs read-back verification after POST/PUT/PATCH when the same group provides a suitable single-record GET.

`audit.js` writes a local JSONL trace with credential redaction.

`server.js` exposes MCP Streamable HTTP on loopback port 4007.

## MCP strategy

The default tool set is deliberately compact so LLM tool selection remains reliable:

- `daftra_catalog_summary`
- `daftra_list_groups`
- `daftra_search_operations`
- `daftra_describe_operation`
- `daftra_resolve_entity`
- `daftra_plan`
- `daftra_execute`
- `daftra_group_execute`
- `daftra_batch`
- high-level business tools such as `daftra_create_expense`
- one smart router per top-level domain

All 301 operations remain executable by exact generated operation key. Set `DAFTRA_MCP_EXPOSE_GROUP_TOOLS=true` only when a client specifically needs a separate MCP tool for every actual OpenAPI group; by default the 70 groups are routed through `daftra_group_execute` to avoid tool overload.

## Safety/execution rules

Read operations execute directly after resolution.

POST/PUT/PATCH requests are schema-validated, audited and read back when possible.

DELETE requests require `confirm=true`.

When an operation supports `unique_id`, the gateway injects a deterministic key unless the caller supplied one.

Ambiguous entity resolution never silently chooses an ID.

Project-to-cost-center mapping can be made explicit with `DAFTRA_PROJECT_COST_CENTER_MAP` instead of relying on equal names.

## Required production variables

At minimum:

```env
MCP_DAFTRA_API_KEY=<server MCP bearer/API key>
DAFTRA_OPENAPI_FILE=./mcp/daftra/openapi/Default module.openapi.json
DAFTRA_OPENAPI_EXPECT_OPERATIONS=301
DAFTRA_OPENAPI_STRICT_HASH=true
DAFTRA_BASE_URL=<actual Daftra API base URL>
```

For Daftra authentication configure either a fixed `DAFTRA_ACCESS_TOKEN`, OAuth settings, or `DAFTRA_API_KEY`. Keeping both Bearer and API key is supported because the supplied General Listing endpoint explicitly requires `apikey` while other operations support Bearer.

## Validation

From `server/`:

```bash
npm run mcp:daftra:catalog
npm run mcp:daftra:smoke
node --check mcp/daftra/server.js
```

The catalog and smoke checks must report exactly 301 operations and 70 actual groups.

## Run

Direct:

```bash
npm run mcp:daftra
```

Production PM2:

```bash
pm2 start ecosystem.config.js --only alazab-daftra-mcp --env production
```

Health:

```bash
curl -sS http://127.0.0.1:4007/healthz | jq .
```

Public route after including the provided Nginx locations:

```text
https://api.alazab.com/daftra/mcp
```
