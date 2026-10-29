#!/usr/bin/env bash
set -Eeuo pipefail

# Deploy only Meta MCP; never create Nginx backup files or touch other services.
ROOT="/var/www/core/alazab-site"
SERVER="$ROOT/server"
DEPLOY="$SERVER/mcp/meta/deploy"
NGINX_SITE="/etc/nginx/sites-available/alazab.com"
NGINX_SNIPPET="/etc/nginx/snippets/alazab-meta-mcp.conf"
SERVICE="/etc/systemd/system/alazab-meta-mcp.service"

if (( EUID != 0 )); then echo "Run with sudo/root" >&2; exit 1; fi
for f in "$SERVER/.env" "$DEPLOY/nginx-location.conf" "$DEPLOY/meta-mcp.service" "$NGINX_SITE"; do
  [[ -f "$f" ]] || { echo "Missing: $f" >&2; exit 1; }
done
command -v nginx >/dev/null
command -v systemctl >/dev/null
[[ -x /usr/bin/node ]] || { echo "Missing /usr/bin/node" >&2; exit 1; }

# Do not expose or duplicate credentials; read existing unified server/.env only.
python3 - "$SERVER/.env" <<'PY'
import sys
from pathlib import Path
keys = {}
for line in Path(sys.argv[1]).read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        k, v = line.split('=', 1)
        keys[k.strip()] = v.strip().strip('"').strip("'")
required = ['META_ACCESS_TOKEN', 'META_MCP_ADMIN_KEY', 'META_MCP_FOUNDRY_KEY']
missing = [k for k in required if not keys.get(k)]
if not (keys.get('META_BUSINESS_ID') or keys.get('META_ALLOWED_BUSINESS_IDS')):
    missing.append('META_BUSINESS_ID')
if missing:
    raise SystemExit('Missing Meta MCP settings in server/.env: ' + ', '.join(missing))
print('Meta MCP environment: configured')
PY

install -m 0644 "$DEPLOY/nginx-location.conf" "$NGINX_SNIPPET"
# Modify ONLY the existing alazab.com HTTPS server block.
# Preserve unrelated locations, HTTP/ACME, certificates and all other sites.
python3 - "$NGINX_SITE" "$NGINX_SNIPPET" <<'PY'
import re, subprocess, sys
from pathlib import Path
site = Path(sys.argv[1])
snippet = sys.argv[2]
before = site.read_text()
match = re.search(r'(?m)^server\s*\{(?:(?!^server\s*\{)[\s\S])*?listen\s+443\s+ssl\b', before)
if not match:
    raise SystemExit('alazab.com HTTPS server block not found')
start = match.start()
next_server = re.search(r'(?m)^server\s*\{', before[match.end():])
end = match.end() + next_server.start() if next_server else len(before)
block = before[start:end]
if not re.search(r'(?m)^\s*server_name\s+[^;]*\balazab\.com\b', block):
    raise SystemExit('HTTPS server does not match alazab.com')
# If previous one-off exact routes exist, remove only those routes.
for route in ('/meta/mcp', '/meta/health'):
    pat = re.compile(r'(?m)^\s*location\s*=\s*' + re.escape(route) + r'\s*\{[^{}]*\}\s*\n')
    block = pat.sub('\n', block)
include_line = f'    include {snippet};'
block = block.replace(include_line, '')
anchor = re.search(r'(?m)^\s*location\s+/meta/\s*\{', block)
if not anchor:
    raise SystemExit('Existing /meta/ location not found; no changes made')
block = block[:anchor.start()] + include_line + '\n\n' + block[anchor.start():]
after = before[:start] + block + before[end:]
if before != after:
    site.write_text(after)
    try:
        check = subprocess.run(['nginx', '-t'], capture_output=True, text=True)
        if check.returncode:
            raise RuntimeError(check.stdout + check.stderr)
    except Exception:
        site.write_text(before)  # rollback in memory; no backup file created
        raise
else:
    check = subprocess.run(['nginx', '-t'], check=True)
print('Nginx Meta MCP include installed and validated')
PY

install -m 0644 "$DEPLOY/meta-mcp.service" "$SERVICE"
systemctl daemon-reload
systemctl enable --now alazab-meta-mcp.service
systemctl restart alazab-meta-mcp.service
systemctl reload nginx
echo "Meta MCP deployed: https://alazab.com/meta/mcp"
