# Alazab Central Webhook

مركز أحداث وتشغيل موحد داخل `alazab-site/server`.

## الهدف

- استقبال Webhooks من GitHub وأي خدمات داخلية أو خارجية.
- توحيد كل حدث في صيغة واحدة وتخزينه في PostgreSQL.
- إرسال إشعار WhatsApp إلى رقم الإدارة المخصص.
- استقبال أوامر تشغيل من نفس رقم WhatsApp Business عبر WhatsApp Flow أو رسائل تحكم محدودة.
- منع تنفيذ shell حر من WhatsApp؛ التنفيذ محصور في Command Catalog ثابت.
- تسجيل كل أمر وكل نتيجة في Audit Tables.

## Routes

```text
GET  /api/events/health
GET  /api/events/catalog                 X-Admin-Key required
GET  /api/events/whatsapp                Meta webhook verification
POST /api/events/whatsapp                WhatsApp Flow / command callback
POST /api/events/github                  GitHub webhook
POST /api/events/:source                 Signed generic webhook
```

## Generic webhook signature

Headers:

```text
X-Azab-Timestamp: <unix-seconds>
X-Azab-Signature: sha256=<HMAC_SHA256(secret, timestamp + "." + rawBody)>
```

Secret resolution:

1. `CENTRAL_WEBHOOK_SOURCE_SECRETS_JSON[source]`
2. `CENTRAL_WEBHOOK_SECRET`

GitHub uses its native `X-Hub-Signature-256` with `CENTRAL_GITHUB_WEBHOOK_SECRET`.

## WhatsApp topology

`CENTRAL_WHATSAPP_PHONE_NUMBER_ID` is the dedicated WhatsApp Business sender/receiver identity.

`CENTRAL_WHATSAPP_ADMIN_TO` is the admin destination that receives notifications. These are intentionally separate values: the business number sends to the administrator's WhatsApp account and receives commands back from authorized senders.

Only senders in `CENTRAL_WHATSAPP_COMMAND_ALLOWLIST` can execute commands.

## Flow response contract

WhatsApp Flow should return fields like:

```json
{
  "action": "pm2.restart",
  "target": "alazab-api"
}
```

Supported initial actions:

```text
system.health
server.disk
pm2.status
pm2.restart
nginx.test
nginx.reload
daftra.health
git.status
```

Mutating actions do not execute immediately. The server issues a short-lived confirmation token. The authorized sender must send:

```text
confirm <token>
```

The token is bound to the sender, action and target and expires automatically.

## Database

Initialize once:

```bash
cd /var/www/core/alazab-site/server
npm run webhook:central:init
```

Tables:

```text
ops.central_events
ops.command_runs
```

If PostgreSQL is temporarily unavailable, events are written to the local protected JSONL fallback log so receipt is not silently lost.

## Loop protection

Outbound WhatsApp delivery/status events are not re-notified to WhatsApp. Command replies also return their execution result directly instead of creating another outbound event notification loop.

## Production rule

The WhatsApp control surface never accepts arbitrary command strings, arbitrary executable paths or arbitrary PM2 targets. Add a new operation to the command catalog explicitly when it is approved for remote execution.
