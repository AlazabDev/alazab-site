-- Knowledge base entries for training the chatbot
CREATE TABLE public.chatbot_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'file', 'url')),
  file_name TEXT,
  file_url TEXT,
  category TEXT DEFAULT 'عام',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat conversations
CREATE TABLE public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages
CREATE TABLE public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Knowledge: admins/managers can CRUD, everyone can read active entries
CREATE POLICY "Anyone can read active knowledge" ON public.chatbot_knowledge
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage knowledge" ON public.chatbot_knowledge
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Conversations: open access for chatbot usage
CREATE POLICY "Anyone can manage conversations" ON public.chatbot_conversations
  FOR ALL USING (true) WITH CHECK (true);

-- Messages: open access
CREATE POLICY "Anyone can read messages" ON public.chatbot_messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert messages" ON public.chatbot_messages
  FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_chatbot_knowledge_updated_at
  BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for training files
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chatbot-files', 'chatbot-files', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload chatbot files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chatbot-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins can read chatbot files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'chatbot-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins can delete chatbot files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'chatbot-files' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')));