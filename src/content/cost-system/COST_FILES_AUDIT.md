# Alazab Online - Cost System Files Audit

## الخلاصة
تم استخراج ملفات نظام حساب التكاليف من نسخة ZIP المرفوعة محليًا. هذه الملفات موجودة داخل الـ ZIP، لكن البحث المباشر في GitHub على `AlazabDev/alazab.online` لم يرجعها، وقراءة بعض المسارات على `main` رجعت 404 سابقًا، لذلك الاحتمال الأقوى أن نسخة ZIP أحدث من الفرع المنشور أو لم يتم رفعها بعد.

## الملفات التنفيذية الأساسية

| الملف | الدور |
|---|---|
| `lib/cost-calculator-service.ts` | قلب معادلات حساب التكاليف، الأسعار، النسب، الضريبة، الملخص |
| `lib/cost-database-service.ts` | حفظ واسترجاع العروض من Supabase: `cost_estimates`, `cost_estimate_items`, `cost_comparisons` |
| `lib/cost-reports-service.ts` | إنشاء تقارير HTML/CSV/Text والطباعة والمقارنة |
| `components/cost-calculator-advanced.tsx` | الواجهة الرئيسية المتقدمة وتربط الحساب + الحفظ + التقارير |
| `components/cost-calculator.tsx` | الحاسبة الأساسية القديمة/المبسطة |

## صفحات التشغيل

| الملف | الدور |
|---|---|
| `app/cost-calculator/page.tsx` | صفحة الحاسبة المتقدمة |
| `app/cost-estimates/page.tsx` | صفحة قائمة عروض التكاليف |
| `app/calculator/page.tsx` | صفحة إضافية تشغل الحاسبة الأساسية `CostCalculator` |

## ملفات العرض المساندة

| الملف | الدور |
|---|---|
| `components/cost-estimates-list.tsx` | عرض وحذف العروض المحفوظة |
| `components/cost-comparison.tsx` | مقارنة عرضين من حيث الإجمالي، المتر، المواد، العمالة، التشطيب |

## ملفات الوثائق والمرجع

| الملف | الدور |
|---|---|
| `COST_CALCULATOR_DOCUMENTATION.md` | توثيق النظام |
| `COST_SYSTEM_SETUP.md` | إعداد النظام |
| `COST_QUICK_START.md` | بدء سريع |
| `COST_SYSTEM_DELIVERY.md` | تسليم النظام |
| `COST_SYSTEM_FINAL_SUMMARY.md` | ملخص نهائي |
| `COST_SYSTEM_FILES_LIST.md` | قائمة تفصيلية للملفات |
| `COST_SYSTEM_QUICK_FILES_REFERENCE.txt` | مرجع سريع |
| `COST_SYSTEM_FILES.json` | فهرس JSON |

## ملاحظات فنية مباشرة

1. الملف الأهم للحسابات هو `lib/cost-calculator-service.ts`.
2. الحساب المتقدم يستخدم سعر أساس افتراضي `5000` جنيه/م²، ثم يطبّق معامل نوع المشروع ومعامل التشطيب.
3. ضريبة القيمة المضافة ثابتة داخل الكود بنسبة `14%`.
4. الحاسبة المتقدمة لا تستخدم معامل الموقع رغم وجود `LOCATION_MULTIPLIERS` داخل الخدمة.
5. `components/cost-calculator.tsx` يحتوي حسابًا منفصلًا عن الخدمة المركزية؛ هذا قد يسبب اختلاف نتائج بين صفحة `/calculator` وصفحة `/cost-calculator`.
6. ملفات التكاليف موجودة داخل نسخة ZIP، لكن لم تثبت قراءتها من GitHub `main` عبر الفحص المباشر السابق.
