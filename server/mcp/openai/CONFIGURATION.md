# Alazab OpenAI MCP — Production Configuration

This sidecar exposes the standards-compliant MCP endpoint used by ChatGPT Plugins and Codex while keeping the existing Alazab gateway on `127.0.0.1:4005` unchanged.

## Runtime

```text
Public MCP:          https://api.alazab.com/mcp
Protected metadata: https://api.alazab.com/.well-known/oauth-protected-resource
Sidecar:             http://127.0.0.1:4015
Existing gateway:    http://127.0.0.1:4005/call
```

## Confirmed Alazab AI Auth project

The AI Console repository pins its Supabase project in `supabase/config.toml` to:

```text
Project ref: ekgvdaigbhfpekuzijph
Auth URL:    https://ekgvdaigbhfpekuzijph.supabase.co
```

Do not substitute a different Alazab/UberFix Supabase project for MCP OAuth.

## Required production environment

Add these to the server-side production environment:

```dotenv
ALAZAB_AUTH_SUPABASE_URL=https://ekgvdaigbhfpekuzijph.supabase.co
ALAZAB_AUTH_SUPABASE_PUBLISHABLE_KEY=<publishable-key-for-ekgvdaigbhfpekuzijph>

OPENAI_MCP_AUTH_MODE=supabase
OPENAI_MCP_PUBLIC_ORIGIN=https://api.alazab.com
OPENAI_MCP_RESOURCE=https://api.alazab.com
OPENAI_MCP_HOST=127.0.0.1
OPENAI_MCP_PORT=4015
OPENAI_MCP_INTERNAL_GATEWAY_URL=http://127.0.0.1:4005/call
OPENAI_MCP_REQUIRED_SCOPE=email
OPENAI_MCP_ALLOWED_ROLES=admin,user
OPENAI_MCP_ALLOWED_ORIGINS=https://chatgpt.com,https://chat.openai.com,https://ai-azab.co,https://api.alazab.com
```

If the existing gateway has `MCP_REQUIRE_INTERNAL_KEY=true`, keep its current `MCP_INTERNAL_KEY`; the sidecar forwards that key only to the local `:4005/call` endpoint.

## Supabase Auth requirements

On project `ekgvdaigbhfpekuzijph`:

1. Enable **OAuth 2.1 Server**.
2. Enable **Dynamic Client Registration** so MCP clients can register automatically.
3. Set the authorization/consent path to:

```text
https://ai-azab.co/oauth/consent
```

4. Apply and enable the Custom Access Token Hook whose source is maintained in:

```text
AlazabDev/az-ai-gateway/supabase/snippets/alazab_mcp_oauth_audience_hook.sql
```

5. Verify OAuth-issued access tokens contain:

```text
iss = https://ekgvdaigbhfpekuzijph.supabase.co/auth/v1
aud = https://api.alazab.com
client_id = <OAuth client id>
exp = future timestamp
```

Normal non-OAuth Alazab sessions should not be changed by the hook.

## Read-only v0.1 tools

```text
maintenance_get_status
maintenance_catalog
daftra_list_products
daftra_list_clients
daftra_list_invoices
daftra_list_expenses
daftra_list_work_orders
```

No create/update/delete/approval/payment/raw-SQL/shell/secret-reading tools are exposed by this sidecar.

## Server validation

```bash
cd /var/www/core/alazab.com/server
node --check mcp/openai/server.js
node --check mcp/openai/smoke-test.js
OPENAI_MCP_AUTH_MODE=none NODE_ENV=development node mcp/openai/smoke-test.js
```

## PM2

The repository `ecosystem.config.js` contains a separate process named:

```text
alazab-openai-mcp
```

It listens on `127.0.0.1:4015`. The existing `alazab-mcp` process remains on `127.0.0.1:4005`.

## Nginx

The source snippet is:

```text
server/deploy/nginx/api-alazab-openai-mcp.locations.conf
```

Include its two exact locations inside the existing `api.alazab.com` TLS server block, then run `nginx -t` before reload. Do not replace the full server block blindly.
