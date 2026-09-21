-- 1. auf_maintenance_receipts: restrict updates to admins (share reviewers go through guarded RPCs)
DROP POLICY IF EXISTS "Authenticated can review Abu Auf maintenance receipts" ON public.auf_maintenance_receipts;
CREATE POLICY "Admins can review Abu Auf maintenance receipts"
ON public.auf_maintenance_receipts
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. pn_audit: scope reads to project owners / admins
DROP POLICY IF EXISTS "pn_audit_read" ON public.pn_audit;
CREATE POLICY "pn_audit_read"
ON public.pn_audit
FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR actor_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.pn_projects p
    WHERE p.id = pn_audit.project_id AND p.created_by = auth.uid()
  )
);

-- 3. Revoke client EXECUTE on SECURITY DEFINER functions not meant to be called from the API
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, text, text, text, text, jsonb, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_bootstrap(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_draft(uuid, integer, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_save(uuid, integer, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_touch(uuid, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_get_state(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_report(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_get_item_notes(uuid, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_review_set_item_note(uuid, integer, integer, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auf_share_get_receipts(uuid, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.redeem_auf_share_link(text, text, text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_auf_share_session(uuid, text) FROM authenticated;