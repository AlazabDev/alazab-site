# Meta MCP — integrated in Alazab server
- Source directory: `server/mcp/meta/`
- **One dependency manifest:** `server/package.json`
- **One runtime environment:** `server/.env`; template: `server/.env.production.example`
- No nested `package.json`, `node_modules`, or `.env`.
- Server entry: `server/mcp/meta/src/server.mjs`
- Public target: `https://alazab.com/meta/mcp`; private service `127.0.0.1:8187`
- Provides read-only Meta business and assets inventory using granted Graph API permissions.
- `META_MCP_ADMIN_KEY` is for administrative read-only access; `META_MCP_FOUNDRY_KEY` is further restricted by business and WABA allowlists.
- ChatGPT/Foundry OAuth authorization-server functionality is NOT implemented yet. Static bearer keys may not satisfy remote MCP connector onboarding; do not expose publicly before completing authentication.
- No production deployment or Nginx changes have been performed.

## Install on Oracle after reviewing root lockfile
```bash
cd /var/www/core/alazab-site
git pull --ff-only origin main
cd server
npm install
npm run mcp:meta:check
# Configure credentials in existing server/.env
npm run mcp:meta
```
For production use the provided `deploy/meta-mcp.service` systemd file (service working directory: `server`), and include `deploy/nginx-location.conf` locations in the EXISTING alazab.com Nginx vhost after inspection. Run `nginx -t` before reload.
