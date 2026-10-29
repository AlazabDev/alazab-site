# Meta MCP — Alazab
The Meta MCP service lives at `server/mcp/meta` in the main `alazab-site` repository.

- Production filesystem: `/var/www/core/alazab-site/server/mcp/meta`
- Public MCP: `https://alazab.com/meta/mcp`
- Private listener: `127.0.0.1:8187/mcp`
- Clients: ChatGPT and Microsoft Foundry agents using Streamable HTTP.
- Admin access: `META_MCP_ADMIN_KEY` (read-only inventory).
- Foundry access: `META_MCP_FOUNDRY_KEY`, constrained by explicit business and WABA allowlists.
- Meta Graph authentication: `META_ACCESS_TOKEN` with Meta-granted scopes; Threads requires its own token.
- OAuth connection for ChatGPT/Foundry is not implemented in this initial service; static bearer credentials may be incompatible with some MCP hosts. Add OAuth 2.1/OIDC or a token-exchange gateway before production exposure.
- Only read-only discovery tools are exposed. No messaging, campaign changes, deletes, or token management.
- This code does **not** deploy itself and does not modify the site's current Nginx configuration.

## Deployment on Oracle
```bash
cd /var/www/core/alazab-site
git pull --ff-only origin main
cd server/mcp/meta
pnpm install --frozen-lockfile=false
node --check src/server.js
sudo install -d -m 700 /etc/alazab
sudo install -m 600 .env.example /etc/alazab/meta-mcp.env
# Fill the env file with credentials. Never commit it.
sudo cp deploy/meta-mcp.service /etc/systemd/system/alazab-meta-mcp.service
sudo systemctl daemon-reload
sudo systemctl enable --now alazab-meta-mcp
curl -sS http://127.0.0.1:8187/health
```
Install `deploy/nginx-location.conf` locations inside your existing alazab.com vhost and run `nginx -t` before reload. This must be done only after inspecting the existing config.
