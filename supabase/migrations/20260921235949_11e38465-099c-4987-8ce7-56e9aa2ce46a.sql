DROP VIEW IF EXISTS public.sso_apps_public;

CREATE VIEW public.sso_apps_public
WITH (security_invoker = true) AS
  SELECT id, slug, name_ar, name_en, description_ar, description_en,
         base_url, logo_url, color, is_default, sort_order
  FROM public.sso_apps
  WHERE is_active = true;

GRANT SELECT ON public.sso_apps_public TO anon, authenticated;

CREATE POLICY "Public can view active apps" ON public.sso_apps
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Column-level grants: no access to redirect_url / allowed_roles / is_active timestamps internals
REVOKE SELECT ON public.sso_apps FROM anon, authenticated;
GRANT SELECT (id, slug, name_ar, name_en, description_ar, description_en, base_url, logo_url, color, is_default, sort_order, is_active)
  ON public.sso_apps TO anon, authenticated;