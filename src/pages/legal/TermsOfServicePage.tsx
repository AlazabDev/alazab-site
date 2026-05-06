import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const TermsOfServicePage = () => (
  <LegalPageLayout title="الشروط والأحكام" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>الشروط والأحكام | العزب للمقاولات</title>
      <meta name="description" content="الشروط والأحكام لاستخدام خدمات وموقع شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/terms-of-service" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. القبول بالشروط</h2>
      <p>
        باستخدامك لموقع العزب للمقاولات (<span dir="ltr">alazab.com</span>) أو أي من خدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع أو الخدمات.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. وصف الخدمات</h2>
      <p>تقدم شركة العزب للمقاولات الخدمات التالية:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>المقاولات العامة والإنشاءات.</li>
        <li>خدمات الصيانة والتشغيل.</li>
        <li>التصميم المعماري والاستشارات الهندسية.</li>
        <li>إدارة المشاريع والتطوير العقاري.</li>
        <li>التوريدات العامة والهوية التجارية.</li>
        <li>نظام إدارة طلبات الصيانة الإلكتروني.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. حسابات المستخدمين</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>أنت مسؤول عن الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك.</li>
        <li>يجب أن تكون المعلومات المقدمة عند التسجيل دقيقة وحديثة.</li>
        <li>يحق لنا تعليق أو إلغاء حسابك في حالة مخالفة هذه الشروط.</li>
        <li>يُحظر مشاركة حسابك مع أشخاص آخرين.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. طلبات الصيانة</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>يتم تقديم طلبات الصيانة عبر النموذج المخصص على الموقع.</li>
        <li>يتم تعيين رقم مرجعي فريد لكل طلب لتتبعه.</li>
        <li>تخضع أوقات الاستجابة لاتفاقيات مستوى الخدمة (SLA) المحددة في العقد.</li>
        <li>يحق لنا رفض أو تعديل طلبات لا تتوافق مع نطاق الخدمة.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. الأسعار والدفع</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>الأسعار المعروضة قابلة للتغيير دون إشعار مسبق.</li>
        <li>يتم إصدار الفواتير وفقًا لشروط العقد المبرم.</li>
        <li>تُستحق الدفعات في المواعيد المحددة في الفاتورة.</li>
        <li>التأخر في الدفع قد يؤدي إلى تعليق الخدمات.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">6. الملكية الفكرية</h2>
      <p>
        جميع المحتويات المعروضة على الموقع، بما في ذلك التصاميم والنصوص والصور والشعارات والعلامة التجارية (D-U-N-S No: 849203826)، هي ملكية حصرية لشركة العزب للمقاولات ومحمية بموجب قوانين الملكية الفكرية.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">7. تحديد المسؤولية</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>لا نتحمل مسؤولية أي أضرار غير مباشرة أو تبعية ناتجة عن استخدام الموقع.</li>
        <li>مسؤوليتنا القصوى لا تتجاوز قيمة الخدمات المدفوعة.</li>
        <li>لا نضمن توفر الموقع بشكل مستمر دون انقطاع.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">8. القانون الواجب التطبيق</h2>
      <p>
        تخضع هذه الشروط والأحكام لقوانين جمهورية مصر العربية. أي نزاع ينشأ عن هذه الشروط يخضع لاختصاص محاكم القاهرة.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">9. التعديلات</h2>
      <p>
        نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إشعارك بالتعديلات الجوهرية عبر البريد الإلكتروني أو من خلال إشعار على الموقع. استمرارك في استخدام الخدمات بعد التعديل يعني موافقتك على الشروط المحدثة.
      </p>
    </section>
  </LegalPageLayout>
);

export default TermsOfServicePage;
