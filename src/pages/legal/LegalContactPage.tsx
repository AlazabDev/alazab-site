import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';
import { Mail, Phone, MapPin, Building2, Scale } from 'lucide-react';

const LegalContactPage = () => (
  <LegalPageLayout title="الاتصال القانوني" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>الاتصال القانوني | العزب للمقاولات</title>
      <meta name="description" content="معلومات الاتصال القانونية لشركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/legal-contact" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">معلومات الشركة القانونية</h2>
      <div className="bg-muted rounded-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-construction-accent mt-1 shrink-0" />
          <div>
            <p className="font-semibold">الاسم التجاري</p>
            <p>شركة العزب للإنشاءات والمقاولات المتكاملة</p>
            <p className="text-sm text-muted-foreground" dir="ltr">Al-Azab Construction & Integrated Contracting</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-construction-accent mt-1 shrink-0" />
          <div>
            <p className="font-semibold">رقم التسجيل التجاري (D-U-N-S)</p>
            <p dir="ltr">849203826</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">جهات الاتصال القانونية</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-lg">الشؤون القانونية</h3>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-construction-accent" />
            <span dir="ltr">legal@al-azab.co</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-construction-accent" />
            <span dir="ltr">+201004006620</span>
          </div>
          <p className="text-sm text-muted-foreground">للاستفسارات القانونية، العقود، والنزاعات.</p>
        </div>

        <div className="border rounded-lg p-5 space-y-3">
          <h3 className="font-semibold text-lg">حماية البيانات</h3>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-construction-accent" />
            <span dir="ltr">privacy@al-azab.co</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-construction-accent" />
            <span dir="ltr">+201004006620</span>
          </div>
          <p className="text-sm text-muted-foreground">لطلبات الخصوصية وحذف البيانات.</p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">المقرات</h2>
      <div className="space-y-3">
        {[
          { name: 'المقر الرئيسي - القاهرة', address: 'مصر، القاهرة، المعادي', phone: '+201004006620' },
          { name: 'فرع جدة - السعودية', address: 'المملكة العربية السعودية، جدة', phone: '+966547330897' },
          { name: 'فرع الدقهلية - مصر', address: 'مصر، الدقهلية، مدينة نبروه', phone: '+201014536600' },
        ].map((branch) => (
          <div key={branch.name} className="flex items-start gap-3 bg-muted rounded-lg p-4">
            <MapPin className="w-5 h-5 text-construction-accent mt-1 shrink-0" />
            <div>
              <p className="font-semibold">{branch.name}</p>
              <p className="text-sm">{branch.address}</p>
              <p className="text-sm text-construction-accent" dir="ltr">{branch.phone}</p>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">الاختصاص القضائي</h2>
      <p>
        تخضع جميع العلاقات القانونية مع شركة العزب للمقاولات لقوانين جمهورية مصر العربية، وتختص محاكم القاهرة بالنظر في أي نزاعات تنشأ عن استخدام خدماتنا.
      </p>
    </section>
  </LegalPageLayout>
);

export default LegalContactPage;
