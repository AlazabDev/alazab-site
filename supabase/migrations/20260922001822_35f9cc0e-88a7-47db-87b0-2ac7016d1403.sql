-- Harden the mail system authorization helper: require an authenticated user
-- explicitly and never fall back to a permissive result.
CREATE OR REPLACE FUNCTION mail_private.effective_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  select case
    when auth.uid() is null then null
    when exists (
      select 1 from public.adp_user_roles
      where user_id = auth.uid() and role = 'platform_owner'::public.app_role
    ) then 'owner'
    when exists (
      select 1 from public.adp_user_roles
      where user_id = auth.uid() and role = 'platform_admin'::public.app_role
    ) then 'admin'
    else (
      select ma.role from public.mail_admins ma
      where ma.user_id = auth.uid()
      limit 1
    )
  end;
$function$;

CREATE OR REPLACE FUNCTION mail_private.is_authorized()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  select auth.uid() is not null
     and mail_private.effective_role() is not null;
$function$;

REVOKE ALL ON FUNCTION mail_private.effective_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION mail_private.is_authorized() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mail_private.effective_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mail_private.is_authorized() TO authenticated, service_role;