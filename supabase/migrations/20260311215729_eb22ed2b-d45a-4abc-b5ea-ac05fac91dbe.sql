
-- WhatsApp messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id text,
  phone_number text NOT NULL,
  customer_name text,
  direction text NOT NULL DEFAULT 'outbound',
  message_type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  media_mime_type text,
  status text DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages whatsapp_messages" ON public.whatsapp_messages
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Authenticated read whatsapp_messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (true);

-- App secrets table
CREATE TABLE IF NOT EXISTS public.app_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages app_secrets" ON public.app_secrets
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admin read app_secrets" ON public.app_secrets
  FOR SELECT TO authenticated USING (public.is_admin());

-- WhatsApp flows table
CREATE TABLE IF NOT EXISTS public.whatsapp_flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_flow_id text UNIQUE,
  name text NOT NULL,
  status text DEFAULT 'DRAFT',
  categories text[],
  validation_errors jsonb,
  json_version text,
  preview_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read whatsapp_flows" ON public.whatsapp_flows
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin manage whatsapp_flows" ON public.whatsapp_flows
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Service role manages whatsapp_flows" ON public.whatsapp_flows
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
