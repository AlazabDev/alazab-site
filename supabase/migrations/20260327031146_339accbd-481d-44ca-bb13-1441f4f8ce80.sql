-- Drop the old public SELECT policy on whatsapp_messages if it exists
DROP POLICY IF EXISTS "Allow public read for realtime" ON public.whatsapp_messages;

-- Fix quotation_line_items: restrict read to admin or quotation creator
DROP POLICY IF EXISTS "Admin read quotation_line_items" ON public.quotation_line_items;
CREATE POLICY "Admin or creator read quotation_line_items"
  ON public.quotation_line_items
  FOR SELECT
  TO authenticated
  USING (
    is_admin() OR (
      quotation_id IN (
        SELECT id FROM public.quotations WHERE created_by = auth.uid()
      )
    )
  );