
-- Drop redundant service_role ALL policies with USING(true); service_role bypasses RLS anyway.
DROP POLICY IF EXISTS service_role_all ON public.conversations;
DROP POLICY IF EXISTS service_role_all_media ON public.media_messages;
DROP POLICY IF EXISTS service_role_all_analytics ON public.conversation_analytics;
DROP POLICY IF EXISTS service_role_all_tasks ON public.followup_tasks;
DROP POLICY IF EXISTS service_role_all_whatsapp_conv ON public.whatsapp_conversations;
DROP POLICY IF EXISTS service_role_all_webhook_logs ON public.webhook_logs;
DROP POLICY IF EXISTS "Service role manage templates" ON public.templates;

-- Tighten public INSERT policies so submitters cannot pre-approve or forge server-side flags.
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.project_comments;
CREATE POLICY "Anyone can insert comments"
  ON public.project_comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_approved IS NOT TRUE);

DROP POLICY IF EXISTS "Anyone can submit reviews" ON public.project_reviews;
CREATE POLICY "Anyone can submit reviews"
  ON public.project_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (is_approved = false AND rating BETWEEN 1 AND 5);

DROP POLICY IF EXISTS "anyone can insert estimates" ON public.cost_estimate_requests;
CREATE POLICY "anyone can insert estimates"
  ON public.cost_estimate_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (client_name IS NOT NULL AND client_phone IS NOT NULL);
