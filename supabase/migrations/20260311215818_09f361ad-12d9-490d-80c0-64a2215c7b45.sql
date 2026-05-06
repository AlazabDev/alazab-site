
-- Add unique constraint on wa_template_code for upsert support
ALTER TABLE public.templates ADD CONSTRAINT templates_wa_template_code_key UNIQUE (wa_template_code);
