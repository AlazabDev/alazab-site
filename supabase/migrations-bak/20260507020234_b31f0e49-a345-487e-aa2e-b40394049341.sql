
-- Explicit deny on otp_codes for non-service roles
CREATE POLICY "Block authenticated read otp_codes"
ON public.otp_codes FOR SELECT TO authenticated, anon USING (false);

CREATE POLICY "Block authenticated write otp_codes"
ON public.otp_codes FOR INSERT TO authenticated, anon WITH CHECK (false);

-- Tighten chatbot_knowledge admin policy to authenticated role only
DROP POLICY IF EXISTS "Allow admin manage chatbot_knowledge" ON public.chatbot_knowledge;

CREATE POLICY "Admin manage chatbot_knowledge"
ON public.chatbot_knowledge FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());
