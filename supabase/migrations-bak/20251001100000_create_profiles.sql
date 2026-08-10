-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- جدول المستخدمين
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  shop_name TEXT,
  shop_address TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الباقات
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  price DECIMAL(10, 2) NOT NULL,
  price_yearly DECIMAL(10, 2) NOT NULL,
  features JSONB NOT NULL, -- ['ميزة 1', 'ميزة 2']
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول الاشتراكات
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  branches_count INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('active', 'expired', 'cancelled', 'pending')) DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid', 'refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- جدول طلبات العروض
CREATE TABLE contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  shop_name TEXT,
  plan_interest TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إدخال بيانات الباقات
INSERT INTO plans (name_ar, name_en, description_ar, description_en, price, price_yearly, features, is_popular) VALUES
(
  'أساسية',
  'Basic',
  'صيانة دورية ربع سنوية مع دعم فني 8/5',
  'Quarterly maintenance with 8/5 technical support',
  2400,
  2400,
  '["صيانة دورية ربع سنوية", "دعم فني 8/5", "تقرير حالة كل 3 أشهر", "خصم 10% على قطع الغيار"]'::JSONB,
  FALSE
),
(
  'احترافية',
  'Professional',
  'صيانة دورية شهرية مع دعم 24/7 وأولوية البلاغات',
  'Monthly maintenance with 24/7 support and priority tickets',
  4800,
  4800,
  '["صيانة دورية شهرية", "دعم فني 24/7", "أولوية البلاغات", "تقرير حالة شهري", "خصم 15% على قطع الغيار"]'::JSONB,
  TRUE
),
(
  'مميزة',
  'Premium',
  'كل ما سبق مع زيارات استباقية وتقارير أداء متقدمة',
  'All above with proactive visits and advanced performance reports',
  8400,
  8400,
  '["صيانة دورية شهرية", "دعم فني 24/7", "أولوية البلاغات", "زيارات استباقية", "تقارير أداء متقدمة", "خصم 20% على قطع الغيار", "مدير حساب مخصص"]'::JSONB,
  FALSE
);

-- إنشاء سياسات RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- سياسات للمستخدمين
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- سياسات للاشتراكات
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- دوال مساعدة
CREATE OR REPLACE FUNCTION get_active_subscriptions(user_id UUID)
RETURNS TABLE(
  plan_name TEXT,
  branches_count INTEGER,
  total_price DECIMAL,
  end_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.name_ar, s.branches_count, s.total_price, s.end_date
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = $1 AND s.status = 'active' AND s.end_date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;