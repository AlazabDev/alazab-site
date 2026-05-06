
-- Fix integrations: drop project_id policy, add admin policy
DROP POLICY IF EXISTS "integrations_project" ON public.integrations;
CREATE POLICY "Admin manage integrations"
  ON public.integrations FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix media_files: drop project_id policy
DROP POLICY IF EXISTS "media_files_project" ON public.media_files;

-- Fix webhook_endpoints: drop project_id policy, add admin policy
DROP POLICY IF EXISTS "webhook_endpoints_project" ON public.webhook_endpoints;
CREATE POLICY "Admin manage webhook_endpoints"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix workflows: drop project_id policy, add admin policy
DROP POLICY IF EXISTS "workflows_project" ON public.workflows;
CREATE POLICY "Admin manage workflows"
  ON public.workflows FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Fix workflow_steps: drop project_id policy, add admin policy
DROP POLICY IF EXISTS "workflow_steps_project" ON public.workflow_steps;
CREATE POLICY "Admin manage workflow_steps"
  ON public.workflow_steps FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
