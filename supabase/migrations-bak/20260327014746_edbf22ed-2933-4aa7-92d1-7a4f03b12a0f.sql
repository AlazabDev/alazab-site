-- 1. Fix webhook_events public read - restrict to service_role only
DROP POLICY IF EXISTS "webhook_events_read" ON public.webhook_events;

-- 2. Restrict maintenance_requests read to admins only
DROP POLICY IF EXISTS "Authenticated read maintenance_requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "authenticated_read_requests" ON public.maintenance_requests;
CREATE POLICY "Admin read maintenance_requests" ON public.maintenance_requests
  FOR SELECT TO authenticated USING (is_admin());

-- 3. Restrict quotations read to admins or creator
DROP POLICY IF EXISTS "Authenticated read quotations" ON public.quotations;
CREATE POLICY "Admin or creator read quotations" ON public.quotations
  FOR SELECT TO authenticated USING (is_admin() OR created_by = auth.uid());