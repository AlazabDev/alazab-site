-- public.adp_security_events already exists in production. Extend it safely.
ALTER TABLE public.adp_security_events
  ADD COLUMN IF NOT EXISTS webhook_event_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS adp_security_events_webhook_hash_idx
  ON public.adp_security_events (webhook_event_hash)
  WHERE webhook_event_hash IS NOT NULL;
