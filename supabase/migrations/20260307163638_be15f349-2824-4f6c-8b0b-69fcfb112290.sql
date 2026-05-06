
-- جدول رسائل واتساب
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id TEXT,
  phone_number TEXT NOT NULL,
  customer_name TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- فهرس للبحث برقم الهاتف
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_created ON public.whatsapp_messages(created_at DESC);

-- تفعيل RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة (لاستقبال الردود في الدردشة)
CREATE POLICY "Allow public read for realtime" ON public.whatsapp_messages
  FOR SELECT USING (true);

-- سياسة الإدراج من service_role فقط (Edge Functions)
CREATE POLICY "Allow service role insert" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (true);

-- تحديث updated_at
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
