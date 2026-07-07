DROP POLICY IF EXISTS "Comments can be updated" ON public.project_comments;
DROP POLICY IF EXISTS "Only admins can update comments" ON public.project_comments;
CREATE POLICY "Only admins can update comments"
ON public.project_comments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());