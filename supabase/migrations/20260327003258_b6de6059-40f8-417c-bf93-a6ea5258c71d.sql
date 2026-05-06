
-- Fix search_path for generate_quotation_number
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
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
