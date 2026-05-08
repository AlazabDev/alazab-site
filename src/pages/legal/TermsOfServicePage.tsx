import React from 'react';
import LegalPageLayout from '@/components/legal/LegalPageLayout';
import { Helmet } from 'react-helmet';
import { ChartLine, Medal, Scale } from 'lucide-react';

const TermsOfServicePage = () => (
  <LegalPageLayout title="الشروط والأحكام — تسجيل الموردين والفنيين" lastUpdated="2025">
    <Helmet>
      <title>UberFix | الشروط والأحكام — تسجيل الموردين والفنيين</title>
      <meta
        name="description"
        content="الشروط والأحكام العامة وشروط الدفع والعمولات لمنصة UberFix التابعة لمجموعة العزب."
      />
      <link rel="canonical" href="https://azab.services/terms-of-service" />
    </Helmet>

    {/* تمهيد */}
    <section className="bg-amber-50 dark:bg-amber-950/30 border-r-4 border-construction-secondary rounded-2xl p-6 md:p-8 not-prose">
      <h2 className="text-xl font-bold text-construction-primary mb-3">تمهيد</h2>
      <div className="space-y-3 text-foreground/90 leading-relaxed">
        <p>
          تؤمن <strong>UberFix</strong> أن الصيانة ليست مجرد خدمة تُنفذ، بل مسؤولية مهنية وأخلاقية أمام العميل،
          وأمام فريق العمل، وأمام المجتمع.
        </p>
        <p>
          لذلك فإن هذه الشروط والأحكام لا تُكتب لمحاسبة الفني وحده، ولا تُطبق على طرف دون آخر، بل هي إطار عادل
          ومنظم يلتزم به الجميع: الإدارة، فريق التشغيل، خدمة العملاء، الموردون، الفنيون، ومقدمو الخدمات.
        </p>
        <p>
          وتؤكد إدارة UberFix أن الالتزام يبدأ من داخل المؤسسة أولًا؛ فما يُطلب من الفني من احترام وجودة وانضباط
          ووضوح، تلتزم به UberFix قبل غيرها في طريقة إدارتها، تواصلها، تسعيرها، متابعتها، وتسوية الحقوق.
        </p>
        <p>
          <strong>
            الهدف من هذه الشروط ليس التضييق على الفني، بل بناء بيئة عمل محترمة ومنظمة، تساعد الفني الجاد على
            التطور من مجرد منفذ خدمة، إلى مقدم خدمة محترف، ثم إلى صاحب كيان مستقل قادر على النمو والعمل بثقة
            داخل السوق.
          </strong>
        </p>
      </div>
    </section>

    {/* أولاً */}
    <section>
      <h2 className="text-2xl font-bold text-construction-primary mb-4">أولاً: الشروط والأحكام العامة</h2>

      <h3 className="text-lg font-bold mt-6 mb-2">1. التعريفات ونطاق التطبيق</h3>
      <ul className="list-disc pr-6 space-y-2">
        <li>
          يقصد بـ <strong>«المنصة»</strong> منصة UberFix وما يرتبط بها من مواقع إلكترونية أو تطبيقات أو لوحات
          تشغيل أو أنظمة متابعة.
        </li>
        <li>
          يقصد بـ <strong>«مقدم الخدمة»</strong> أو <strong>«الفني»</strong> كل شخص أو جهة تسجل في المنصة
          لتقديم خدمات صيانة أو تركيب أو إصلاح أو معاينة أو توريد مرتبط بأعمال الصيانة والتشغيل.
        </li>
        <li>
          تسري هذه الشروط على جميع مراحل التسجيل، والمراجعة، والتفعيل، واستقبال الطلبات، وتنفيذ الخدمات،
          والتقييم، وتسوية المستحقات داخل منصة UberFix.
        </li>
      </ul>

      <h3 className="text-lg font-bold mt-6 mb-2">2. مبدأ العدالة وتطبيق الشروط على الجميع</h3>
      <p>
        تلتزم UberFix بتطبيق هذه الشروط على جميع الأطراف دون تمييز أو استثناء غير مبرر. أي تقصير من فريق
        التشغيل أو الإدارة أو خدمة العملاء يتم التعامل معه بنفس مبدأ المحاسبة والتحسين الذي يُطبق على مقدم
        الخدمة.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-2">3. طبيعة العلاقة القانونية</h3>
      <p>
        قبول تسجيل مقدم الخدمة في المنصة لا ينشئ علاقة عمل أو توظيف دائم أو تبعية إدارية بين UberFix ومقدم
        الخدمة. مقدم الخدمة يعمل كمورد خدمة مستقل أو مقاول/فني مستقل.
      </p>

      <h3 className="text-lg font-bold mt-6 mb-2">4. الأهلية والمستندات المطلوبة</h3>
      <ul className="list-disc pr-6 space-y-2">
        <li>يشترط أن يكون مقدم الخدمة كامل الأهلية القانونية وألا يقل عمره عن 18 سنة.</li>
        <li>
          يلتزم مقدم الخدمة بإدخال بيانات صحيحة وحديثة، وتشمل على الأقل: الاسم، رقم الهاتف، البريد الإلكتروني،
          العنوان، نوع الخدمة، الخبرة، ووسيلة السداد.
        </li>
        <li>للمنصة الحق في رفض أو تعليق أو إيقاف الحساب إذا ثبت عدم صحة البيانات أو نقص المستندات.</li>
      </ul>

      <h3 className="text-lg font-bold mt-6 mb-2">5. الالتزامات المهنية والسلامة</h3>
      <ul className="list-disc pr-6 space-y-2">
        <li>تنفيذ الأعمال بجودة مهنية ومطابقة لأصول الصناعة.</li>
        <li>الالتزام بالمواعيد، الإبلاغ المبكر عن أي مانع، استخدام مهمات الوقاية الشخصية.</li>
        <li>يحظر تحويل العميل خارج المنصة أو تنفيذ طلبات جانبية دون موافقة إلكترونية.</li>
      </ul>
    </section>

    {/* بطاقة متابعة الفنيين */}
    <section className="not-prose rounded-2xl p-6 md:p-8 bg-gradient-to-br from-construction-primary to-construction-dark text-white">
      <div className="flex items-start gap-3">
        <ChartLine className="w-6 h-6 text-construction-secondary shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold mb-2">
            متابعة الفنيين الجدد وبرنامج التطوير (رؤية العزب)
          </h3>
          <p className="text-white/90 leading-relaxed">
            تقوم UberFix بمتابعة أداء الفنيين الجدد خلال فترة التشغيل الأولى، بهدف التقييم والتوجيه وتحسين
            مستوى الخدمة. وتؤمن شركة العزب أن الفني الجاد لا يجب أن يبقى في نفس المرحلة؛ لذلك قد يتم دعمه
            لاستخراج أوراقه الرسمية على نفقة العزب.
          </p>
        </div>
      </div>
    </section>

    {/* جدول التقييم */}
    <section className="not-prose">
      <div className="overflow-x-auto rounded-2xl border shadow-sm">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-construction-primary text-white">
              <th className="p-3 font-bold">عناصر تقييم الفني الجديد</th>
              <th className="p-3 font-bold">آلية المتابعة</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            <tr className="border-t"><td className="p-3">الالتزام بالمواعيد</td><td className="p-3">تسجيل وقت الوصول عبر المنصة</td></tr>
            <tr className="border-t"><td className="p-3">جودة التنفيذ</td><td className="p-3">تقرير العميل وصور قبل وبعد</td></tr>
            <tr className="border-t"><td className="p-3">التعامل مع العميل</td><td className="p-3">تقييم ما بعد الخدمة</td></tr>
            <tr className="border-t"><td className="p-3">نظافة العمل والمحافظة على الموقع</td><td className="p-3">مراجعة فريق الجودة</td></tr>
            <tr className="border-t"><td className="p-3">سرعة الاستجابة وغياب الشكاوى</td><td className="p-3">نظام تصنيف آلي</td></tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border-r-4 border-construction-secondary p-5 flex items-start gap-3">
        <Medal className="w-5 h-5 text-construction-secondary shrink-0 mt-1" />
        <p>
          <strong>دعم العزب للمتميزين:</strong> قد يشمل الدعم المساعدة في استخراج سجل تجاري، بطاقة ضريبية، فتح
          ملف تأميني، وتأهيل الفني للتعامل كمورد خدمة رسمي.
        </p>
      </div>
    </section>

    <section>
      <h3 className="text-lg font-bold mt-6 mb-2">6. مواد وقطع الغيار والضمان</h3>
      <p>
        يتحمل مقدم الخدمة مسؤولية العيوب الناتجة عن سوء التنفيذ أو الإهمال، ويلتزم بإصلاح العيب خلال مدة
        معقولة. كما يلتزم بالحفاظ على سرية بيانات العملاء وعدم مشاركتها.
      </p>
    </section>

    {/* ثانياً */}
    <section>
      <h2 className="text-2xl font-bold text-construction-primary mb-4">ثانيًا: شروط الدفع والعمولات</h2>

      <h3 className="text-lg font-bold mt-6 mb-2">1. نظام العمولة واستحقاق المقابل</h3>
      <ul className="list-disc pr-6 space-y-2">
        <li>تحصل المنصة على عمولة من كل طلب منجز وتختلف نسبتها حسب نوع الخدمة والمستوى.</li>
        <li>لا يصبح مقابل الخدمة مستحقًا للسحب إلا بعد إتمام الطلب واعتماده من العميل أو فريق التشغيل.</li>
        <li>
          الحد الأدنى لطلب السحب هو <strong>300 جنيه مصري</strong>، وتتم المعالجة خلال 24-48 ساعة عمل.
        </li>
      </ul>

      <div className="overflow-x-auto rounded-2xl border shadow-sm not-prose mt-4">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-construction-primary text-white">
              <th className="p-3 font-bold">نوع الإجراء</th>
              <th className="p-3 font-bold">التفاصيل</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            <tr className="border-t"><td className="p-3">الخصومات والتسويات</td><td className="p-3">يتم خصم قيمة العمولة، رسوم التحويل، أو التعويضات المعتمدة بسبب خطأ مثبت.</td></tr>
            <tr className="border-t"><td className="p-3">الإلغاء وعدم الحضور</td><td className="p-3">الإلغاء المتكرر بعد قبول الطلب قد يؤدي إلى خصم تشغيلي أو خفض الأولوية.</td></tr>
            <tr className="border-t"><td className="p-3">النزاعات المالية</td><td className="p-3">أي اعتراض مالي يجب تقديمه خلال مدة معقولة مع رقم الطلب وسبب الاعتراض.</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-bold mt-6 mb-2">2. الضرائب والفواتير</h3>
      <p>
        يتحمل مقدم الخدمة مسؤولية موقفه الضريبي والتأميني. للمنصة الحق في طلب بيانات ضريبية عند وصول حجم
        التعاملات لحدود قانونية تستدعي ذلك.
      </p>
    </section>

    {/* الإقرار النهائي */}
    <section className="bg-sky-50 dark:bg-sky-950/30 border-r-4 border-construction-secondary rounded-2xl p-6 md:p-8 not-prose">
      <h3 className="text-lg font-bold text-construction-primary mb-3">الإقرار النهائي</h3>
      <p className="mb-3">
        أقر بأنني قرأت الشروط والأحكام العامة وشروط الدفع والعمولات وفهمت مضمونها، وأوافق على الالتزام بها عند
        التسجيل واستخدام منصة UberFix.
      </p>
      <p>
        كما أقر بأنني أفهم أن هذه الشروط ليست موجهة ضدي، بل وُضعت لتنظيم العلاقة بين جميع الأطراف بعدالة
        واحترام، وأن الالتزام بها هو الطريق للحصول على فرص أكبر داخل المنصة، وقد يكون بداية لتحولي من فني منفذ
        إلى مقدم خدمة معتمد، ثم إلى صاحب كيان مهني مستقل بدعم من العزب وفقًا للجدية والانضباط وجودة الأداء.
      </p>
    </section>

    <div className="not-prose flex items-center justify-center gap-2 text-sm text-muted-foreground border-t pt-6">
      <Scale className="w-4 h-4" />
      <span>تخضع هذه الشروط للقانون المصري، وتختص المحاكم المصرية المختصة بنظر النزاعات.</span>
    </div>
  </LegalPageLayout>
);

export default TermsOfServicePage;
