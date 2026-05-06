# نظام حساب التكاليف المتقدم
# Advanced Cost Calculation System

## نظرة عامة | Overview

نظام احترافي شامل لحساب تكاليف المشاريع مع ميزات متقدمة تشمل:
- حسابات متقدمة مع عناصر متعددة
- تقارير احترافية بصيغ متعددة
- مقارنات بين العروض
- حفظ دائم في Supabase
- دعم عربي/إنجليزي كامل

---

## البنية الأساسية | Architecture

### 1. خدمات الحسابات | Calculator Services

#### `/lib/cost-calculator-service.ts`
الخدمة الأساسية للحسابات:
- حساب العناصر الفردية
- حساب التكاليف المتقدمة
- تحديث وحذف العناصر
- التحقق من صحة البيانات
- حساب النسب والمئويات
- تنسيق العملات

**الدوال الرئيسية:**
```typescript
calculateItemPrice(item: CostItem): number
calculateTotalFromItems(items: CostItem[]): CostBreakdown
calculateAdvanced(area, projectType, finishingType): CostBreakdown
validateItem(item): {valid, errors}
calculatePercentages(breakdown): percentages
formatCurrency(amount): formatted string
```

### 2. خدمات قاعدة البيانات | Database Services

#### `/lib/cost-database-service.ts`
إدارة البيانات مع Supabase:
- إنشاء وقراءة وتحديث وحذف العروض
- إدارة العناصر
- إنشاء المقارنات
- استيراد/تصدير JSON

**الجداول المطلوبة:**
```sql
-- العروض الرئيسية
CREATE TABLE cost_estimates (
  id UUID PRIMARY KEY,
  title TEXT,
  title_ar TEXT,
  project_type VARCHAR,
  area DECIMAL,
  location TEXT,
  finishing_type VARCHAR,
  notes TEXT,
  materials_cost DECIMAL,
  labor_cost DECIMAL,
  finishing_cost DECIMAL,
  additional_cost DECIMAL,
  subtotal DECIMAL,
  tax DECIMAL,
  total_cost DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- عناصر التكاليف
CREATE TABLE cost_estimate_items (
  id UUID PRIMARY KEY,
  estimate_id UUID REFERENCES cost_estimates,
  item_name TEXT,
  item_name_ar TEXT,
  category VARCHAR,
  unit VARCHAR,
  unit_ar TEXT,
  quantity DECIMAL,
  unit_price DECIMAL,
  total_price DECIMAL,
  created_at TIMESTAMP
);

-- المقارنات
CREATE TABLE cost_comparisons (
  id UUID PRIMARY KEY,
  estimate_id_1 UUID REFERENCES cost_estimates,
  estimate_id_2 UUID REFERENCES cost_estimates,
  notes TEXT,
  created_at TIMESTAMP
);
```

### 3. خدمات التقارير | Report Services

#### `/lib/cost-reports-service.ts`
إنشاء التقارير والتحليلات:
- تقارير HTML احترافية
- تقارير نصية
- تصدير CSV
- مقارنات العروض
- طباعة وتحميل

**الميزات:**
- تقارير بتصميم احترافي
- دعم عربي كامل (RTL)
- رسوم بيانية بصرية
- توزيع التكاليف بالنسب
- تحليل المقارنات

---

## المكونات | Components

### 1. حاسبة التكاليف المتقدمة
`/components/cost-calculator-advanced.tsx`

**الميزات:**
- تبويبات: الحاسبة، العناصر، المعاينة
- إدخال معلومات المشروع
- إضافة عناصر متعددة
- حساب فوري للتكاليف
- حفظ في قاعدة البيانات
- تحميل التقارير
- طباعة

**المدخلات:**
```typescript
interface CostCalculatorAdvancedProps {
  // لا توجد props - مكون مستقل
}
```

### 2. مقارنة العروض
`/components/cost-comparison.tsx`

**الميزات:**
- مقارنة عرضين بسهولة
- عرض الفروقات
- رموز مرئية (up/down trends)
- تحليل ملخص
- دعم عربي كامل

**المدخلات:**
```typescript
interface CostComparisonProps {
  estimate1?: ProjectEstimate
  estimate2?: ProjectEstimate
}
```

### 3. قائمة العروض
`/components/cost-estimates-list.tsx`

**الميزات:**
- عرض جميع العروض المحفوظة
- معلومات سريعة لكل عرض
- أزرار الإجراءات (عرض، تحميل، حذف)
- حالة تحميل احترافية
- تأثيرات متحركة

---

## الصفحات | Pages

### 1. حاسبة التكاليف
**المسار:** `/cost-calculator`
**الملف:** `/app/cost-calculator/page.tsx`

**المحتوى:**
- رأس توضيحي
- مكون الحاسبة المتقدمة
- قسم الميزات
- معلومات إضافية

### 2. عروض التكاليف
**المسار:** `/cost-estimates`
**الملف:** `/app/cost-estimates/page.tsx`

**المحتوى:**
- قائمة جميع العروض
- إمكانية البحث والفرز
- إدارة العروض

---

## أنواع البيانات | Data Types

### ProjectEstimate
```typescript
interface ProjectEstimate {
  id: string
  title: string
  titleAr: string
  projectType: "residential" | "commercial" | "industrial" | "renovation" | "retail"
  area: number
  location: string
  finishingType: "basic" | "standard" | "luxury" | "premium"
  items: CostItem[]
  breakdown: CostBreakdown
  notes?: string
  notesAr?: string
  createdAt: Date
  updatedAt: Date
}
```

### CostItem
```typescript
interface CostItem {
  id: string
  name: string
  nameAr: string
  category: string
  unit: string
  unitAr: string
  quantity: number
  unitPrice: number
  totalPrice?: number
}
```

### CostBreakdown
```typescript
interface CostBreakdown {
  materials: number
  labor: number
  finishing: number
  additionalCosts: number
  subtotal: number
  taxRate: number
  tax: number
  total: number
  costPerMeter?: number
}
```

---

## الاستخدام | Usage

### 1. استخدام الحاسبة في الكود
```typescript
import { CostCalculatorService } from "@/lib/cost-calculator-service"

// حساب تكلفة العنصر الواحد
const itemPrice = CostCalculatorService.calculateItemPrice(item)

// حساب من قائمة العناصر
const breakdown = CostCalculatorService.calculateTotalFromItems(items)

// حساب متقدم
const advancedBreakdown = CostCalculatorService.calculateAdvanced(
  100, // area
  "residential", // projectType
  "luxury" // finishingType
)
```

### 2. استخدام قاعدة البيانات
```typescript
import { CostDatabaseService } from "@/lib/cost-database-service"

// حفظ عرض
const result = await CostDatabaseService.createEstimate(estimate)

// الحصول على جميع العروض
const { estimates } = await CostDatabaseService.getAllEstimates()

// حذف عرض
await CostDatabaseService.deleteEstimate(estimateId)
```

### 3. استخدام التقارير
```typescript
import { CostReportsService } from "@/lib/cost-reports-service"

// إنشاء تقرير HTML
const htmlReport = CostReportsService.generateHTMLReport(estimate)

// طباعة
CostReportsService.printReport(htmlReport)

// تحميل
CostReportsService.downloadFile(htmlReport, "report.html", "text/html")

// مقارنة عرضين
const comparison = CostReportsService.compareEstimates(est1, est2)
```

---

## التكامل مع الشات بوت | Chatbot Integration

يمكن إضافة طلب تقدير من خلال الشات بوت:

```typescript
// في smart-chatbot.tsx
import { useRouter } from "react-router-dom"

const requestCostEstimate = () => {
  // إعادة التوجيه إلى حاسبة التكاليف
  router.push("/cost-calculator")
}
```

---

## المعاملات والأسعار | Multipliers & Pricing

### نوع المشروع
- residential: 1.0x
- commercial: 1.2x
- industrial: 0.8x
- renovation: 0.9x
- retail: 1.1x

### نوع التشطيب
- basic: 0.8x
- standard: 1.0x
- luxury: 1.5x
- premium: 2.0x

### الموقع
- cairo: 1.2x
- giza: 1.1x
- alexandria: 1.0x
- other: 0.9x

### الضريبة
- معدل ضريبة القيمة المضافة: 14%

---

## الميزات المتقدمة | Advanced Features

### 1. التقارير الديناميكية
- تقارير HTML بتصميم احترافي
- دعم RTL للعربية
- رسوم بيانية توضيحية
- طباعة ملائمة

### 2. المقارنات المتقدمة
- مقارنة حتى عرضين
- عرض الفروقات بصرياً
- تحليل المزايا والعيوب

### 3. إدارة البيانات
- حفظ تلقائي في Supabase
- استيراد/تصدير JSON
- تاريخ التعديلات
- نسخ احتياطية

### 4. الدعم اللغوي
- واجهة عربية كاملة
- واجهة إنجليزية كاملة
- تقارير ثنائية اللغة
- تنسيق أرقام محلي

---

## الأمان | Security

- استخدام Supabase للحفظ الآمن
- تشفير البيانات في الترانزيت
- حماية من SQL Injection
- صحة البيانات المُتحققة

---

## الأداء | Performance

- حسابات فورية
- تحميل بيانات محسّن
- تخزين مؤقت ذكي
- تأثيرات متحركة سلسة

---

## الإجراءات التالية | Next Steps

1. **إنشاء جداول قاعدة البيانات** في Supabase
2. **اختبار الحاسبة** مع أنواع مختلفة
3. **إضافة المزيد من الميزات** حسب الحاجة
4. **تحسين الواجهة** بناءً على الملاحظات

---

## الدعم الفني | Support

للمزيد من الدعم والمساعدة:
- تفقد الوثائق الرسمية
- تواصل مع فريق التطوير
- راجع الأمثلة في الكود

---

**تم إنشاؤه بواسطة:** Alazab Development Team
**الإصدار:** 1.0.0
**آخر تحديث:** 2024
