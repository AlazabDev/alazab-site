# Alazab Meta MCP — deployment and credential contract

## Paths
- Production source: `/var/www/core/alazab-site/server/mcp/meta`
- Shared dependencies: `server/package.json` and `server/package-lock.json`
- Shared runtime environment: `/var/www/core/alazab-site/server/.env`
- Reference only: `server/.env.production.example`
- External planned endpoint: `https://alazab.com/meta/mcp`
- Internal endpoint: `http://127.0.0.1:8187/mcp`

## Capabilities implemented
- Meta Graph token connectivity and readiness probe, portfolio discovery and per-business inventory
- Owned and shared Pages, Instagram, ad accounts, WhatsApp business accounts, apps, pixels and catalogs
- WhatsApp phone numbers/templates, Page-linked Instagram, optional Threads profile
- Multi-page Graph result iteration with explicit `complete` flag and per-edge permission errors
- Stateless MCP over Streamable HTTP, administrative and restricted Foundry Bearer credentials
- Read-only behavior; no modification of Meta assets by tools

## Mandatory credential setup — in server/.env ONLY
- `META_ACCESS_TOKEN` issued with relevant Meta business/asset read scopes.
- `META_MCP_ADMIN_KEY` random client API key used by the administrator.
- `META_MCP_FOUNDRY_KEY` separate random client API key, restricted by allowlists.
- `META_ALLOWED_BUSINESS_IDS` and `META_ALLOWED_WABA_IDS` comma-separated authorized IDs.
- `META_APP_ID`, `META_APP_SECRET` retained for future Meta OAuth integration.
- `META_THREADS_ACCESS_TOKEN` optional independently authorized token.
- Use the root environment example for host/port/origins/version.

**Important:** A Meta access token must be generated/approved via Meta. App ID and Secret alone do not grant business access.
This service does **not** yet implement the OAuth 2.1 authorization server and dynamic client registration that may be required by ChatGPT or Foundry MCP client registration. Static bearer configuration works only with clients supporting custom authorization headers. Do not announce production connectivity until the required client onboarding is tested.
The developer app API status/history are not exposed by these Graph tools; that requires supported Meta DevTools access.

## Deploy steps (after secret values are configured)
```bash
cd /var/www/core/alazab-site
git pull --ff-only origin main
cd server
npm ci
npm run mcp:meta:check
node --test mcp/meta/test/smoke.mjs
# After configuration: npm run mcp:meta
# curl -s http://127.0.0.1:8187/health
# curl -s http://127.0.0.1:8187/ready
```

Do not overwrite or duplicate the live server/.env. Before attaching the provided reverse proxy snippet to the site's active TLS vhost, confirm the internal /ready endpoint returns `ready: true` and the customer client can authenticate. `/health` only indicates process liveness.

## Required further implementation for the complete requested scope
1. OAuth 2.1/OIDC or equivalent hosted authorization server with per-user consent and robust multi-business token storage and refresh.
2. Meta Developer app-management discovery where the APIs permit it.
3. Full Threads authorization across each required profile (Threads is not a business-owned asset edge).
4. Agent-specific least-privilege tool policy, audit trail and explicit workflows for sending messages or altering ad campaigns.
5. Foundry and ChatGPT end-to-end connection tests and verified Nginx deployment.

No claim of finished production integration is made before these gates pass.
