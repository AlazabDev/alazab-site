-- ============================================
-- المرحلة 1: تشديد أمان البيانات الحساسة
-- ============================================

-- 1. تأمين جدول profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. تأمين جدول appointments
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments"
  ON public.appointments FOR SELECT
  USING (created_by = auth.uid() OR vendor_id = auth.uid());

CREATE POLICY "Staff can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Users can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own appointments"
  ON public.appointments FOR UPDATE
  USING (created_by = auth.uid() OR public.is_staff());

-- 3. تأمين جدول invoices
DROP POLICY IF EXISTS "Staff can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Anyone can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can view invoices they created" ON public.invoices;
DROP POLICY IF EXISTS "Staff can view company invoices" ON public.invoices;
DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;

CREATE POLICY "Users can view invoices they created"
  ON public.invoices FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Staff can view company invoices"
  ON public.invoices FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Staff can manage invoices"
  ON public.invoices FOR ALL
  USING (public.is_staff());

-- 4. تأمين جدول technician_profiles (يحتوي user_id)
DROP POLICY IF EXISTS "Staff can view all technician profiles" ON public.technician_profiles;
DROP POLICY IF EXISTS "Anyone can view technician profiles" ON public.technician_profiles;
DROP POLICY IF EXISTS "Technicians can view their own profile" ON public.technician_profiles;
DROP POLICY IF EXISTS "Admins can view all technician profiles" ON public.technician_profiles;
DROP POLICY IF EXISTS "Technicians can update their own profile" ON public.technician_profiles;

CREATE POLICY "Technicians can view their own profile"
  ON public.technician_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all technician profiles"
  ON public.technician_profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Technicians can update their own profile"
  ON public.technician_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- 5. تأمين جدول vendors (ليس به user_id - نستخدم last_modified_by)
DROP POLICY IF EXISTS "Staff can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Anyone can view vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can view their own record" ON public.vendors;
DROP POLICY IF EXISTS "Admins can view all vendors" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can update their own record" ON public.vendors;

CREATE POLICY "Admins can view all vendors"
  ON public.vendors FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Staff can view limited vendor info"
  ON public.vendors FOR SELECT
  USING (public.is_staff());

-- 6. تأمين جدول maintenance_requests
DROP POLICY IF EXISTS "All company employees can view requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Staff can view company requests" ON public.maintenance_requests;

CREATE POLICY "Users can view their own requests"
  ON public.maintenance_requests FOR SELECT
  USING (created_by = auth.uid() OR assigned_technician_id = auth.uid());

CREATE POLICY "Staff can view company requests"
  ON public.maintenance_requests FOR SELECT
  USING (
    public.is_staff() AND 
    company_id = public.get_current_user_company_id()
  );

-- 7. تأمين جدول documents
DROP POLICY IF EXISTS "Staff can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;

CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Admins can view all documents"
  ON public.documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- 8. تأمين جدول notifications
DROP POLICY IF EXISTS "Staff can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (recipient_id = auth.uid());

-- 9. إضافة Rate Limiting لـ consultation_bookings
CREATE OR REPLACE FUNCTION public.check_booking_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM consultation_bookings
  WHERE email = NEW.email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'تم تجاوز الحد المسموح من الحجوزات. يرجى المحاولة لاحقاً.';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_booking_rate ON public.consultation_bookings;
CREATE TRIGGER check_booking_rate
  BEFORE INSERT ON public.consultation_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_rate_limit();