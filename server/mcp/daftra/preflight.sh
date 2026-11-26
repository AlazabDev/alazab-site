#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$HERE/../.." && pwd)"
cd "$SERVER_DIR"

fail() { echo "[DAFTRA-MCP][FAIL] $*" >&2; exit 1; }
pass() { echo "[DAFTRA-MCP][OK] $*"; }

[[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 24 ]] || fail "Node 24+ is required"
pass "Node $(node -v)"

node "$HERE/validate-catalog.js" >/dev/null || fail "OpenAPI contract invalid"
pass "Pinned OpenAPI contract: 301 operations / 70 groups"

DAFTRA_OPENAPI_STRICT_HASH=true node -r dotenv/config "$HERE/smoke-test.js" >/dev/null
pass "Registry + intent + schema smoke test"

node -r dotenv/config -e '
const e = process.env;
if (!e.MCP_DAFTRA_API_KEY) throw Error("MCP_DAFTRA_API_KEY is missing");
if (!(e.DAFTRA_ACCESS_TOKEN || e.DAFTRA_API_KEY ||
  (e.DAFTRA_OAUTH_CLIENT_ID && e.DAFTRA_OAUTH_CLIENT_SECRET &&
  (e.DAFTRA_OAUTH_REFRESH_TOKEN || (e.DAFTRA_OAUTH_USERNAME && e.DAFTRA_OAUTH_PASSWORD))))) {
  throw Error("Daftra authentication is not configured");
}
require("./mcp/daftra/server").buildServer();
' || fail "Authentication configuration or tool registration"
pass "Authentication configuration + MCP tool registration"

if ss -ltn 2>/dev/null | awk '{print $4}' | grep -Eq '(^|:)4007$'; then
  echo "[DAFTRA-MCP][INFO] port 4007 is already listening"
else
  pass "port 4007 is free"
fi

node --check "$HERE/server.js"
node --check "$HERE/client.js"
node --check "$HERE/registry.js"
node --check "$HERE/resolver.js"
node --check "$HERE/planner.js"
node --check "$HERE/verifier.js"
pass "JavaScript syntax"

echo "[DAFTRA-MCP] PREFLIGHT PASSED"
