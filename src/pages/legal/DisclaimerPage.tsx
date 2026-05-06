import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';

const DisclaimerPage = () => (
  <LegalPageLayout title="إخلاء المسؤولية" lastUpdated="7 مارس 2026">
    <Helmet>
      <title>إخلاء المسؤولية | العزب للمقاولات</title>
      <meta name="description" content="إخلاء المسؤولية لموقع وخدمات شركة العزب للمقاولات" />
      <link rel="canonical" href="https://alazab.com/disclaimer" />
    </Helmet>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">1. إخلاء المسؤولية العام</h2>
      <p>
        المعلومات المقدمة على موقع العزب للمقاولات (<span dir="ltr">alazab.com</span>) هي لأغراض إعلامية عامة فقط. نبذل قصارى جهدنا لضمان دقة المعلومات وتحديثها، لكننا لا نقدم أي ضمانات أو تعهدات من أي نوع، صريحة أو ضمنية، حول اكتمال أو دقة أو موثوقية أو ملاءمة المعلومات.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">2. المحتوى والأسعار</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>الأسعار والتقديرات المعروضة إرشادية وقابلة للتغيير دون إشعار مسبق.</li>
        <li>صور المشاريع توضيحية وقد تختلف النتائج الفعلية.</li>
        <li>المواصفات التقنية قد تتغير وفقًا للتحديثات وتوفر المواد.</li>
        <li>التقييمات المعروضة تعكس آراء العملاء ولا تمثل ضمانات.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">3. الروابط الخارجية</h2>
      <p>
        قد يحتوي موقعنا على روابط لمواقع خارجية. لا نتحمل مسؤولية محتوى أو ممارسات الخصوصية لأي مواقع أو خدمات تابعة لأطراف ثالثة. ننصحك بقراءة سياسات الخصوصية والشروط لأي موقع تزوره.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">4. التوفر والأداء</h2>
      <ul className="list-disc pr-6 space-y-2">
        <li>لا نضمن توفر الموقع بشكل مستمر أو خالٍ من الأخطاء.</li>
        <li>قد نقوم بصيانة الموقع مما يؤدي إلى توقف مؤقت.</li>
        <li>لا نتحمل مسؤولية فقدان البيانات الناتج عن أعطال فنية خارجة عن إرادتنا.</li>
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">5. الاستشارات</h2>
      <p>
        المحتوى المنشور على الموقع لا يُعد بديلاً عن الاستشارة المهنية المتخصصة. للحصول على مشورة هندسية أو قانونية دقيقة، يرجى التواصل مباشرة مع فريقنا المتخصص.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-bold text-construction-primary mb-4">6. القوة القاهرة</h2>
      <p>
        لا نتحمل مسؤولية التأخير أو عدم الوفاء بالالتزامات الناتج عن ظروف خارجة عن السيطرة المعقولة، بما في ذلك الكوارث الطبيعية، الأوبئة، الحروب، القرارات الحكومية، أو انقطاع خدمات الإنترنت.
      </p>
    </section>
  </LegalPageLayout>
);

export default DisclaimerPage;
