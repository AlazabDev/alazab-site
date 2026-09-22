-- 1) Restrict infra tables reads to admin/data_engineer
DROP POLICY IF EXISTS "Authenticated users can read systems" ON public.systems;
DROP POLICY IF EXISTS "Authenticated users can read environments" ON public.environments;
DROP POLICY IF EXISTS "Authenticated users can read databases" ON public.databases;
DROP POLICY IF EXISTS "Authenticated users can read data sources" ON public.data_sources;

CREATE POLICY "Admins and data engineers can read systems" ON public.systems
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'data_engineer'::app_role));

CREATE POLICY "Admins and data engineers can read environments" ON public.environments
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'data_engineer'::app_role));

CREATE POLICY "Admins and data engineers can read databases" ON public.databases
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'data_engineer'::app_role));

CREATE POLICY "Admins and data engineers can read data sources" ON public.data_sources
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.has_role(auth.uid(), 'data_engineer'::app_role));

REVOKE SELECT ON public.systems FROM anon;
REVOKE SELECT ON public.environments FROM anon;
REVOKE SELECT ON public.databases FROM anon;
REVOKE SELECT ON public.data_sources FROM anon;

-- 2) sso_apps: no direct public read; expose a safe public view instead
DROP POLICY IF EXISTS "Anyone can view active apps" ON public.sso_apps;

CREATE POLICY "Admins can view apps" ON public.sso_apps
  FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE ALL ON public.sso_apps FROM anon;

CREATE OR REPLACE VIEW public.sso_apps_public
WITH (security_invoker = false) AS
  SELECT id, slug, name_ar, name_en, description_ar, description_en,
         base_url, logo_url, color, is_default, sort_order
  FROM public.sso_apps
  WHERE is_active = true;

GRANT SELECT ON public.sso_apps_public TO anon, authenticated;
GRANT ALL ON public.sso_apps TO service_role;