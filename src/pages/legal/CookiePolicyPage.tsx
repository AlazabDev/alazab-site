import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const CookiePolicyPage = () => (
  <LegalPageLayout title="سياسة ملفات تعريف الارتباط" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>سياسة ملفات تعريف الارتباط | العزب للمقاولات</title>
      <meta name="description" content="سياسة ملفات تعريف الارتباط (Cookies) لموقع شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/cookie-policy" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. ما هي ملفات تعريف الارتباط؟</h2>
      <p>
        ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة يتم تخزينها على جهازك عند زيارة موقعنا. تساعدنا في تحسين تجربتك وتقديم خدمة أفضل.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. أنواع ملفات تعريف الارتباط التي نستخدمها</h2>

      <h3 className="text-lg font-semibold mt-4 mb-2">ملفات ضرورية</h3>
      <p>لازمة لعمل الموقع بشكل صحيح، تشمل:</p>
      <ul className="list-disc pr-6 space-y-1 mt-2">
        <li>جلسات تسجيل الدخول والمصادقة (Supabase Auth).</li>
        <li>تفضيلات الأمان وحماية CSRF.</li>
        <li>تذكر إعدادات اللغة والعرض.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">ملفات تحليلية</h3>
      <p>تساعدنا في فهم كيفية استخدام الزوار للموقع:</p>
      <ul className="list-disc pr-6 space-y-1 mt-2">
        <li>عدد الزيارات ومدة الجلسات.</li>
        <li>الصفحات الأكثر زيارة.</li>
        <li>مصادر الزيارات.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">ملفات وظيفية</h3>
      <p>تتيح ميزات محسّنة مثل:</p>
      <ul className="list-disc pr-6 space-y-1 mt-2">
        <li>تذكر تفضيلاتك (الوضع الليلي/النهاري).</li>
        <li>حفظ بيانات النماذج المملوءة جزئيًا.</li>
        <li>تخصيص المحتوى المعروض.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. إدارة ملفات تعريف الارتباط</h2>
      <p>يمكنك التحكم في ملفات تعريف الارتباط من خلال:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>إعدادات المتصفح: يمكنك حظر أو حذف ملفات تعريف الارتباط.</li>
        <li>تعطيل ملفات معينة دون التأثير على الملفات الضرورية.</li>
        <li>استخدام وضع التصفح الخاص/المتخفي.</li>
      </ul>
      <p className="mt-3 p-3 bg-muted rounded-lg text-sm">
        <strong>ملاحظة:</strong> تعطيل ملفات تعريف الارتباط الضرورية قد يؤثر على وظائف الموقع الأساسية مثل تسجيل الدخول وتقديم الطلبات.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. ملفات تعريف الارتباط من أطراف ثالثة</h2>
      <p>قد يستخدم موقعنا خدمات أطراف ثالثة تضع ملفات تعريف ارتباط خاصة بها:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li><strong>Supabase:</strong> لإدارة المصادقة والجلسات.</li>
        <li><strong>خدمات التحليل:</strong> لقياس أداء الموقع.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. التحديثات</h2>
      <p>
        قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة مع تحديث تاريخ "آخر تحديث".
      </p>
    </section>
  </LegalPageLayout>
);

export default CookiePolicyPage;
