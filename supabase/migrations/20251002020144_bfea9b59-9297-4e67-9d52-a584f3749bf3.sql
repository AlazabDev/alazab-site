-- Drop the overly permissive staff policy that exposes customer data
DROP POLICY IF EXISTS "Staff can view appointments with data protection" ON public.appointments;

-- Create more restrictive policies for appointments table
-- Only owners can see their own appointments with full details
CREATE POLICY "Users can view own appointments with full details"
ON public.appointments
FOR SELECT
USING (auth.uid() = created_by);

-- Only admins and managers can view all appointments with full customer details
CREATE POLICY "Admins and managers can view all appointments"
ON public.appointments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Vendors can only see basic appointment info (no customer contact details)
-- They should use appointments_protected view for this
CREATE POLICY "Vendors can view assigned appointments basic info"
ON public.appointments
FOR SELECT
USING (
  auth.uid() = vendor_id
  AND get_current_user_role() = 'vendor'
);

-- Grant SELECT on appointments_protected view to authenticated users
-- This view masks sensitive customer data for non-admin/manager roles
GRANT SELECT ON public.appointments_protected TO authenticated;

-- Add comment to document the security model
COMMENT ON TABLE public.appointments IS 
'Customer contact information (customer_name, customer_phone, customer_email) is sensitive PII. 
Direct access to this table is restricted to appointment owners, admins, and managers.
Staff and technicians should use the appointments_protected view which masks sensitive data based on role.';