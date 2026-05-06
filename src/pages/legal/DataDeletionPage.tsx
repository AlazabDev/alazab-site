import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const DataDeletionPage = () => (
  <LegalPageLayout title="حذف البيانات الشخصية" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>حذف البيانات | العزب للمقاولات</title>
      <meta name="description" content="طلب حذف بياناتك الشخصية من أنظمة شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/data-deletion" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">حقك في حذف بياناتك</h2>
      <p>
        نحترم حقك في التحكم ببياناتك الشخصية. يمكنك طلب حذف جميع بياناتك الشخصية المخزنة لدينا في أي وقت وفقًا لقوانين حماية البيانات المعمول بها.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">البيانات التي سيتم حذفها</h2>
      <p>عند تقديم طلب الحذف، سنقوم بإزالة:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>معلومات الحساب الشخصي (الاسم، البريد الإلكتروني، رقم الهاتف).</li>
        <li>سجل طلبات الصيانة والمحادثات.</li>
        <li>بيانات الموقع الجغرافي.</li>
        <li>تفضيلات الحساب والإعدادات.</li>
        <li>سجلات الدخول والنشاط.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">البيانات المستثناة من الحذف</h2>
      <p>قد نحتفظ ببعض البيانات للأغراض التالية:</p>
      <ul className="list-disc pr-6 space-y-2 mt-3">
        <li>سجلات الفواتير والمعاملات المالية (لمدة 5 سنوات وفقًا للقانون).</li>
        <li>بيانات العقود النشطة حتى انتهاء مدتها.</li>
        <li>سجلات التدقيق المطلوبة قانونيًا.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">كيفية تقديم طلب الحذف</h2>
      <div className="space-y-4">
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">الطريقة 1: عبر البريد الإلكتروني</h3>
          <p>أرسل طلبك إلى <span dir="ltr" className="font-medium">privacy@al-azab.co</span> مع ذكر:</p>
          <ul className="list-disc pr-6 space-y-1 mt-2 text-sm">
            <li>اسمك الكامل المسجل في الحساب.</li>
            <li>البريد الإلكتروني المرتبط بالحساب.</li>
            <li>رقم الهاتف المسجل.</li>
            <li>سبب طلب الحذف (اختياري).</li>
          </ul>
        </div>

        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-2">الطريقة 2: عبر صفحة الاتصال</h3>
          <p>يمكنك تقديم طلب حذف البيانات من خلال نموذج الاتصال.</p>
          <Link to="/contact">
            <Button className="mt-3 bg-construction-primary hover:bg-construction-dark">
              الذهاب لصفحة الاتصال
            </Button>
          </Link>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">الجدول الزمني</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>سنؤكد استلام طلبك خلال <strong>48 ساعة عمل</strong>.</li>
        <li>سيتم تنفيذ الحذف خلال <strong>30 يومًا</strong> من تاريخ التأكيد.</li>
        <li>ستتلقى إشعارًا بالبريد الإلكتروني عند اكتمال العملية.</li>
      </ul>
    </section>
  </LegalPageLayout>
);

export default DataDeletionPage;
