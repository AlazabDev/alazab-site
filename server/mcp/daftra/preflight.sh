#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$HERE/../.." && pwd)"
cd "$SERVER_DIR"

fail() { echo "[DAFTRA-MCP][FAIL] $*" >&2; exit 1; }
pass() { echo "[DAFTRA-MCP][OK] $*"; }

[[ "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 24 ]] || fail "Node 24+ is required"
pass "Node $(node -v)"

OPENAPI="${DAFTRA_OPENAPI_FILE:-$HERE/openapi/Default module.openapi.json}"
[[ -f "$OPENAPI" ]] || fail "OpenAPI source missing: $OPENAPI"

python3 "$HERE/generate-catalog.py" "$OPENAPI" --expect 301 >/dev/null
pass "OpenAPI source = 301 operations / manifest+SHA verified"

DAFTRA_OPENAPI_FILE="$OPENAPI" DAFTRA_OPENAPI_EXPECT_OPERATIONS=301 DAFTRA_OPENAPI_STRICT_HASH=true node "$HERE/smoke-test.js" >/dev/null
pass "Registry + intent + schema smoke test"

[[ -n "${MCP_DAFTRA_API_KEY:-}" ]] || fail "MCP_DAFTRA_API_KEY is missing"
pass "MCP public authentication configured"

if [[ -n "${DAFTRA_ACCESS_TOKEN:-}" || -n "${DAFTRA_API_KEY:-}" ]]; then
  pass "Daftra static authentication configured"
elif [[ -n "${DAFTRA_OAUTH_CLIENT_ID:-}" && -n "${DAFTRA_OAUTH_CLIENT_SECRET:-}" && ( -n "${DAFTRA_OAUTH_REFRESH_TOKEN:-}" || ( -n "${DAFTRA_OAUTH_USERNAME:-}" && -n "${DAFTRA_OAUTH_PASSWORD:-}" ) ) ]]; then
  pass "Daftra OAuth authentication configured"
else
  fail "Configure DAFTRA_ACCESS_TOKEN, DAFTRA_API_KEY, or complete OAuth credentials"
fi

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
