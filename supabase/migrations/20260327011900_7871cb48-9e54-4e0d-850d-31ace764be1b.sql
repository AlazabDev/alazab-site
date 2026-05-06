-- 1. Remove password_hash column from users table
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- 2. Drop public read policy on whatsapp_messages
DROP POLICY IF EXISTS "Allow public read for realtime" ON public.whatsapp_messages;

-- 3. Restrict quotation_line_items read to admins only
DROP POLICY IF EXISTS "Authenticated read quotation_line_items" ON public.quotation_line_items;
CREATE POLICY "Admin read quotation_line_items" ON public.quotation_line_items
  FOR SELECT TO authenticated USING (is_admin());

-- 4. Prevent privilege escalation on user_roles - block authenticated writes
DROP POLICY IF EXISTS "Block user write to roles" ON public.user_roles;
CREATE POLICY "Block authenticated write to user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block authenticated update to user_roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (false);
CREATE POLICY "Block authenticated delete from user_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (false);

-- 5. Remove role column from users table (use user_roles table instead)
ALTER TABLE public.users DROP COLUMN IF EXISTS role;