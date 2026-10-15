import React from "react";
import { Helmet } from "react-helmet-async";
import { Check, Copy, ExternalLink, Palette } from "lucide-react";

const palette = [
  { name: "الذهبي الأساسي", token: "--az-gold", hex: "#FFB900", use: "التمييز، الدعوات للإجراء، والعناصر البارزة" },
  { name: "الأزرق الملكي", token: "--az-blue-royal", hex: "#262DAE", use: "اللون الأساسي للروابط والأزرار والعناصر التفاعلية" },
  { name: "الكحلي العميق", token: "--az-navy", hex: "#030957", use: "الخلفيات الداكنة والعناوين ذات الطابع الرسمي" },
  { name: "الأخضر", token: "--az-green", hex: "#008000", use: "حالات النجاح والتأكيد" },
  { name: "الأحمر", token: "--az-red", hex: "#DC2626", use: "الأخطاء والتنبيهات الخطرة" },
  { name: "البني الداكن", token: "--az-brown-950", hex: "#170D02", use: "النصوص الأساسية" },
  { name: "الأبيض", token: "--az-white", hex: "#FFFFFF", use: "الخلفيات النظيفة والمساحات المفتوحة" },
  { name: "الرمادي الفاتح", token: "--az-gray-100", hex: "#E7E7E7", use: "الحدود والفواصل" },
  { name: "الرمادي شديد الفتح", token: "--az-gray-50", hex: "#F8F8F8", use: "خلفيات البطاقات والأقسام الهادئة" },
];

const ThemeGuidePage: React.FC = () => {
  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access may be unavailable in insecure contexts; the value remains visible for manual copying.
    }
  };

  return (
    <>
      <Helmet>
        <title>دليل الثيم والهوية البصرية | العزب</title>
        <meta name="description" content="دليل الثيم الموحد لموقع العزب: لوحة الألوان، متغيرات CSS، قواعد الاستخدام، وطريقة تطبيق الهوية البصرية على صفحات الموقع." />
        <link rel="canonical" href="https://alazab.com/theme" />
        <meta property="og:title" content="دليل الثيم والهوية البصرية | العزب" />
        <meta property="og:description" content="مرجع موحد لألوان وتصميم موقع العزب." />
      </Helmet>

      <main dir="rtl" className="min-h-screen bg-white text-[#170D02]">
        <section className="relative overflow-hidden bg-[#030957] text-white">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -left-16 -top-24 h-72 w-72 rounded-full bg-[#FFB900] blur-3xl" />
            <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full bg-[#262DAE] blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              <Palette size={17} aria-hidden="true" />
              نظام التصميم الموحد
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
              ثيم العزب
              <span className="mt-3 block text-[#FFB900]">هوية واحدة. تجربة متناسقة.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              مرجع الواجهة الموحد الذي يحدد الألوان، والخطوط، والحواف، والظلال، وحالات التفاعل
              المستخدمة لبناء تجربة واضحة ومتسقة عبر صفحات alazab.com.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/theme.css" className="inline-flex items-center gap-2 rounded-lg bg-[#FFB900] px-5 py-3 font-bold text-[#170D02] transition hover:bg-[#E6A600]">
                عرض ملف CSS <ExternalLink size={17} aria-hidden="true" />
              </a>
              <a href="#palette" className="inline-flex items-center rounded-lg border border-white/30 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                استكشف لوحة الألوان
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="max-w-3xl">
            <p className="font-bold text-[#262DAE]">لماذا ثيم موحد؟</p>
            <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">قواعد مشتركة بدلًا من ألوان متفرقة</h2>
            <p className="mt-4 leading-8 text-gray-700">
              يوفّر ملف <code dir="ltr" className="rounded bg-gray-100 px-2 py-1">/theme.css</code> متغيرات CSS مركزية
              يمكن للصفحات والمكونات الرجوع إليها. عند تعديل قيمة اللون أو المسافة أو شكل العنصر في هذا المرجع،
              يصبح توحيد الواجهة أسهل ويقل اختلاف المكونات بين الصفحات.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "ألوان معرّفة", text: "أسماء موحدة للألوان الأساسية والدلالية." },
              { title: "مكونات قابلة لإعادة الاستخدام", text: "أنماط مشتركة للأزرار والبطاقات والروابط." },
              { title: "دعم العربية", text: "خطوط مناسبة للمحتوى العربي واتجاه RTL." },
              { title: "سهولة الصيانة", text: "مكان واضح لتحديث قواعد الهوية مستقبلًا." },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-[#E7E7E7] bg-[#F8F8F8] p-5">
                <Check className="mb-3 text-[#008000]" size={22} aria-hidden="true" />
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 leading-7 text-gray-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="palette" className="bg-[#F8F8F8] py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="max-w-3xl">
              <p className="font-bold text-[#262DAE]">لوحة الهوية</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">الألوان المعتمدة</h2>
              <p className="mt-4 leading-8 text-gray-700">اضغط على أي بطاقة لنسخ كود اللون أو اسم متغير CSS.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {palette.map((color) => (
                <button
                  type="button"
                  key={color.token}
                  onClick={() => copyValue(color.hex)}
                  className="group overflow-hidden rounded-xl border border-[#E7E7E7] bg-white text-right shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#262DAE]/20"
                  aria-label={`نسخ كود ${color.name} ${color.hex}`}
                >
                  <span className="block h-24 w-full border-b border-black/5" style={{ backgroundColor: color.hex }} />
                  <span className="block p-4">
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-bold">{color.name}</span>
                      <Copy size={16} className="text-gray-400 transition group-hover:text-[#262DAE]" aria-hidden="true" />
                    </span>
                    <span dir="ltr" className="mt-2 block text-left font-mono text-sm font-semibold">{color.hex}</span>
                    <span dir="ltr" className="mt-1 block text-left font-mono text-xs text-gray-500">{color.token}</span>
                    <span className="mt-3 block text-sm leading-6 text-gray-600">{color.use}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-bold text-[#262DAE]">قواعد الاستخدام</p>
              <h2 className="mt-2 text-3xl font-extrabold">كيف نطبّق الثيم؟</h2>
              <ul className="mt-5 space-y-4 leading-7 text-gray-700">
                <li><strong className="text-[#170D02]">1. الألوان الدلالية:</strong> استخدم اللون الأساسي للتفاعل، والذهبي للإبراز، والأخضر للنجاح، والأحمر للأخطاء.</li>
                <li><strong className="text-[#170D02]">2. التباين:</strong> تأكد من وضوح النص فوق الخلفية، ولا تستخدم الذهبي الفاتح كنص صغير فوق الأبيض.</li>
                <li><strong className="text-[#170D02]">3. الاتساق:</strong> فضّل متغيرات الثيم على كتابة أكواد الألوان مباشرة داخل المكونات الجديدة.</li>
                <li><strong className="text-[#170D02]">4. الإتاحة:</strong> حافظ على مؤشر تركيز واضح للوحة المفاتيح، واحترم إعدادات تقليل الحركة.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
              <h3 className="text-xl font-extrabold">معاينة للمكونات</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">نماذج توضيحية للألوان الأساسية والدلالية.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-lg bg-[#262DAE] px-4 py-3 font-bold text-white">زر أساسي</span>
                <span className="rounded-lg bg-[#FFB900] px-4 py-3 font-bold text-[#170D02]">زر إبراز</span>
                <span className="rounded-lg bg-[#008000] px-4 py-3 font-bold text-white">نجاح</span>
                <span className="rounded-lg bg-[#DC2626] px-4 py-3 font-bold text-white">تنبيه</span>
              </div>
              <div className="mt-6 rounded-xl border border-[#E7E7E7] bg-[#F8F8F8] p-4">
                <p className="font-bold text-[#262DAE]">بطاقة محتوى</p>
                <p className="mt-1 text-sm leading-6 text-gray-700">خلفية هادئة، حدود واضحة، ونص مقروء مع تمييز العناصر المهمة.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#030957] px-5 py-12 text-center text-white">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold sm:text-3xl">ملف واحد كنقطة مرجعية</h2>
            <p className="mt-3 leading-7 text-white/75">
              ملف الثيم متاح للقراءة من الموقع، ويمكن استخدامه في الصفحات التي تحتاج إلى مشاركة متغيرات الهوية.
              إضافة الملف لا تعيد تلقائيًا تصميم كل مكونات الموقع القديمة؛ يجب نقل الأنماط تدريجيًا إلى المتغيرات المشتركة.
            </p>
            <a href="/theme.css" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#FFB900] px-5 py-3 font-bold text-[#170D02] hover:bg-[#E6A600]">
              فتح theme.css <ExternalLink size={17} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </>
  );
};

export default ThemeGuidePage;
