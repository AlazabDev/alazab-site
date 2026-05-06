
-- Extend projects table for full content management
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS area_sqm numeric,
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS model_3d_embeds jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_ar text,
  ADD COLUMN IF NOT EXISTS content_en text,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Project reviews table (customers submit, admin moderates)
CREATE TABLE IF NOT EXISTS public.project_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text,
  reviewer_phone text,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved reviews"
  ON public.project_reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews"
  ON public.project_reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin manage reviews"
  ON public.project_reviews FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER trg_project_reviews_updated
  BEFORE UPDATE ON public.project_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_project_reviews_project ON public.project_reviews(project_id);

-- Service pages content (editable bilingual content for service pages)
CREATE TABLE IF NOT EXISTS public.service_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_ar text NOT NULL,
  title_en text,
  subtitle_ar text,
  subtitle_en text,
  hero_image_url text,
  content_ar text,
  content_en text,
  features jsonb DEFAULT '[]'::jsonb,
  gallery jsonb DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published service_pages"
  ON public.service_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin read all service_pages"
  ON public.service_pages FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admin manage service_pages"
  ON public.service_pages FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER trg_service_pages_updated
  BEFORE UPDATE ON public.service_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for projects updated_at if not existing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated') THEN
    CREATE TRIGGER trg_projects_updated
      BEFORE UPDATE ON public.projects
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Storage policies for projects-media bucket (public bucket already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read projects-media' AND tablename = 'objects') THEN
    CREATE POLICY "Public read projects-media"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'projects-media');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin upload projects-media' AND tablename = 'objects') THEN
    CREATE POLICY "Admin upload projects-media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'projects-media' AND public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin update projects-media' AND tablename = 'objects') THEN
    CREATE POLICY "Admin update projects-media"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'projects-media' AND public.is_admin())
      WITH CHECK (bucket_id = 'projects-media' AND public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin delete projects-media' AND tablename = 'objects') THEN
    CREATE POLICY "Admin delete projects-media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'projects-media' AND public.is_admin());
  END IF;
END $$;
