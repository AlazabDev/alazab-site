import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const PrivacyPolicyPage = () => (
  <LegalPageLayout title="سياسة الخصوصية" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>سياسة الخصوصية | العزب للمقاولات</title>
      <meta name="description" content="سياسة الخصوصية لشركة العزب للمقاولات - كيف نجمع ونستخدم ونحمي بياناتك الشخصية" />
      <link rel="canonical" href="https://alazab.com/privacy-policy" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. مقدمة</h2>
      <p>
        نحن في شركة العزب للمقاولات ("الشركة"، "نحن") نلتزم بحماية خصوصية بياناتك الشخصية. توضح هذه السياسة كيفية جمع واستخدام وحماية ومشاركة المعلومات التي نحصل عليها منك عند استخدامك لموقعنا الإلكتروني
        <span className="font-medium" dir="ltr"> alazab.com </span>
        أو أي من خدماتنا الرقمية.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. البيانات التي نجمعها</h2>
      <p>نقوم بجمع الأنواع التالية من البيانات:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li><strong>بيانات شخصية:</strong> الاسم الكامل، البريد الإلكتروني، رقم الهاتف، العنوان.</li>
        <li><strong>بيانات الخدمة:</strong> تفاصيل طلبات الصيانة، المشاريع، الفواتير والعقود.</li>
        <li><strong>بيانات تقنية:</strong> عنوان IP، نوع المتصفح، نظام التشغيل، ملفات تعريف الارتباط (Cookies).</li>
        <li><strong>بيانات الموقع الجغرافي:</strong> عند تقديم طلبات صيانة تتطلب تحديد الموقع.</li>
        <li><strong>بيانات التواصل:</strong> الرسائل المرسلة عبر نماذج الاتصال أو الشات بوت.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. كيف نستخدم بياناتك</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>تقديم وتحسين خدماتنا ومعالجة طلبات الصيانة.</li>
        <li>التواصل معك بخصوص طلباتك ومشاريعك.</li>
        <li>إرسال إشعارات وتحديثات متعلقة بالخدمات.</li>
        <li>تحسين تجربة المستخدم وتحليل أداء الموقع.</li>
        <li>الامتثال للمتطلبات القانونية والتنظيمية.</li>
        <li>إصدار الفواتير وإدارة العقود.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. مشاركة البيانات</h2>
      <p>لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك بياناتك في الحالات التالية فقط:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>مع مقدمي الخدمات الموثوقين (مثل Supabase لاستضافة البيانات).</li>
        <li>مع الفنيين المعينين لتنفيذ طلبات الصيانة الخاصة بك.</li>
        <li>عند الضرورة القانونية أو بأمر قضائي.</li>
        <li>لحماية حقوقنا القانونية أو سلامة المستخدمين.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. حماية البيانات</h2>
      <p>نطبق إجراءات أمنية صارمة تشمل:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>تشفير البيانات أثناء النقل باستخدام بروتوكول TLS/SSL.</li>
        <li>سياسات أمان على مستوى الصفوف (Row Level Security - RLS).</li>
        <li>تشفير البيانات الحساسة (أرقام الهواتف والبريد الإلكتروني).</li>
        <li>سجلات تدقيق (Audit Logs) لتتبع الوصول والتعديلات.</li>
        <li>مراجعات أمنية دورية.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">6. حقوقك</h2>
      <p>يحق لك:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>الوصول إلى بياناتك الشخصية ومعرفة كيفية استخدامها.</li>
        <li>طلب تصحيح أو تحديث بياناتك.</li>
        <li>طلب حذف بياناتك الشخصية.</li>
        <li>الاعتراض على معالجة بياناتك لأغراض تسويقية.</li>
        <li>سحب موافقتك في أي وقت.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">7. الاحتفاظ بالبيانات</h2>
      <p>
        نحتفظ ببياناتك الشخصية طالما كان ذلك ضروريًا لتقديم خدماتنا أو للامتثال للالتزامات القانونية. يتم حذف البيانات أو إخفاء هويتها عند انتهاء الغرض من جمعها.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">8. التواصل معنا</h2>
      <p>لأي استفسارات تتعلق بالخصوصية، يمكنك التواصل معنا عبر:</p>
      <div className="bg-muted rounded-lg p-4 mt-3 space-y-1">
        <p><strong>البريد الإلكتروني:</strong> <span dir="ltr">privacy@al-azab.co</span></p>
        <p><strong>الهاتف:</strong> <span dir="ltr">+201004006620</span></p>
        <p><strong>العنوان:</strong> مصر، القاهرة، المعادي</p>
      </div>
    </section>
  </LegalPageLayout>
);

export default PrivacyPolicyPage;
