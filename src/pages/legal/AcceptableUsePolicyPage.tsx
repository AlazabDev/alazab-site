import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const AcceptableUsePolicyPage = () => (
  <LegalPageLayout title="سياسة الاستخدام المقبول" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>سياسة الاستخدام المقبول | العزب للمقاولات</title>
      <meta name="description" content="سياسة الاستخدام المقبول لموقع وخدمات شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/acceptable-use" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. الغرض</h2>
      <p>
        تحدد هذه السياسة القواعد والإرشادات للاستخدام المقبول لموقع العزب للمقاولات وجميع الخدمات الرقمية المرتبطة به، بما في ذلك نظام إدارة الصيانة ونظام ERP.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. الاستخدام المسموح</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>تصفح محتوى الموقع والاطلاع على الخدمات والمشاريع.</li>
        <li>تقديم طلبات صيانة مشروعة عبر النماذج المخصصة.</li>
        <li>التواصل مع فريق الدعم عبر القنوات الرسمية.</li>
        <li>استخدام لوحة التحكم والتقارير وفقًا لصلاحياتك.</li>
        <li>تحميل الوثائق والملفات المتعلقة بطلباتك.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. الاستخدام المحظور</h2>
      <p>يُحظر عليك القيام بأي من الأنشطة التالية:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>محاولة الوصول غير المصرح به لأنظمتنا أو بيانات مستخدمين آخرين.</li>
        <li>تقديم معلومات كاذبة أو مضللة في الطلبات أو النماذج.</li>
        <li>استخدام الموقع لأغراض غير قانونية أو احتيالية.</li>
        <li>نسخ أو توزيع محتوى الموقع دون إذن كتابي.</li>
        <li>استخدام برامج آلية (Bots) لاستخراج البيانات أو إرسال طلبات مكررة.</li>
        <li>تحميل ملفات ضارة أو تحتوي على فيروسات.</li>
        <li>التدخل في عمل الموقع أو محاولة تعطيله (هجمات DDoS).</li>
        <li>انتحال هوية مستخدم آخر أو موظف في الشركة.</li>
        <li>استخدام الشات بوت لإرسال محتوى مسيء أو غير لائق.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. أمن الحساب</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>استخدم كلمة مرور قوية وفريدة لحسابك.</li>
        <li>لا تشارك بيانات تسجيل الدخول مع أي شخص.</li>
        <li>أبلغنا فورًا عن أي نشاط مشبوه على حسابك.</li>
        <li>قم بتسجيل الخروج من الأجهزة المشتركة.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. العواقب</h2>
      <p>مخالفة هذه السياسة قد تؤدي إلى:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>تحذير كتابي.</li>
        <li>تعليق مؤقت أو دائم للحساب.</li>
        <li>اتخاذ إجراءات قانونية إذا لزم الأمر.</li>
        <li>الإبلاغ للجهات المختصة في حالات الأنشطة غير القانونية.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">6. الإبلاغ عن المخالفات</h2>
      <p>إذا لاحظت أي مخالفة لهذه السياسة، يرجى الإبلاغ عبر:</p>
      <div className="bg-muted rounded-lg p-4 mt-3">
        <p>البريد الإلكتروني: <span dir="ltr">abuse@al-azab.co</span></p>
        <p className="text-sm text-muted-foreground mt-1">سيتم التعامل مع جميع البلاغات بسرية تامة.</p>
      </div>
    </section>
  </LegalPageLayout>
);

export default AcceptableUsePolicyPage;
