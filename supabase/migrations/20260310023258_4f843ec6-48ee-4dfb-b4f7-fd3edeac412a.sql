
-- Create mr_status enum
CREATE TYPE public.mr_status AS ENUM ('Open', 'InProgress', 'Completed', 'Cancelled');

-- Create branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read branches" ON public.branches
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert branches" ON public.branches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated manage categories" ON public.categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create maintenance_requests table
CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  client_name TEXT,
  service_type TEXT,
  description TEXT,
  location TEXT,
  priority TEXT DEFAULT 'medium',
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  status public.mr_status NOT NULL DEFAULT 'Open',
  branch_id UUID REFERENCES public.branches(id),
  company_id UUID,
  sla_due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read maintenance_requests" ON public.maintenance_requests
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert maintenance_requests" ON public.maintenance_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated manage maintenance_requests" ON public.maintenance_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create user_roles table for admin checks
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Service role manages roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Insert default data
INSERT INTO public.branches (name) VALUES 
  ('الرياض'), ('جدة'), ('مكة'), ('المدينة'), ('الدمام'), ('الخبر');

INSERT INTO public.categories (name) VALUES 
  ('صيانة عامة'), ('صيانة كهربائية'), ('صيانة سباكة'), ('صيانة تكييف'), ('صيانة أجهزة'), ('أخرى');
