
-- 1. Finishing levels for area-based pricing (System 1)
CREATE TABLE public.finishing_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  price_per_sqm numeric NOT NULL DEFAULT 0,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finishing_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read finishing_levels" ON public.finishing_levels FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage finishing_levels" ON public.finishing_levels FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 2. Quotation categories (groups of work items)
CREATE TABLE public.quotation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotation_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quotation_categories" ON public.quotation_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage quotation_categories" ON public.quotation_categories FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 3. Quotation items (individual line items with default prices)
CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.quotation_categories(id) ON DELETE CASCADE NOT NULL,
  item_code text,
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'م2',
  default_unit_price numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read quotation_items" ON public.quotation_items FOR SELECT TO public USING (true);
CREATE POLICY "Admin manage quotation_items" ON public.quotation_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- 4. Quotations (main quotation records)
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text NOT NULL UNIQUE,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  project_type text NOT NULL DEFAULT 'residential',
  property_type text,
  property_area numeric,
  pricing_system text NOT NULL DEFAULT 'area_based',
  finishing_level_id uuid REFERENCES public.finishing_levels(id),
  material_cost numeric,
  labor_percentage numeric DEFAULT 20,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_percentage numeric DEFAULT 14,
  tax_amount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  valid_until date,
  pdf_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read quotations" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage quotations" ON public.quotations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Service role manages quotations" ON public.quotations FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 5. Quotation line items (for itemized quotations)
CREATE TABLE public.quotation_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.quotation_items(id),
  description text NOT NULL,
  unit text NOT NULL DEFAULT 'م2',
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read quotation_line_items" ON public.quotation_line_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage quotation_line_items" ON public.quotation_line_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Service role manages quotation_line_items" ON public.quotation_line_items FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seed finishing levels
INSERT INTO public.finishing_levels (name, name_en, price_per_sqm, description, sort_order) VALUES
  ('تشطيب عادي', 'Standard', 8000, 'تشطيب أساسي بمواد محلية جيدة', 1),
  ('تشطيب متوسط', 'Medium', 10000, 'تشطيب بمواد متوسطة الجودة مع تصميم مناسب', 2),
  ('تشطيب لوكس', 'Luxury', 15000, 'تشطيب فاخر بمواد عالية الجودة وتصميم مميز', 3),
  ('تشطيب سوبر لوكس', 'Ultra Super Luxury', 20000, 'أعلى مستوى تشطيب بأفخم الخامات والتصميمات', 4);

-- Seed quotation categories (from the files analysis)
INSERT INTO public.quotation_categories (name, sort_order) VALUES
  ('أعمال الحفر والردم', 1),
  ('أعمال الخرسانات والأساسات', 2),
  ('أعمال المنشأ العلوي', 3),
  ('أعمال المباني', 4),
  ('أعمال البياض (اللياسة)', 5),
  ('أعمال الطبقة العازلة', 6),
  ('أعمال الأرضيات والرخام والسيراميك', 7),
  ('أعمال الدهانات', 8),
  ('أعمال النجارة والأبواب', 9),
  ('أعمال الألمنيوم والزجاج', 10),
  ('أعمال الحديد المشغول', 11),
  ('أعمال الكهرباء والإنارة', 12),
  ('أعمال الصحية والصرف والتغذية', 13),
  ('أعمال التكييف والتبريد', 14),
  ('أعمال الأسقف المعلقة والجبسمبورد', 15),
  ('أعمال اللافتات والديكور', 16),
  ('أعمال تجهيزات الموقع', 17),
  ('أعمال إنذار ومكافحة الحريق', 18),
  ('أعمال تكميلية', 19);

-- Generate quotation number function
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  year_str text;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(split_part(quotation_number, '-', 3), '') AS integer)
  ), 0) + 1
  INTO next_num
  FROM public.quotations
  WHERE quotation_number LIKE 'AZB-' || year_str || '-%';
  
  RETURN 'AZB-' || year_str || '-' || LPAD(next_num::text, 4, '0');
END;
$$;
