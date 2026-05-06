
-- Create chatbot_knowledge table
CREATE TABLE public.chatbot_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  file_name TEXT,
  category TEXT NOT NULL DEFAULT 'عام',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read chatbot_knowledge" ON public.chatbot_knowledge
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin manage chatbot_knowledge" ON public.chatbot_knowledge
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Add client_phone and client_email to maintenance_requests
ALTER TABLE public.maintenance_requests
  ADD COLUMN client_phone TEXT,
  ADD COLUMN client_email TEXT;
