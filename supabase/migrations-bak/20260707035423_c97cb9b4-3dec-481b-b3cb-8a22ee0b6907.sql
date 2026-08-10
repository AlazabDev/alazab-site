
-- 1) project_comments: restrict UPDATE to admins
DROP POLICY IF EXISTS "Comments can be updated" ON public.project_comments;
CREATE POLICY "Admins can update comments"
  ON public.project_comments
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2) chatbot_knowledge: fix policy role scope (public -> authenticated)
DROP POLICY IF EXISTS "Allow admin manage chatbot_knowledge" ON public.chatbot_knowledge;

-- 3) templates: add explicit service_role write policies
DROP POLICY IF EXISTS "Service role manage templates" ON public.templates;
CREATE POLICY "Service role manage templates"
  ON public.templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
GRANT ALL ON public.templates TO service_role;

-- 4) Realtime authorization for admin_notifications channel
-- Only admins may subscribe/receive broadcasts on the 'admin_notifications' topic
DROP POLICY IF EXISTS "Admins can read admin_notifications realtime" ON realtime.messages;
CREATE POLICY "Admins can read admin_notifications realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() = 'admin_notifications' OR realtime.topic() LIKE 'admin_notifications:%')
    AND public.is_admin()
  );

-- 5) Storage: remove broad public SELECT on projects-media (files still accessible via public URLs)
DROP POLICY IF EXISTS "Public read projects-media" ON storage.objects;
CREATE POLICY "Admin list projects-media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'projects-media' AND public.is_admin());
