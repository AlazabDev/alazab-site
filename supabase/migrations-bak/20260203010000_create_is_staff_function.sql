CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_role boolean;
BEGIN
  SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'manager', 'staff')
  ) INTO has_role;
  RETURN has_role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, check_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_exists boolean;
BEGIN
  SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE public.user_roles.user_id = $1
        AND public.user_roles.role = $2
  ) INTO role_exists;
  RETURN role_exists;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
