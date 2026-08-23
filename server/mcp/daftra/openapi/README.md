# Daftra OpenAPI source

Place the authoritative file here as:

```text
Default module.openapi.json
```

Production runtime refuses to start unless it contains exactly **301 operations**. With `DAFTRA_OPENAPI_STRICT_HASH=true`, its SHA256 must be:

```text
c264e9df687a75f7aec5f06e1d25c5f931cf01937069ae4003c1802eb0102c63
```

Validate from `server/`:

```bash
npm run mcp:daftra:catalog
sha256sum "mcp/daftra/openapi/Default module.openapi.json"
npm run mcp:daftra:smoke
```

Do not substitute the older generated `mcp/catalog/daftra-operations.json`; that catalog contains only 200 operations and is retained only for the legacy MCP gateway.
