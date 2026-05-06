# دليل الإعداد | Setup Guide
## نظام حساب التكاليف المتقدم

---

## المرحلة الأولى: إعداد قاعدة البيانات | Phase 1: Database Setup

### خطوة 1: إنشاء الجداول في Supabase

اتبع هذه الخطوات في لوحة تحكم Supabase:

#### 1.1 جدول العروض الرئيسي
```sql
CREATE TABLE cost_estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('residential', 'commercial', 'industrial', 'renovation', 'retail')),
  area DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  finishing_type VARCHAR(50) NOT NULL CHECK (finishing_type IN ('basic', 'standard', 'luxury', 'premium')),
  notes TEXT,
  notes_ar TEXT,
  materials_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  labor_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  finishing_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  additional_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهرس للأداء الأفضل
CREATE INDEX idx_cost_estimates_created_at ON cost_estimates(created_at DESC);
CREATE INDEX idx_cost_estimates_project_type ON cost_estimates(project_type);
```

#### 1.2 جدول عناصر التكاليف
```sql
CREATE TABLE cost_estimate_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES cost_estimates(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_name_ar TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_ar VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس للأداء
CREATE INDEX idx_cost_estimate_items_estimate_id ON cost_estimate_items(estimate_id);
```

#### 1.3 جدول المقارنات
```sql
CREATE TABLE cost_comparisons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id_1 UUID NOT NULL REFERENCES cost_estimates(id) ON DELETE CASCADE,
  estimate_id_2 UUID NOT NULL REFERENCES cost_estimates(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_estimates CHECK (estimate_id_1 != estimate_id_2)
);

-- فهرس للأداء
CREATE INDEX idx_cost_comparisons_created_at ON cost_comparisons(created_at DESC);
```

### خطوة 2: تفعيل Row Level Security (RLS) - اختياري

إذا كنت تريد تأمين البيانات:

```sql
-- تفعيل RLS
ALTER TABLE cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_comparisons ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة والكتابة للمستخدمين المصرح لهم
CREATE POLICY "allow_all" ON cost_estimates FOR ALL USING (true);
CREATE POLICY "allow_all" ON cost_estimate_items FOR ALL USING (true);
CREATE POLICY "allow_all" ON cost_comparisons FOR ALL USING (true);
```

---

## المرحلة الثانية: التحقق من البيئة | Phase 2: Environment Verification

### تحقق من متغيرات البيئة:

```bash
# يجب أن تكون موجودة في .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## المرحلة الثالثة: الاختبار | Phase 3: Testing

### اختبر الحاسبة:

#### 3.1 اختبر حساب التكاليف الأساسي
```bash
cd /vercel/share/v0-project
npm run dev
# زر الموقع في http://localhost:3000/cost-calculator
```

#### 3.2 اختبر الحفظ في قاعدة البيانات
- أكمل نموذج الحاسبة
- اضغط "حفظ العرض"
- تحقق من قاعدة البيانات للتأكد من الحفظ

#### 3.3 اختبر التقارير
- اضغط "تحميل HTML"
- يجب تحميل ملف HTML
- جرب "طباعة"

---

## المرحلة الرابعة: الميزات المتقدمة | Phase 4: Advanced Features

### 4.1 تفعيل المقارنات
في `/app/comparisons/page.tsx`:
```typescript
import { CostComparison } from "@/components/cost-comparison"
// استخدم المكون هنا
```

### 4.2 تفعيل الشات بوت
في `/components/smart-chatbot.tsx`:
```typescript
// أضف رسالة للتوجيه إلى حاسبة التكاليف
const maintenanceKeywords = [
  // ...existing keywords
  "تقدير", "estimate", "cost", "سعر"
]
```

---

## المرحلة الخامسة: التحسينات | Phase 5: Enhancements

### 5.1 إضافة المزيد من أنواع المشاريع
عدّل `/lib/cost-calculator-service.ts`:
```typescript
export const PROJECT_TYPE_MULTIPLIERS: Record<string, number> = {
  residential: 1.0,
  commercial: 1.2,
  // أضف المزيد هنا
}
```

### 5.2 تخصيص الأسعار
عدّل الأسعار في:
```typescript
export const MATERIAL_PRICES: Record<string, Record<string, number>> = {
  // عدّل حسب احتياجاتك
}
```

### 5.3 إضافة المزيد من التقارير
في `/lib/cost-reports-service.ts`:
```typescript
static generateCustomReport(estimate: ProjectEstimate): string {
  // أضف تقرير مخصص هنا
}
```

---

## استكشاف الأخطاء | Troubleshooting

### المشكلة: فشل الحفظ في قاعدة البيانات
**الحل:**
1. تحقق من متغيرات البيئة
2. تحقق من أن الجداول موجودة في Supabase
3. تحقق من الاتصال بالإنترنت

### المشكلة: التقارير لا تطبع بشكل صحيح
**الحل:**
1. جرب مع متصفح مختلف
2. قم بتحديث المتصفح
3. تحقق من أن JavaScript مفعل

### المشكلة: الواجهة لا تعرض بشكل صحيح
**الحل:**
1. امسح الذاكرة المؤقتة
2. جرب Incognito Mode
3. أعد تحميل الصفحة

---

## قائمة التحقق | Checklist

- [ ] تم إنشاء جميع الجداول في Supabase
- [ ] تم التحقق من متغيرات البيئة
- [ ] تم اختبار حساب التكاليف الأساسي
- [ ] تم اختبار الحفظ في قاعدة البيانات
- [ ] تم اختبار تحميل التقارير
- [ ] تم اختبار الطباعة
- [ ] تم توثيق أي تخصيصات
- [ ] تم اختبار على أجهزة مختلفة

---

## الخطوات التالية | Next Steps

1. **مراقبة الأداء** - استخدم أدوات Supabase للمراقبة
2. **طلب التغذية الراجعة** - اطلب من المستخدمين ملاحظاتهم
3. **التحسين المستمر** - أضف ميزات جديدة حسب الطلب
4. **النسخ الاحتياطية** - اتأكد من وجود نسخ احتياطية منتظمة

---

## معلومات الدعم | Support Info

- **الاستشارات:** تواصل مع فريق التطوير
- **التقارير البرمجية:** استخدم GitHub Issues
- **الأسئلة التقنية:** راجع الوثائق

---

**آخر تحديث:** 2024
**الإصدار:** 1.0.0
