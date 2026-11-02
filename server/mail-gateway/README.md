# Alazab Mail Gateway

Multi-account IMAP synchronization and SMTP sending gateway. Migadu remains the actual email provider: this service is not an MX or MTA.

## Install

```bash
cd /var/www/core/alazab-site/server/mail-gateway
npm install
cp .env.example .env
# Set secrets in .env; don't commit credentials
psql "$DATABASE_URL" -f schema.sql
npm run check && npm start
```

Use `openssl rand -hex 32` for MAIL_GATEWAY_ENCRYPTION_KEY and another distinct value for MAIL_GATEWAY_API_TOKEN. Bind to 127.0.0.1 and access through authenticated backend only. API requires Authorization: Bearer token.

## API

- GET /health
- POST /accounts {email,password,imapHost?,imapPort?,smtpHost?,smtpPort?}
- GET /accounts
- POST /accounts/:id/sync
- GET /accounts/:id/messages?limit=50
- POST /accounts/:id/send {to,subject,text,html?}
- GET /accounts/:id/outbox

## Next production steps

Enable per-user RBAC, sender domain policy, audits, retention rules, background worker, alert integrations, DNS-safe networking, attachment and folder management. Do not expose the administrative bearer API directly on the public Internet. Mailbox credentials and deployment have not been configured by these source files.
