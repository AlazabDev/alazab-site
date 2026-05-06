
-- 1. Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fix maintenance_requests: restrict DELETE to admins only
DROP POLICY IF EXISTS "Authenticated delete maintenance_requests" ON public.maintenance_requests;
CREATE POLICY "Admin delete maintenance_requests" ON public.maintenance_requests
  FOR DELETE TO authenticated
  USING (is_admin());

-- 3. Fix media_files: remove overly broad read policy
DROP POLICY IF EXISTS "read media" ON public.media_files;
CREATE POLICY "Admin read media_files" ON public.media_files
  FOR SELECT TO authenticated
  USING (is_admin());

-- 4. Storage RLS policies - protect buckets
CREATE POLICY "Public read projects-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'projects-media');

CREATE POLICY "Admin write projects-media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'projects-media' AND is_admin());

CREATE POLICY "Admin update projects-media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'projects-media' AND is_admin());

CREATE POLICY "Admin delete projects-media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'projects-media' AND is_admin());

CREATE POLICY "Admin read media bucket" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admin write media bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admin update media bucket" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND is_admin());

CREATE POLICY "Admin delete media bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND is_admin());

CREATE POLICY "Service role media" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
