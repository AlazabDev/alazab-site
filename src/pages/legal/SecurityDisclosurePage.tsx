import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

const SecurityDisclosurePage = () => (
  <LegalPageLayout title="الأمان والإفصاح المسؤول" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>الأمان والإفصاح المسؤول | العزب للمقاولات</title>
      <meta name="description" content="سياسة الأمان والإفصاح المسؤول عن الثغرات لشركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/security" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">التزامنا بالأمان</h2>
      <p>
        في شركة العزب للمقاولات، نأخذ أمان بيانات عملائنا وأنظمتنا على محمل الجد. نطبق أفضل الممارسات الأمنية لحماية معلوماتك.
      </p>
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        {[
          { icon: Lock, title: 'تشفير البيانات', desc: 'جميع البيانات مشفرة أثناء النقل والتخزين باستخدام TLS/SSL.' },
          { icon: Shield, title: 'حماية على مستوى الصفوف', desc: 'سياسات RLS تمنع الوصول غير المصرح به للبيانات.' },
          { icon: Eye, title: 'سجلات التدقيق', desc: 'مراقبة كاملة لجميع عمليات الوصول والتعديل.' },
          { icon: AlertTriangle, title: 'كشف التهديدات', desc: 'أنظمة متقدمة لاكتشاف الأنشطة المشبوهة والاستجابة لها.' },
        ].map((item) => (
          <div key={item.title} className="border rounded-lg p-4 flex gap-3">
            <item.icon className="w-6 h-6 text-construction-accent shrink-0 mt-1" />
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">برنامج الإفصاح المسؤول</h2>
      <p>
        نرحب بالباحثين الأمنيين الذين يساعدوننا في تحسين أمان أنظمتنا. إذا اكتشفت ثغرة أمنية، نرجو إبلاغنا بشكل مسؤول.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">كيفية الإبلاغ</h2>
      <div className="bg-muted rounded-lg p-5 space-y-3">
        <p>أرسل تقرير الثغرة إلى: <span dir="ltr" className="font-medium">security@al-azab.co</span></p>
        <p>يرجى تضمين:</p>
        <ul className="list-disc pr-6 space-y-1 text-sm">
          <li>وصف تفصيلي للثغرة ونوعها.</li>
          <li>خطوات إعادة إنتاج المشكلة.</li>
          <li>التأثير المحتمل.</li>
          <li>اقتراحات للإصلاح (إن وجدت).</li>
          <li>معلومات التواصل الخاصة بك.</li>
        </ul>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">قواعد الإفصاح المسؤول</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>امنحنا وقتًا كافيًا (90 يومًا) لمعالجة الثغرة قبل الإفصاح العام.</li>
        <li>لا تستغل الثغرة للوصول لبيانات لا تخصك.</li>
        <li>لا تقم بتعطيل أو إتلاف أنظمتنا أو بيانات المستخدمين.</li>
        <li>لا تستخدم أدوات آلية مكثفة قد تؤثر على أداء الخدمة.</li>
        <li>تجنب اختبارات الهندسة الاجتماعية أو التصيد الاحتيالي.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">التزاماتنا</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>تأكيد استلام تقريرك خلال 48 ساعة عمل.</li>
        <li>تقديم تحديثات منتظمة عن حالة المعالجة.</li>
        <li>عدم اتخاذ إجراءات قانونية ضد الباحثين الملتزمين بهذه القواعد.</li>
        <li>الاعتراف بمساهمتك (إذا رغبت) عند إصلاح الثغرة.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">النطاق</h2>
      <p>يشمل برنامج الإفصاح المسؤول:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li dir="ltr">alazab.com (main website)</li>
        <li dir="ltr">erp.alazab.com (ERP system)</li>
        <li>واجهات برمجة التطبيقات (APIs) المرتبطة.</li>
        <li>تطبيقات الهاتف المحمول (إن وجدت).</li>
      </ul>
    </section>
  </LegalPageLayout>
);

export default SecurityDisclosurePage;
