
DROP POLICY IF EXISTS "Public read projects-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload to projects-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete from projects-media" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Service role storage access" ON storage.objects;

CREATE POLICY "Public read projects-media"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'projects-media');

CREATE POLICY "Admin upload to projects-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'projects-media' AND public.is_admin());

CREATE POLICY "Admin delete from projects-media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'projects-media' AND public.is_admin());

CREATE POLICY "Admin manage media bucket"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'media' AND public.is_admin())
  WITH CHECK (bucket_id = 'media' AND public.is_admin());

CREATE POLICY "Service role storage access"
  ON storage.objects FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
