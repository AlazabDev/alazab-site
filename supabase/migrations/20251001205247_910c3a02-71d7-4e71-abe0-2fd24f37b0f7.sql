-- إنشاء view محمي لجدول appointments يخفي المعلومات الحساسة حسب دور المستخدم
CREATE OR REPLACE VIEW appointments_protected AS
SELECT 
  a.id,
  a.title,
  a.description,
  a.appointment_date,
  a.appointment_time,
  a.duration_minutes,
  a.status,
  a.location,
  a.notes,
  a.property_id,
  a.vendor_id,
  a.maintenance_request_id,
  a.reminder_sent,
  a.created_at,
  a.updated_at,
  a.created_by,
  -- إخفاء معلومات العملاء حسب الدور
  CASE 
    WHEN get_current_user_role() IN ('admin', 'manager') THEN a.customer_name
    ELSE SUBSTRING(a.customer_name FROM 1 FOR 1) || '***'
  END AS customer_name,
  CASE 
    WHEN get_current_user_role() IN ('admin', 'manager') THEN a.customer_phone
    WHEN get_current_user_role() IN ('staff', 'technician') THEN 
      CASE 
        WHEN a.customer_phone IS NOT NULL AND length(a.customer_phone) > 4 
        THEN '****' || right(a.customer_phone, 4)
        ELSE '****'
      END
    ELSE NULL
  END AS customer_phone,
  CASE 
    WHEN get_current_user_role() IN ('admin', 'manager') THEN a.customer_email
    WHEN get_current_user_role() IN ('staff', 'technician') THEN 
      CASE 
        WHEN a.customer_email IS NOT NULL 
        THEN left(a.customer_email, 2) || '***@' || split_part(a.customer_email, '@', 2)
        ELSE NULL
      END
    ELSE NULL
  END AS customer_email
FROM appointments a;

-- منح الصلاحيات على الـ view
GRANT SELECT ON appointments_protected TO authenticated;

-- إنشاء دالة security definer للحصول على معلومات العميل الكاملة فقط للمديرين والمسؤولين
CREATE OR REPLACE FUNCTION get_full_customer_info(appointment_id uuid)
RETURNS TABLE(customer_name text, customer_phone text, customer_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- التحقق من أن المستخدم مدير أو مسؤول
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager')
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins and managers can access full customer information';
  END IF;

  RETURN QUERY
  SELECT a.customer_name, a.customer_phone, a.customer_email
  FROM appointments a
  WHERE a.id = appointment_id;
END;
$$;

-- إضافة RLS policies للـ view
ALTER VIEW appointments_protected SET (security_invoker = true);

-- تحديث التعليقات التوضيحية
COMMENT ON VIEW appointments_protected IS 'Protected view of appointments that masks customer personal information based on user role. Only admins and managers can see full customer details.';
COMMENT ON FUNCTION get_full_customer_info IS 'Security definer function to retrieve full customer information. Only accessible by admin and manager roles.';