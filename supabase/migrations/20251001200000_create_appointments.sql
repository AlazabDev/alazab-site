CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 60,
    status text DEFAULT 'scheduled',
    location text,
    notes text,
    property_id uuid,
    vendor_id uuid,
    maintenance_request_id uuid,
    reminder_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    customer_name text,
    customer_phone text,
    customer_email text
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
  RETURN current_role;
END;
$$;
