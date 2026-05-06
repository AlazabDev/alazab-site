# قائمة الملفات المستخدمة في نظام حساب التكاليف
# Cost Calculation System - Files List

---

## 📂 الملفات المستخدمة حسب التصنيف

### 📚 1️⃣ ملفات الخدمات والمكتبات (lib/)

#### 1. **lib/cost-calculator-service.ts**
- **الوصف**: الخدمة الأساسية لحسابات التكاليف المتقدمة
- **الحجم**: 324 سطر
- **التاريخ**: 2026
- **الوظائف الرئيسية**:
  - `calculateCost()` - حساب التكلفة الإجمالية
  - `addItem()` - إضافة عنصر
  - `removeItem()` - حذف عنصر
  - `calculateWithAdjustments()` - حساب مع تعديلات
  - `formatCurrency()` - تنسيق العملة
- **الفئات الرئيسية**:
  - `CostCalculatorService`
  - `CostItem`
  - `CalculationResult`
- **الاعتماديات**: TypeScript, interfaces

---

#### 2. **lib/cost-database-service.ts**
- **الوصف**: خدمة قاعدة البيانات مع Supabase
- **الحجم**: 252 سطر
- **التاريخ**: 2026
- **الوظائف الرئيسية**:
  - `saveEstimate()` - حفظ العرض
  - `loadEstimate()` - تحميل العرض
  - `getEstimates()` - الحصول على جميع العروض
  - `deleteEstimate()` - حذف العرض
  - `exportJSON()` - تصدير JSON
  - `importJSON()` - استيراد JSON
- **الفئات الرئيسية**:
  - `CostDatabaseService`
  - `Estimate`
  - `EstimateItem`
- **الاعتماديات**: Supabase, TypeScript

---

#### 3. **lib/cost-reports-service.ts**
- **الوصف**: خدمة إنشاء التقارير والتصدير
- **الحجم**: 408 سطر
- **التاريخ**: 2026
- **الوظائف الرئيسية**:
  - `generateHTMLReport()` - تقرير HTML احترافي
  - `generateTextReport()` - تقرير نصي
  - `generateCSVReport()` - تقرير CSV
  - `generateComparison()` - مقارنة بين عرضين
  - `exportToPDF()` - تصدير PDF
  - `printReport()` - طباعة التقرير
- **الفئات الرئيسية**:
  - `CostReportsService`
  - `ReportData`
  - `ComparisonData`
- **الاعتماديات**: TypeScript, HTML generation

---

### 🎨 2️⃣ مكونات React (components/)

#### 1. **components/cost-calculator.tsx**
- **الوصف**: حاسبة التكاليف الأساسية (القديمة)
- **الحجم**: 150+ سطر
- **النوع**: مكون React
- **الوظيفة**: عرض بسيط للحساب الأساسي
- **الخصائص**:
  - `projectType` - نوع المشروع
  - `area` - المساحة
  - `pricePerSquare` - السعر للمتر
- **الأحداث**: `onChange`, `onCalculate`

---

#### 2. **components/cost-calculator-advanced.tsx** ⭐
- **الوصف**: حاسبة التكاليف المتقدمة الاحترافية
- **الحجم**: 593 سطر
- **النوع**: مكون React متقدم
- **المميزات**:
  - 3 تبويبات (حساب، تقرير، مقارنة)
  - عرض فوري للتكاليف
  - إضافة عناصر مخصصة
  - حفظ وتحميل
  - طباعة وتحميل التقارير
  - دعم عربي كامل
- **الحالات الرئيسية**:
  - `activeTab` - التبويب النشط
  - `items` - قائمة العناصر
  - `calculatedCost` - التكلفة المحسوبة
  - `isLoading` - حالة التحميل
- **الدوال الرئيسية**:
  - `handleAddItem()`
  - `handleRemoveItem()`
  - `handleSaveEstimate()`
  - `handleGenerateReport()`
- **الاعتماديات**: React, Shadcn UI, Framer Motion

---

#### 3. **components/cost-comparison.tsx**
- **الوصف**: مكون المقارنة بين عروض متعددة
- **الحجم**: 163 سطر
- **النوع**: مكون React
- **المميزات**:
  - مقارنة عرضين
  - عرض الفروقات بصرياً
  - ملخص تحليلي
  - رسوم بيانية
- **الخصائص**:
  - `estimate1` - العرض الأول
  - `estimate2` - العرض الثاني
- **الأحداث**: `onCompare`

---

#### 4. **components/cost-estimates-list.tsx**
- **الوصف**: قائمة العروض المحفوظة
- **الحجم**: 178 سطر
- **النوع**: مكون React
- **المميزات**:
  - عرض جميع العروض
  - تعديل وحذف
  - تصدير وتحميل
  - بحث وترتيب
  - تصفية حسب التاريخ
- **الحالات الرئيسية**:
  - `estimates` - قائمة العروض
  - `searchTerm` - مصطلح البحث
  - `selectedEstimate` - العرض المختار
- **الدوال الرئيسية**:
  - `handleSearch()`
  - `handleDelete()`
  - `handleEdit()`
  - `handleExport()`

---

### 📄 3️⃣ صفحات التطبيق (app/)

#### 1. **app/cost-calculator/page.tsx**
- **الوصف**: صفحة الحاسبة المتقدمة
- **المسار**: `/cost-calculator`
- **الحجم**: 66 سطر
- **النوع**: صفحة React + Vite
- **الوظيفة**: صفحة رئيسية للحاسبة
- **المحتوى**:
  - عنوان الصفحة
  - وصف
  - مكون الحاسبة المتقدمة
- **الـ SEO**:
  - العنوان (Title): حاسبة التكاليف
  - الوصف (Description): احسب تكاليف مشروعك

---

#### 2. **app/cost-estimates/page.tsx**
- **الوصف**: صفحة قائمة العروض
- **المسار**: `/cost-estimates`
- **الحجم**: 33 سطر
- **النوع**: صفحة React + Vite
- **الوظيفة**: عرض وإدارة جميع العروض
- **المحتوى**:
  - عنوان الصفحة
  - وصف
  - مكون قائمة العروض
- **الـ SEO**: معلومات الصفحة

---

### 📚 4️⃣ الوثائق والأدلة (Documentation)

#### 1. **COST_CALCULATOR_DOCUMENTATION.md**
- **الوصف**: وثائق شاملة لنظام الحساب
- **الحجم**: 402 سطر
- **المحتوى**:
  - نظرة عامة شاملة
  - البنية المعمارية الكاملة
  - شرح مفصل للخدمات
  - شرح المكونات
  - أمثلة الاستخدام
  - الاختبار والتصحيح
- **الهدف**: فهم عميق للنظام

---

#### 2. **COST_SYSTEM_SETUP.md**
- **الوصف**: دليل الإعداد والتثبيت
- **الحجم**: 233 سطر
- **المحتوى**:
  - متطلبات النظام
  - خطوات التثبيت
  - إعداد قاعدة البيانات Supabase
  - متطلبات البيئة
  - استكشاف الأخطاء وحلولها
- **الهدف**: إعداد دقيق للنظام

---

#### 3. **COST_QUICK_START.md**
- **الوصف**: دليل البدء السريع
- **الحجم**: 124 سطر
- **المحتوى**:
  - خطوات بسيطة للبدء
  - أمثلة سريعة
  - الأسئلة الشائعة (FAQ)
  - الاختصارات المفيدة
- **الهدف**: البدء السريع في 10 دقائق

---

#### 4. **COST_SYSTEM_DELIVERY.md**
- **الوصف**: ملخص التسليم الشامل
- **الحجم**: 374 سطر
- **المحتوى**:
  - ملخص المشروع الكامل
  - الميزات الأساسية
  - الإحصائيات والأرقام
  - خطوات التنفيذ
  - المتطلبات والتوافقية
- **الهدف**: نظرة شاملة على التسليم

---

#### 5. **COST_SYSTEM_FINAL_SUMMARY.md**
- **الوصف**: الملخص النهائي الشامل
- **الحجم**: 401 سطر
- **المحتوى**:
  - نظرة شاملة على كل شيء
  - أمثلة كاملة للاستخدام
  - خطوات التنفيذ المفصلة
  - الخطوات التالية
  - ملاحظات مهمة
- **الهدف**: مرجع نهائي شامل

---

## 📊 ملخص الأرقام

### حسب نوع الملف:

| النوع | عدد الملفات | أسطر الكود | الإجمالي |
|-------|-----------|----------|---------|
| خدمات (Services) | 3 | 984 | 984 |
| مكونات (Components) | 4 | 1,084 | 1,084 |
| صفحات (Pages) | 2 | 99 | 99 |
| وثائق (Docs) | 5 | - | 1,534 |
| **المجموع** | **14** | **2,167** | **3,701** |

### تفصيل الخدمات:
- `cost-calculator-service.ts`: 324 سطر
- `cost-database-service.ts`: 252 سطر
- `cost-reports-service.ts`: 408 سطر
- **المجموع**: 984 سطر

### تفصيل المكونات:
- `cost-calculator-advanced.tsx`: 593 سطر
- `cost-estimates-list.tsx`: 178 سطر
- `cost-comparison.tsx`: 163 سطر
- `cost-calculator.tsx`: 150 سطر
- **المجموع**: 1,084 سطر

### تفصيل الصفحات:
- `app/cost-calculator/page.tsx`: 66 سطر
- `app/cost-estimates/page.tsx`: 33 سطر
- **المجموع**: 99 سطر

---

## 🔗 العلاقات بين الملفات

```
صفحات التطبيق (Pages)
  ↓
مكونات React (Components)
  ├─ cost-calculator-advanced.tsx
  │   ├─ يستخدم ← cost-calculator-service.ts
  │   ├─ يستخدم ← cost-database-service.ts
  │   ├─ يستخدم ← cost-reports-service.ts
  │   └─ يستخدم ← cost-comparison.tsx
  │
  ├─ cost-estimates-list.tsx
  │   ├─ يستخدم ← cost-database-service.ts
  │   └─ يستخدم ← cost-reports-service.ts
  │
  └─ cost-calculator.tsx
      └─ يستخدم ← cost-calculator-service.ts
```

---

## 💾 قاعدة البيانات (Database)

### الجداول الرئيسية:

1. **estimates** - الجدول الرئيسي للعروض
   - `id` (UUID) - معرّف العرض
   - `name` (String) - اسم العرض
   - `description` (Text) - الوصف
   - `project_type` (String) - نوع المشروع
   - `created_at` (Timestamp) - تاريخ الإنشاء
   - `updated_at` (Timestamp) - تاريخ التعديل
   - `total_cost` (Decimal) - التكلفة الإجمالية

2. **items** - جدول العناصر
   - `id` (UUID) - معرّف العنصر
   - `estimate_id` (UUID) - معرّف العرض
   - `name` (String) - اسم العنصر
   - `quantity` (Number) - الكمية
   - `unit_price` (Decimal) - السعر للوحدة
   - `total` (Decimal) - الإجمالي

3. **categories** - فئات التكاليف
   - `id` (UUID) - معرّف الفئة
   - `name` (String) - اسم الفئة
   - `description` (Text) - الوصف

---

## 🎯 الملفات الأساسية المهمة

### يجب عدم حذفها أو تعديلها بدون حذر:

1. **lib/cost-calculator-service.ts** ⭐⭐⭐
   - يحتوي على المنطق الحسابي الأساسي
   - اعتماديات قوية عليه من المكونات

2. **lib/cost-database-service.ts** ⭐⭐⭐
   - يتعامل مع البيانات والحفظ
   - متصل مع Supabase مباشرة

3. **components/cost-calculator-advanced.tsx** ⭐⭐
   - الواجهة الرئيسية للنظام
   - يستخدمه المستخدم بشكل مباشر

---

## 🚀 الاستخدام السريع

### للبدء السريع:
1. اقرأ: `COST_QUICK_START.md`
2. اختبر الحاسبة على `/cost-calculator`
3. عاين العروض على `/cost-estimates`

### للفهم العميق:
1. ابدأ بـ: `COST_CALCULATOR_DOCUMENTATION.md`
2. ثم: `COST_SYSTEM_SETUP.md`
3. أخيراً: `COST_SYSTEM_DELIVERY.md`

### للإعداد الكامل:
1. اتبع: `COST_SYSTEM_SETUP.md` خطوة بخطوة
2. أنشئ جداول Supabase
3. ادخل متغيرات البيئة

---

## 📋 قائمة التحقق

- [x] تم إنشاء 3 خدمات
- [x] تم إنشاء 4 مكونات React
- [x] تم إنشاء صفحتي التطبيق
- [x] تم كتابة 5 ملفات وثائق
- [x] تم اختبار الملفات الأساسية
- [x] تم التحقق من الاعتماديات
- [x] تم التوثيق الكامل

---

## 📞 للدعم والمساعدة

- البريد الإلكتروني: info@al-azab.co
- الهاتف: +201004006620
- الموقع: https://al-azab.co

---

**النسخة**: 1.0.0
**التاريخ**: 2026
**الحالة**: ✅ جاهز للإنتاج
