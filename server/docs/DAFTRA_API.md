export GATEWAY="https://zrrffsjbfkphridqyais.supabase.co/functions/v1/maintenance-gateway"
export API_KEY="0639988287e667c4c7801e34065105f3b80303c6d8d3c2f6dfee45cc7314aebe"
azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "api",
    "client_name": "أحمد عزب - فرع أبوعوف",
    "client_phone": "01004006620",
    "service_type": "electrical",
    "description": "طلب صيانة لفرع أبوعوف",
    "priority": "high"
  }'
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2","channel":"api","created_at":"2026-06-30T22:02:27.azab@alazab-pc:/mnt/d/tools/mermaid$ export REQ_ID="07d31a70-9747-4528-aa60-e8e144121fb2"هنا>"
export REQ_NUM="AZ-UF-26-06-001074"
azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"get_status\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","status":"Open","workflow_stage":"submitted","workflow_stage_v2":"submitted","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2","created_at":"2026-06-30T22:02:27.093475+00:00","updated_at":"2026-06-30T22:02:27.093475+00:0azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"triaged\",
    \"reason\": \"بدء المراجعة\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"submitted","to_stage":"triaged","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azabazab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"assigned\",
    \"reason\": \"تم تعيين الفني\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"triaged","to_stage":"assigned","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azab@azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"scheduled\",
    \"reason\": \"تم تحديد موعد الزيارة\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"assigned","to_stage":"scheduled","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azaazab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"add_note\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"note\": \"العميل طلب التواصل بعد الساعة 5 مساءً\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","note_added":true}azab@alazab-pc:/mnt/d/tools/mermaid$
azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"in_progress\",
    \"reason\": \"بدء التنفيذ\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"scheduled","to_stage":"in_progress","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"inspection\",
    \"reason\": \"فحص العمل\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"in_progress","to_stage":"inspection","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \\
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"waiting_parts\",
    \"reason\": \"بانتظار قطع غيار\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"inspection","to_stage":"waiting_parts","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fbazab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"in_progress\",
    \"reason\": \"وصلت قطع الغيار\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"waiting_parts","to_stage":"in_progress","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fazab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \Y" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"completed\",
    \"reason\": \"تم إنهاء العمل\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"in_progress","to_stage":"completed","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"billed\",
    \"reason\": \"إصدار الفاتورة\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"completed","to_stage":"billed","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azab@azab@alazab-pc:/mnt/d/tools/mermaid$ curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"paid\",
    \"reason\": \"تم استلام المبلغ\"
  }"
{"success":true,"request_id":"07d31a70-9747-4528-aa60-e8e144121fb2","request_number":"AZ-UF-26-06-001074","from_stage":"billed","to_stage":"paid","track_url":"https://uberfix.alazab.com/track/07d31a70-9747-4528-aa60-e8e144121fb2"}azab@alazaazab@alazab-pc:/mnt/d/tools/mermaid$ 