# 🧪 أوامر اختبار دورة حياة طلب الصيانة عبر API Gateway

> **جميع الأوامر تستخدم `x-api-key` فقط — لا حاجة لـ SERVICE_ROLE_KEY إطلاقاً.**

## 🔑 المتغيرات الثابتة

```bash
export GATEWAY="https://zrrffsjbfkphridqyais.supabase.co/functions/v1/maintenance-gateway"
export API_KEY="0639988287e667c4c7801e34065105f3b80303c6d8d3c2f6dfee45cc7314aebe"
```

---

## 📌 المرحلة 0 — إنشاء طلب جديد

```bash
curl -sS -X POST "$GATEWAY" \
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
```

**المتوقع:** ستحصل على `request_id` و `request_number`. **سيصلك إشعار WhatsApp فوراً** بالنمط الجديد المنسّق.

احفظ المعرفات:
```bash
export REQ_ID="<ضع request_id من الرد هنا>"
export REQ_NUM="<ضع request_number من الرد هنا>"
```

---

## 📌 المرحلة 1 — استعلام عن حالة الطلب

```bash
curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"get_status\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\"
  }"
```

> ملاحظة: يمكن استخدام `request_number` بدلاً من `request_id`.

---

## 📌 المرحلة 2 — نقل الطلب إلى **triaged** (المراجعة)

```bash
curl -sS -X POST "$GATEWAY" \
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
```
**🔔 إشعار WhatsApp متوقع:** "تمت مراجعة طلبك في UberFix 📝..."

---

## 📌 المرحلة 3 — **assigned** (تعيين فني)

```bash
curl -sS -X POST "$GATEWAY" \
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
```
**🔔 إشعار WhatsApp:** رسالة المراجعة (assigned يُعرض كـ reviewed في خريطة العميل)

---

## 📌 المرحلة 4 — **scheduled** (جدولة الموعد)

```bash
curl -sS -X POST "$GATEWAY" \
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
```
**🔔 إشعار WhatsApp:** "تم تحديد موعد زيارة الفني لطلبك 🗓..."

---

## 📌 المرحلة 5 — **in_progress** (بدء التنفيذ)

```bash
curl -sS -X POST "$GATEWAY" \
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
```
**🔔 إشعار WhatsApp:** "بدأ تنفيذ أعمال الصيانة الخاصة بطلبك 🛠..."

---

## 📌 المرحلة 6 — **inspection** (الفحص)

```bash
curl -sS -X POST "$GATEWAY" \
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
```

---

## 📌 المرحلة 7 — **waiting_parts** (انتظار قطع غيار) — صامت

```bash
curl -sS -X POST "$GATEWAY" \
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
```
> هذه المرحلة لا ترسل إشعار (صامتة بالتصميم).

---

## 📌 المرحلة 8 — العودة إلى **in_progress**

```bash
curl -sS -X POST "$GATEWAY" \
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
```

---

## 📌 المرحلة 9 — **completed** (الإنتهاء)

```bash
curl -sS -X POST "$GATEWAY" \
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
```
**🔔 إشعار WhatsApp:** "تم الانتهاء من أعمال الصيانة بنجاح ✅..."

---

## 📌 المرحلة 10 — **billed** (إصدار الفاتورة) — صامت

```bash
curl -sS -X POST "$GATEWAY" \
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
```

---

## 📌 المرحلة 11 — **paid** (تم الدفع)

```bash
curl -sS -X POST "$GATEWAY" \
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
```

---

## 📌 المرحلة 12 — **closed** (الإغلاق النهائي)

```bash
curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"transition_stage\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"to_stage\": \"closed\",
    \"reason\": \"إغلاق نهائي\"
  }"
```
**🔔 إشعار WhatsApp:** "تم إغلاق طلب الصيانة بنجاح 🏁..."

---

## 🛠 أوامر إضافية

### إضافة ملاحظة على الطلب
```bash
curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"add_note\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"note\": \"العميل طلب التواصل بعد الساعة 5 مساءً\"
  }"
```

### إلغاء الطلب
```bash
curl -sS -X POST "$GATEWAY" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel\": \"api\",
    \"action\": \"cancel\",
    \"client_name\": \"x\",
    \"request_id\": \"$REQ_ID\",
    \"reason\": \"العميل ألغى الطلب\"
  }"
```

---

## 🔒 ملاحظات الأمان

- **المفتاح مقيد بالطلبات التي أنشأها هو فقط.** أي محاولة للتأثير على طلب أنشأه مفتاح آخر ستُرفض بـ `403`.
- **التحقق من المراحل القانونية فقط** — `fn_transition_request_stage` يرفض الانتقالات غير المسموحة من جدول `workflow_transitions`.
- **كل عملية مسجّلة** في `audit_logs` و `api_gateway_logs` مع معرف المستهلك و IP.
