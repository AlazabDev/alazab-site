#!/usr/bin/env bash
set -u

# Read-only discovery and missing-link audit. Run: bash ts-links.sh --missing
# This mode deliberately avoids the legacy POST/PUT/DELETE probes below.
audit_missing_links() {
  local base="${2:-${BASE_URL:-https://alazab.com}}"
  local report="${LINK_AUDIT_REPORT:-/tmp/alazab-missing-links.tsv}"
  local tmp
  tmp="$(mktemp)" || return 2
  trap 'rm -f "$tmp"' RETURN

  # The existing link-audit registry is the best currently available inventory.
  # Its parser is static and can miss dynamically registered routes.
  node - "$PWD" > "$tmp" <<'NODE'
const {buildRegistry} = require('./scripts/link-audit');
const routes = buildRegistry();
const seen = new Set();
for (const r of routes) {
  if (r.method !== 'GET') continue;
  if (/\bTEST_ID\b|\*/.test(r.path)) continue;
  if (/[?&#]/.test(r.path)) continue;
  if (seen.has(r.path)) continue;
  seen.add(r.path);
  process.stdout.write(r.path + '\n');
}
for (const p of ['/health','/ready','/api/health','/api/paytabs/ipn','/api/telemetry/health']) {
  if (!seen.has(p)) process.stdout.write(p + '\n');
}
NODE
  if [ "$?" -ne 0 ]; then
    echo "ERROR: Could not enumerate routes from scripts/link-audit.js" >&2
    return 2
  fi

  printf 'status\thttp\tpath\turl\n' > "$report"
  local path url http result count=0 missing=0 broken=0 protected=0 suspect=0 alive=0
  local response headers
  response="$(mktemp)" || return 2
  headers="$(mktemp)" || { rm -f "$response"; return 2; }
  while IFS= read -r path; do
    [ -n "$path" ] || continue
    url="${base%/}$path"
    # GET only; no credentials, redirects, or insecure TLS override.
    http="$(curl -sS --max-time 12 --connect-timeout 4 -D "$headers" -o "$response" -w '%{http_code}' "$url" 2>/dev/null)" || http="000"
    case "$http" in
      404|410) result="MISSING"; missing=$((missing+1));;
      401|403) result="PROTECTED"; protected=$((protected+1));;
      000|5??) result="BROKEN"; broken=$((broken+1));;
      200)
        if [[ "$path" == /api/* ]] && grep -qi '^content-type: *text/html' "$headers"; then
          result="SUSPECT_SPA"; suspect=$((suspect+1))
        else result="OK"; alive=$((alive+1)); fi;;
      301|302|303|307|308) result="REDIRECT"; alive=$((alive+1));;
      405) result="METHOD_MISMATCH"; suspect=$((suspect+1));;
      *) result="CHECK"; suspect=$((suspect+1));;
    esac
    printf '%s\t%s\t%s\t%s\n' "$result" "$http" "$path" "$url" >> "$report"
    printf '%-16s %-4s %s\n' "$result" "$http" "$path"
    count=$((count+1))
  done < "$tmp"
  rm -f "$response" "$headers"
  printf '\nChecked: %s | OK/redirect: %s | Missing: %s | Broken: %s | Protected: %s | Needs review: %s\n' "$count" "$alive" "$missing" "$broken" "$protected" "$suspect"
  printf 'Report: %s\n' "$report"
  echo 'Coverage: static GET routes from link-audit registry + known endpoints; not all dynamic routes or other hosts.'
  [ "$missing" -eq 0 ] && [ "$broken" -eq 0 ]
}

if [[ "${1:-}" == "--missing" ]]; then
  cd "$(dirname "${BASH_SOURCE[0]}")" || exit 2
  audit_missing_links "$@" 
  exit $?
fi


BASE_URL="https://alazab.com"
ENV_FILE=".env"

get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" 2>/dev/null | tail -n 1 | cut -d= -f2-
}

ADMIN_API_KEY="$(get_env ADMIN_API_KEY)"
ELEVENLABS_CHATBOT_API_KEY="$(get_env ELEVENLABS_CHATBOT_API_KEY)"
ELEVENLABS_ADMIN_API_KEY="$(get_env ELEVENLABS_ADMIN_API_KEY)"
WHATSAPP_VERIFY_TOKEN="$(get_env WHATSAPP_VERIFY_TOKEN)"
FACEBOOK_APP_SECRET="$(get_env FACEBOOK_APP_SECRET)"
META_APP_SECRET="$(get_env META_APP_SECRET)"
ELEVENLABS_WEBHOOK_SECRET="$(get_env ELEVENLABS_WEBHOOK_SECRET)"
MAINTENANCE_API_KEY="$(get_env MAINTENANCE_API_KEY)"

ok() {
  printf "✅ %-4s %-6s %s\n" "$1" "$2" "$3"
}

ok_lock() {
  if [ -n "${4:-}" ]; then
    printf "✅🔒 %-4s %-6s %-60s [Token: %s]\n" "$1" "$2" "$3" "$4"
  else
    printf "✅🔒 %-4s %-6s %s\n" "$1" "$2" "$3"
  fi
}

bad() {
  printf "❌ %-4s %-6s %s\n" "$1" "$2" "$3"
}

curl_code() {
  local method="$1"
  local url="$2"
  local payload="${3:-{}}"
  shift 3 || true

  if [ "$method" = "GET" ]; then
    curl -k -L -sS -o /dev/null -w "%{http_code}" --max-time 10 "$@" "$url" 2>/dev/null || echo "000"
  else
    curl -k -L -sS -o /dev/null -w "%{http_code}" --max-time 10 \
      -X "$method" \
      -H "Content-Type: application/json" \
      "$@" \
      --data "$payload" \
      "$url" 2>/dev/null || echo "000"
  fi
}


hmac_sha256_meta() {
  local body="$1"
  local secret="${FACEBOOK_APP_SECRET:-${META_APP_SECRET:-}}"

  node -e '
const crypto = require("crypto");
const body = process.argv[1];
const secret = process.argv[2] || "";
process.stdout.write("sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex"));
' "$body" "$secret"
}

check_meta_signed() {
  local method="$1"
  local path="$2"
  local payload="${3:-{\"object\":\"whatsapp_business_account\",\"entry\":[{\"id\":\"test\",\"changes\":[]}]}}"
  local url="${BASE_URL}${path}"
  local sig
  local code

  sig="$(hmac_sha256_meta "$payload")"

  code="$(curl_code "$method" "$url" "$payload" \
    -H "x-hub-signature-256: ${sig}")"

  case "$code" in
    200|201|202|204|301|302|304|400|405)
      ok_lock "$code" "$method" "$url" "META_SIG=${sig:0:15}..."
      ;;
    401|403)
      ok_lock "$code" "$method" "$url" "META_SIG=${sig:0:15}..."
      ;;
    *)
      bad "$code" "$method" "$url"
      ;;
  esac
}

check_public() {
  local method="$1"
  local path="$2"
  local payload="${3:-{}}"
  local url="${BASE_URL}${path}"
  local code

  code="$(curl_code "$method" "$url" "$payload")"

  case "$code" in
    200|201|202|204|301|302|304|400|405)
      ok "$code" "$method" "$url"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url" "(No Token / Auth Required)"
      ;;
    *)
      bad "$code" "$method" "$url"
      ;;
  esac
}

check_admin() {
  local method="$1"
  local path="$2"
  local payload="${3:-{}}"
  local url="${BASE_URL}${path}"
  local code

  code="$(curl_code "$method" "$url" "$payload" \
    -H "X-Admin-Key: ${ADMIN_API_KEY}" \
    -H "Authorization: Bearer ${ADMIN_API_KEY}")"

  case "$code" in
    200|201|202|204|301|302|304|400|405)
      ok_lock "$code" "$method" "$url" "${ADMIN_API_KEY}"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url" "${ADMIN_API_KEY}"
      ;;
    *)
      bad "$code" "$method" "$url"
      ;;
  esac
}

check_eleven_v1() {
  local method="$1"
  local path="$2"
  local payload="${3:-{}}"
  local url="${BASE_URL}${path}"
  local code

  code="$(curl_code "$method" "$url" "$payload" \
    -H "X-API-Key: ${ELEVENLABS_CHATBOT_API_KEY}" \
    -H "x-api-key: ${ELEVENLABS_CHATBOT_API_KEY}" \
    -H "X-Admin-Key: ${ELEVENLABS_ADMIN_API_KEY}" \
    -H "Authorization: Bearer ${ELEVENLABS_ADMIN_API_KEY}")"

  case "$code" in
    200|201|202|204|301|302|304|400|405)
      ok_lock "$code" "$method" "$url" "${ELEVENLABS_ADMIN_API_KEY}"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url" "${ELEVENLABS_ADMIN_API_KEY}"
      ;;
    *)
      bad "$code" "$method" "$url"
      ;;
  esac
}

check_whatsapp_verify() {
  local url="$1"
  local body

  body="$(curl -k -L -sS --max-time 10 "${url}?hub.mode=subscribe&hub.verify_token=${WHATSAPP_VERIFY_TOKEN}&hub.challenge=AZAB_TEST_OK" 2>/dev/null || true)"

  if [ "$body" = "AZAB_TEST_OK" ]; then
    ok_lock "200" "GET" "$url" "${WHATSAPP_VERIFY_TOKEN}"
  else
    bad "FAIL" "GET" "$url"
  fi
}

echo "===== PM2 ====="
pm2 jlist 2>/dev/null | node -e '
let d="";
process.stdin.on("data",x=>d+=x);
process.stdin.on("end",()=>{
  try {
    for (const app of JSON.parse(d)) {
      const ok = app.pm2_env.status === "online";
      console.log(`${ok ? "✅" : "❌"} ${app.pm2_env.status.padEnd(8)} ${app.name}`);
    }
  } catch {
    console.log("❌ PM2_STATUS_READ_FAILED");
  }
});
'

echo
echo "===== CORE ====="
check_public GET "/"
check_public GET "/health"
check_public GET "/ready"

echo
echo "===== API ====="
check_public GET "/api/v1"
check_public GET "/api/v1/status"
check_public POST "/api/v1/contact" "{}"
check_public POST "/api/v1/newsletter" "{}"
check_public GET "/auth/v1/status"
check_public GET "/auth/v1/callback"
check_public GET "/api/meta/health"

echo
echo "===== ELEVENLABS ====="
check_public GET  "/api/elevenlabs/health"
check_public GET  "/api/elevenlabs/config"
check_public GET  "/api/elevenlabs/events"
check_public POST "/api/elevenlabs/signed-url" '{}'
check_public POST "/api/elevenlabs/webhook" '{}'

echo
echo "===== ELEVENLABS V1 PROTECTED ====="
check_public    GET  "/api/v1/elevenlabs"
check_public    GET  "/api/v1/elevenlabs/health"
check_eleven_v1 GET  "/api/v1/elevenlabs/config"
check_eleven_v1 GET  "/api/v1/elevenlabs/events"
check_eleven_v1 POST "/api/v1/elevenlabs/session" "{\"agent_id\":\"$(get_env ELEVENLABS_AGENT_ID)\"}"
check_eleven_v1 POST "/api/v1/elevenlabs/conversation-token" "{\"agent_id\":\"$(get_env ELEVENLABS_AGENT_ID)\"}"
check_eleven_v1 POST "/api/v1/elevenlabs/signed-url" "{\"agent_id\":\"$(get_env ELEVENLABS_AGENT_ID)\"}"
check_eleven_v1 POST "/api/v1/elevenlabs/webhook" '{}'

echo
echo "===== TELEGRAM ====="
check_public GET "/api/auth/telegram/health"
check_public GET "/api/auth/telegram/config"
check_public GET "/api/auth/telegram/start"
check_public GET "/api/auth/telegram/callback"

echo
echo "===== ADMIN PROTECTED ====="
check_admin GET  "/api/admin/status"
check_admin GET  "/api/admin/env"
check_admin GET  "/api/admin/metrics"
check_admin GET  "/api/admin/logs"
check_admin GET  "/api/admin/log-files"
check_admin GET  "/api/admin/routes"
check_admin GET  "/api/admin/services"
check_admin POST "/api/admin/services/action" '{"action":"status","service":"all"}'
check_admin GET  "/api/admin/link-audit"
check_admin POST "/api/admin/ping-mcp" '{"tool":"ping"}'

echo
echo "===== MCP PROTECTED ====="
check_admin GET  "/api/mcp/health"
check_admin GET  "/api/mcp/tools"
check_admin GET  "/api/mcp/catalog/daftra"
check_admin GET  "/api/mcp/catalog/maintenance"
check_admin POST "/api/mcp/call" '{}'
check_admin POST "/api/mcp/mcp" '{}'
check_admin POST "/api/mcp/v1" '{}'

echo
echo "===== META PROTECTED ====="
check_admin GET    "/api/meta/accounts"
check_admin POST   "/api/meta/accounts" '{}'
check_admin GET    "/api/meta/accounts/TEST_ID"
check_admin PUT    "/api/meta/accounts/TEST_ID" '{}'
check_admin DELETE "/api/meta/accounts/TEST_ID"
check_admin GET    "/api/meta/accounts/TEST_ID/stats"
check_admin GET    "/api/meta/messages/TEST_ID"
check_admin GET    "/api/meta/messages/TEST_ID/conversations"
check_admin POST   "/api/meta/messages/TEST_ID/send" '{}'

echo
echo "===== WEBHOOK PROTECTED ====="
check_admin GET  "/api/webhook/config"
check_admin GET  "/api/webhook/events"
check_whatsapp_verify "${BASE_URL}/api/webhook/whatsapp"
check_whatsapp_verify "${BASE_URL}/auth/meta-app/webhook"
check_whatsapp_verify "${BASE_URL}/webhook/wauf/whatsapp"
check_whatsapp_verify "${BASE_URL}/api/v1/webhook/wauf/whatsapp"
check_admin POST "/api/webhook/test" '{"test":true}'
check_admin POST "/api/webhook/retry-mcp" '{"eventId":"TEST_ID"}'
check_admin POST "/api/webhook/whatsapp" '{}'

echo
echo "===== WEBHOOK TOOL PROTECTED ====="
check_admin GET    "/api/webhook-tool/config"
check_admin GET    "/api/webhook-tool/events"
check_admin DELETE "/api/webhook-tool/events/TEST_ID"
check_admin GET    "/api/webhook-tool/stats"
check_admin POST   "/api/webhook-tool/retry" '{}'
check_admin POST   "/api/webhook-tool/send" '{}'

echo
echo "===== WHATSAPP SEAFILE & LEGACY ====="
check_public GET "/api/whatsapp-seafile/health"
check_public POST "/webhook/wauf/whatsapp" "{}"
check_public POST "/api/v1/webhook/wauf/whatsapp" "{}"

echo
echo
echo "===== TWILIO ====="
check_twilio_voice_webhook() {
  local url="${BASE_URL}/api/twilio/voice/incoming"
  # Twilio voice webhook يجب أن يرد بـ TwiML (XML) وليس JSON
  local response
  response=$(curl -k -L -sS --max-time 10 -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=%2B1234567890&CallStatus=ringing&CallSid=TEST_CALL_123" \
    "${url}" 2>/dev/null | head -c 200)
  
  if echo "$response" | grep -qi "<Response>" || echo "$response" | grep -qi "<Gather>"; then
    ok_lock "200" "POST" "$url (TwiML)"
  else
    bad "FAIL" "POST" "$url"
  fi
}

check_twilio_message_webhook() {
  local url="${BASE_URL}/api/twilio/message/incoming"
  local response
  response=$(curl -k -L -sS --max-time 10 -X POST \
    -H "Content-Type:application/x-www-form-urlencoded" \
    -d "From=%2B1234567890&Body=Hello&MessageSid=TEST_MSG_123" \
    "${url}" 2>/dev/null)
  
  if echo "$response" | grep -qi "<Response>" || echo "$response" | grep -qi "<Message>"; then
    ok_lock "200" "POST" "$url"
  else
    bad "FAIL" "POST" "$url"
  fi
}

check_twilio_status() {
  local url="${BASE_URL}/api/twilio/status"
  local code
  code="$(curl -k -L -sS -o /dev/null -w "%{http_code}" --max-time 10 -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "CallSid=TEST&CallStatus=completed" "$url" 2>/dev/null || true)"
  
  case "$code" in
    200|201|202|204) ok_lock "$code" "POST" "$url" ;;
    *) bad "$code" "POST" "$url" ;;
  esac
}

check_twilio_health() {
  check_public GET "/api/twilio/health"
}

# تنفيذ فحوصات Twilio
check_twilio_health
check_twilio_voice_webhook
check_twilio_message_webhook
check_twilio_status
echo "===== MCP Server (SSE & Messages) ====="
# SSE keeps connection open, so we use max-time 2 and ignore the timeout exit code
code="$(curl -k -L -sS -o /dev/null -w "%{http_code}" --max-time 2 -H "x-api-key: ${MAINTENANCE_API_KEY}" "${BASE_URL}/mcp-uberfix/sse" 2>/dev/null || true)"
# The output might be just "200"
case "$code" in
  200|201|202|204) ok_lock "200" "GET" "${BASE_URL}/mcp-uberfix/sse" "${MAINTENANCE_API_KEY}" ;;
  *) bad "$code" "GET" "${BASE_URL}/mcp-uberfix/sse" ;;
esac

# Check without key to ensure it rejects unauthorized access
code_unauth="$(curl -k -L -sS -o /dev/null -w "%{http_code}" --max-time 2 "${BASE_URL}/mcp-uberfix/sse" 2>/dev/null || true)"
if [ "$code_unauth" = "401" ]; then
  ok_lock "401" "GET" "${BASE_URL}/mcp-uberfix/sse (Unauthorized Check Passed)" "(No Token)"
else
  bad "$code_unauth" "GET" "${BASE_URL}/mcp-uberfix/sse (VULNERABILITY: Missing 401)"
fi

echo "===== DONE ====="
