-- =====================================================
-- COMPLETE DATABASE SCHEMA
-- Consolidated from all migration files
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. ENUM TYPES
-- =====================================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'staff', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 3. HELPER FUNCTIONS (needed before RLS policies)
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Check if user is staff (admin or staff)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  );
$$;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. CORE TABLES
-- =====================================================

-- 4.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4.2 user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- 5. DOCUMENTS TABLES
-- =====================================================

-- 5.1 documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  daftra_id TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('invoice', 'quote', 'estimate')),
  number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'needs_fix', 'ready_to_approve', 'approved', 'signed', 'archived')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
  pdf_url TEXT,
  html_url TEXT,
  raw_json JSONB,
  synced_at TIMESTAMP WITH TIME ZONE,
  assigned_reviewer_id UUID REFERENCES auth.users(id),
  assigned_approver_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  -- Added in later migrations
  title TEXT,
  description TEXT,
  sender_name TEXT,
  project_id TEXT,
  magicplan_gallery_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.documents.magicplan_gallery_url IS 'MagicPlan photo gallery URL for the project';

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Staff policies
DROP POLICY IF EXISTS "Staff can view all documents" ON public.documents;
CREATE POLICY "Staff can view all documents"
  ON public.documents FOR SELECT
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert documents" ON public.documents;
CREATE POLICY "Staff can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can update documents" ON public.documents;
CREATE POLICY "Staff can update documents"
  ON public.documents FOR UPDATE
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete documents" ON public.documents;
CREATE POLICY "Admins can delete documents"
  ON public.documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public policies (for upload/quote flow)
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documents;
CREATE POLICY "Anyone can insert documents"
  ON public.documents FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read documents" ON public.documents;
CREATE POLICY "Anyone can read documents"
  ON public.documents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow update documents" ON public.documents;
CREATE POLICY "Allow update documents"
  ON public.documents FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- 5.2 document_versions
CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  source TEXT NOT NULL CHECK (source IN ('daftra', 'upload')),
  file_url TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view document versions" ON public.document_versions;
CREATE POLICY "Staff can view document versions"
  ON public.document_versions FOR SELECT
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert document versions" ON public.document_versions;
CREATE POLICY "Staff can insert document versions"
  ON public.document_versions FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow insert document_versions" ON public.document_versions;
CREATE POLICY "Allow insert document_versions"
  ON public.document_versions FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select document_versions" ON public.document_versions;
CREATE POLICY "Allow select document_versions"
  ON public.document_versions FOR SELECT
  TO public
  USING (true);

-- 5.3 document_comments
CREATE TABLE IF NOT EXISTS public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  text TEXT NOT NULL,
  page INTEGER,
  x_position NUMERIC,
  y_position NUMERIC,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view comments" ON public.document_comments;
CREATE POLICY "Staff can view comments"
  ON public.document_comments FOR SELECT
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert comments" ON public.document_comments;
CREATE POLICY "Staff can insert comments"
  ON public.document_comments FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON public.document_comments;
CREATE POLICY "Users can update own comments"
  ON public.document_comments FOR UPDATE
  USING (user_id = auth.uid() OR is_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow insert document_comments" ON public.document_comments;
CREATE POLICY "Allow insert document_comments"
  ON public.document_comments FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select document_comments" ON public.document_comments;
CREATE POLICY "Allow select document_comments"
  ON public.document_comments FOR SELECT
  TO public
  USING (true);

-- 5.4 document_signatures
CREATE TABLE IF NOT EXISTS public.document_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  signer_id UUID REFERENCES auth.users(id),
  signer_name TEXT NOT NULL,
  signature_data TEXT NOT NULL,
  signed_pdf_url TEXT,
  pdf_hash TEXT,
  ip_address TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view signatures" ON public.document_signatures;
CREATE POLICY "Staff can view signatures"
  ON public.document_signatures FOR SELECT
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can insert signatures" ON public.document_signatures;
CREATE POLICY "Staff can insert signatures"
  ON public.document_signatures FOR INSERT
  WITH CHECK (is_staff(auth.uid()));

DROP POLICY IF EXISTS "Allow insert document_signatures" ON public.document_signatures;
CREATE POLICY "Allow insert document_signatures"
  ON public.document_signatures FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select document_signatures" ON public.document_signatures;
CREATE POLICY "Allow select document_signatures"
  ON public.document_signatures FOR SELECT
  TO public
  USING (true);

-- 5.5 document_audit_logs
CREATE TABLE IF NOT EXISTS public.document_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view audit logs" ON public.document_audit_logs;
CREATE POLICY "Staff can view audit logs"
  ON public.document_audit_logs FOR SELECT
  USING (is_staff(auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.document_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.document_audit_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow insert document_audit_logs" ON public.document_audit_logs;
CREATE POLICY "Allow insert document_audit_logs"
  ON public.document_audit_logs FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select document_audit_logs" ON public.document_audit_logs;
CREATE POLICY "Allow select document_audit_logs"
  ON public.document_audit_logs FOR SELECT
  TO public
  USING (true);

-- 5.6 document_reviewers
CREATE TABLE IF NOT EXISTS public.document_reviewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('engineering', 'procurement', 'accounting')),
  access_hash TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_reviewers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviewers by hash" ON public.document_reviewers;
CREATE POLICY "Anyone can view reviewers by hash"
  ON public.document_reviewers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can update reviewer status by hash" ON public.document_reviewers;
CREATE POLICY "Anyone can update reviewer status by hash"
  ON public.document_reviewers FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert document_reviewers" ON public.document_reviewers;
CREATE POLICY "Anyone can insert document_reviewers"
  ON public.document_reviewers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read document_reviewers" ON public.document_reviewers;
CREATE POLICY "Anyone can read document_reviewers"
  ON public.document_reviewers FOR SELECT
  USING (true);

-- 5.7 quote_items
CREATE TABLE IF NOT EXISTS public.quote_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  daftra_item_id TEXT,
  product_name TEXT NOT NULL,
  product_description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  notes TEXT,
  approval_status TEXT DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view quote items" ON public.quote_items;
CREATE POLICY "Anyone can view quote items"
  ON public.quote_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can update quote item approval" ON public.quote_items;
CREATE POLICY "Anyone can update quote item approval"
  ON public.quote_items FOR UPDATE
  USING (true);

-- =====================================================
-- 6. PROJECT TABLES
-- =====================================================

-- 6.1 project_images
CREATE TABLE IF NOT EXISTS public.project_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  folder_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  uploaded_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read project_images" ON public.project_images;
CREATE POLICY "Public read project_images"
  ON public.project_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public insert project_images" ON public.project_images;
CREATE POLICY "Public insert project_images"
  ON public.project_images FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update project_images" ON public.project_images;
CREATE POLICY "Public update project_images"
  ON public.project_images FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Public delete project_images" ON public.project_images;
CREATE POLICY "Public delete project_images"
  ON public.project_images FOR DELETE
  USING (true);

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- documents
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_daftra_id ON public.documents(daftra_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_number ON public.documents(number);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);

-- document_versions
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);

-- document_comments
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON public.document_comments(document_id);

-- document_audit_logs
CREATE INDEX IF NOT EXISTS idx_document_audit_logs_document_id ON public.document_audit_logs(document_id);

-- document_reviewers
CREATE INDEX IF NOT EXISTS idx_document_reviewers_hash ON public.document_reviewers(access_hash);
CREATE INDEX IF NOT EXISTS idx_document_reviewers_document ON public.document_reviewers(document_id);

-- quote_items
CREATE INDEX IF NOT EXISTS idx_quote_items_document_id ON public.quote_items(document_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_approval_status ON public.quote_items(approval_status);

-- project_images
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON public.project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_document_id ON public.project_images(document_id);

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- documents updated_at
DROP TRIGGER IF EXISTS update_documents_updated_at ON public.documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- document_comments updated_at
DROP TRIGGER IF EXISTS update_document_comments_updated_at ON public.document_comments;
CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON public.document_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- document_reviewers updated_at
DROP TRIGGER IF EXISTS update_document_reviewers_updated_at ON public.document_reviewers;
CREATE TRIGGER update_document_reviewers_updated_at
  BEFORE UPDATE ON public.document_reviewers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- quote_items updated_at
DROP TRIGGER IF EXISTS update_quote_items_updated_at ON public.quote_items;
CREATE TRIGGER update_quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- project_images updated_at
DROP TRIGGER IF EXISTS update_project_images_updated_at ON public.project_images;
CREATE TRIGGER update_project_images_updated_at
  BEFORE UPDATE ON public.project_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. AUDIT LOGGING FUNCTION & TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_document_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.document_audit_logs (
      document_id,
      actor_id,
      actor_name,
      action,
      old_value,
      new_value
    ) VALUES (
      NEW.id,
      auth.uid(),
      COALESCE((SELECT name FROM public.profiles WHERE id = auth.uid()), 'System'),
      'status_change',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_document_status_change ON public.documents;
CREATE TRIGGER log_document_status_change
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_status_change();

-- =====================================================
-- 10. NEW USER HANDLER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 11. STORAGE BUCKET
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage policies
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
CREATE POLICY "Public read access for documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents');

-- =====================================================
-- 12. GRANTS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- END OF SCHEMA
-- =====================================================