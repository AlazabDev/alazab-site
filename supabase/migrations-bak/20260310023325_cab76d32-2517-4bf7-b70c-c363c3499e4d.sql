
-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'جديد',
  location TEXT,
  category TEXT,
  cover_image_url TEXT,
  model_3d_url TEXT,
  progress INTEGER DEFAULT 0,
  company_name TEXT,
  budget NUMERIC,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read projects" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated manage projects" ON public.projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
