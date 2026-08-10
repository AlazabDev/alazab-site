
-- 1) Hide project budget from anonymous visitors (admins/authenticated still see it)
REVOKE SELECT (budget) ON public.projects FROM anon;

-- 2) Admin read policies for conversation-related tables
CREATE POLICY "Admin read conversations"
ON public.conversations FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin read conversation_analytics"
ON public.conversation_analytics FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin read followup_tasks"
ON public.followup_tasks FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin read whatsapp_conversations"
ON public.whatsapp_conversations FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin read webhook_logs"
ON public.webhook_logs FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admin read media_messages"
ON public.media_messages FOR SELECT TO authenticated USING (public.is_admin());

-- 3) Explicit deny on login_otp for non-service roles (defense in depth)
CREATE POLICY "Block authenticated read login_otp"
ON public.login_otp FOR SELECT TO authenticated, anon USING (false);

CREATE POLICY "Block authenticated write login_otp"
ON public.login_otp FOR INSERT TO authenticated, anon WITH CHECK (false);
