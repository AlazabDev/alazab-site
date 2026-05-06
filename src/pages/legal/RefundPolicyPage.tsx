import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const RefundPolicyPage = () => (
  <LegalPageLayout title="سياسة الاسترداد والإلغاء" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>سياسة الاسترداد والإلغاء | العزب للمقاولات</title>
      <meta name="description" content="سياسة الاسترداد والإلغاء لخدمات شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/refund-policy" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. نطاق السياسة</h2>
      <p>
        تنطبق هذه السياسة على جميع الخدمات المقدمة من شركة العزب للمقاولات، بما في ذلك خدمات الصيانة والمقاولات والتصميم والاستشارات.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. إلغاء طلبات الصيانة</h2>
      <div className="space-y-3">
        <div className="border-r-4 border-green-500 pr-4 py-2">
          <p className="font-semibold text-green-700">قبل التعيين للفني</p>
          <p className="text-sm">يمكن إلغاء الطلب مجانًا بالكامل واسترداد أي مبلغ مدفوع مقدمًا.</p>
        </div>
        <div className="border-r-4 border-yellow-500 pr-4 py-2">
          <p className="font-semibold text-yellow-700">بعد تعيين الفني وقبل الوصول</p>
          <p className="text-sm">يمكن الإلغاء مع خصم رسوم إدارية بنسبة 10% من قيمة الخدمة.</p>
        </div>
        <div className="border-r-4 border-red-500 pr-4 py-2">
          <p className="font-semibold text-red-700">بعد بدء التنفيذ</p>
          <p className="text-sm">يتم احتساب تكلفة الأعمال المنجزة والمواد المستخدمة، ويُسترد الباقي.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. إلغاء عقود المقاولات</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>يخضع الإلغاء لشروط العقد المبرم بين الطرفين.</li>
        <li>يحق للعميل إنهاء العقد بإشعار كتابي مسبق (30 يومًا).</li>
        <li>يتم احتساب نسبة الإنجاز الفعلية والمواد المشتراة.</li>
        <li>تُعاد الضمانات المالية وفقًا لشروط العقد.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. عقود الصيانة الدورية</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>يمكن إلغاء العقد الشهري بإشعار مسبق قبل 15 يومًا.</li>
        <li>العقود السنوية: يمكن الإلغاء مع دفع غرامة تعادل شهرين.</li>
        <li>لا يُسترد المبلغ عن الفترة المستهلكة من العقد.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. آلية الاسترداد</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>يتم الاسترداد بنفس طريقة الدفع الأصلية.</li>
        <li>مدة معالجة الاسترداد: 7-14 يوم عمل.</li>
        <li>يتم إصدار إشعار دائن (Credit Note) بالمبلغ المسترد.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">6. الحالات غير القابلة للاسترداد</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>الخدمات المنجزة والمقبولة من العميل.</li>
        <li>المواد المصنعة أو المقطعة حسب الطلب.</li>
        <li>رسوم الاستشارات والتصاميم المسلّمة.</li>
        <li>تكاليف التراخيص والتصاريح المستخرجة.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">7. تقديم طلب استرداد</h2>
      <div className="bg-muted rounded-lg p-4">
        <p>لتقديم طلب استرداد أو إلغاء، تواصل معنا عبر:</p>
        <ul className="list-disc pr-6 space-y-1 mt-2 text-sm">
          <li>البريد الإلكتروني: <span dir="ltr">support@al-azab.co</span></li>
          <li>الهاتف: <span dir="ltr">+201004006620</span></li>
          <li>من خلال نظام إدارة الطلبات في حسابك.</li>
        </ul>
      </div>
    </section>
  </LegalPageLayout>
);

export default RefundPolicyPage;
