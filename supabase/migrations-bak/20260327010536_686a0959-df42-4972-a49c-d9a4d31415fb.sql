ALTER TABLE public.quotations 
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approval_notes text,
  ADD COLUMN IF NOT EXISTS modified_by uuid,
  ADD COLUMN IF NOT EXISTS modified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.quotation_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  recipient_type text NOT NULL,
  recipient_phone text,
  wa_message_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quotation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage quotation_notifications" ON public.quotation_notifications
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role manages quotation_notifications" ON public.quotation_notifications
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage notification_settings" ON public.notification_settings
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Service role manages notification_settings" ON public.notification_settings
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.notification_settings (setting_key, setting_value, description) VALUES
  ('admin_phone', '+201004006620', 'رقم واتساب الإدارة للإشعارات'),
  ('sales_phone', '+201014536600', 'رقم واتساب فريق المبيعات للإشعارات'),
  ('notify_admin_new_quotation', 'true', 'إشعار الإدارة عند إنشاء عرض سعر جديد'),
  ('notify_admin_status_change', 'true', 'إشعار الإدارة عند تغيير حالة العرض'),
  ('notify_client_quotation_ready', 'true', 'إشعار العميل عند جهوزية عرض السعر'),
  ('notify_sales_new_quotation', 'true', 'إشعار المبيعات عند إنشاء عرض جديد')
ON CONFLICT (setting_key) DO NOTHING;