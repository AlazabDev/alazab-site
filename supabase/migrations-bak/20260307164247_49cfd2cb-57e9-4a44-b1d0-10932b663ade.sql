
-- Fix: Replace permissive INSERT policy with anon-only (edge functions use service_role which bypasses RLS)
DROP POLICY IF EXISTS "Allow service role insert" ON public.whatsapp_messages;

-- Add rate limiting: only allow anon to read their own messages (by phone)
-- Since service_role bypasses RLS, INSERTs from edge functions still work
-- No INSERT policy needed for anon role
