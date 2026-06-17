#!/usr/bin/env bash
set -u

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

ok() {
  printf "✅ %-4s %-6s %s\n" "$1" "$2" "$3"
}

ok_lock() {
  printf "✅🔒 %-4s %-6s %s\n" "$1" "$2" "$3"
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
      ok_lock "$code" "$method" "$url"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url"
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
      ok_lock "$code" "$method" "$url"
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
      ok_lock "$code" "$method" "$url"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url"
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
      ok_lock "$code" "$method" "$url"
      ;;
    401|403)
      ok_lock "$code" "$method" "$url"
      ;;
    *)
      bad "$code" "$method" "$url"
      ;;
  esac
}

check_whatsapp_verify() {
  local url="${BASE_URL}/api/webhook/whatsapp"
  local body

  body="$(curl -k -L -sS --max-time 10 "${url}?hub.mode=subscribe&hub.verify_token=${WHATSAPP_VERIFY_TOKEN}&hub.challenge=AZAB_TEST_OK" 2>/dev/null || true)"

  if [ "$body" = "AZAB_TEST_OK" ]; then
    ok_lock "200" "GET" "$url"
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
check_public GET "/auth/v1/status"
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
check_admin POST "/api/admin/ping-mcp" '{"tool":"ping"}'

echo
echo "===== WEBHOOK PROTECTED ====="
check_admin GET  "/api/webhook/config"
check_admin GET  "/api/webhook/events"
check_whatsapp_verify
check_admin POST "/api/webhook/test" '{"test":true}'
check_admin POST "/api/webhook/retry-mcp" '{"eventId":"TEST_ID"}'
check_admin POST "/api/webhook/whatsapp" '{}'

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
  code="$(curl_code "POST" "$url" '{"CallSid":"TEST","CallStatus":"completed"}' \
    -H "Content-Type:application/x-www-form-urlencoded")"
  
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
echo "===== DONE ====="
