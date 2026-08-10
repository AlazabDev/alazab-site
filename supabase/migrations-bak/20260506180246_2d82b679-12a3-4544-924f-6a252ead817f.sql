
CREATE TABLE IF NOT EXISTS public.cost_estimate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_type text,
  project_name text,
  city text,
  notes text,
  category text,
  subtype text,
  area numeric,
  floors integer,
  location text,
  condition text,
  scope text,
  finish_level text,
  enabled_items jsonb DEFAULT '[]'::jsonb,
  management_pct numeric,
  contingency_pct numeric,
  estimated_total numeric,
  per_meter numeric,
  range_min numeric,
  range_max numeric,
  accuracy text,
  status text DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cost_estimate_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert estimates" ON public.cost_estimate_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "admins read estimates" ON public.cost_estimate_requests FOR SELECT USING (public.is_admin());

CREATE TABLE IF NOT EXISTS public.tax_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text,
  taxpayer text,
  commercial_register text,
  tax_card text,
  invoice_date date,
  item text,
  description text,
  taxable_amount numeric,
  tax_amount numeric,
  tax_type text DEFAULT 'VAT_14',
  source_section text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read tax_invoices" ON public.tax_invoices FOR SELECT USING (public.is_admin());
CREATE POLICY "admins insert tax_invoices" ON public.tax_invoices FOR INSERT WITH CHECK (public.is_admin());
CREATE INDEX IF NOT EXISTS tax_invoices_invoice_number_idx ON public.tax_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS tax_invoices_invoice_date_idx ON public.tax_invoices(invoice_date);
