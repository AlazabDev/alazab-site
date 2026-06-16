import React from 'react';
import { Helmet } from 'react-helmet';
import { AlertTriangle, CheckCircle2, ExternalLink, Globe2, Lock, Mail, Server, ShieldCheck } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';

const primarySettings = [
  {
    title: 'استقبال البريد - IMAP',
    description: 'الإعداد الموصى به لأنه يدعم المجلدات والمزامنة بين أكثر من جهاز.',
    rows: [
      ['Protocol', 'IMAP'],
      ['Server', 'imap.migadu.com'],
      ['Port', '993'],
      ['Security', 'TLS'],
      ['Authentication', 'Password'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
  {
    title: 'إرسال البريد - SMTP',
    description: 'الإعداد الأساسي لإرسال الرسائل من أجهزة الكمبيوتر والهواتف.',
    rows: [
      ['Protocol', 'SMTP'],
      ['Server', 'smtp.migadu.com'],
      ['Port', '465'],
      ['Security', 'TLS'],
      ['Authentication', 'Password'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
  {
    title: 'الوصول عبر المتصفح - Webmail',
    description: 'الدخول المباشر لصندوق البريد بدون إعداد برنامج بريد.',
    rows: [
      ['Address', 'https://webmail.migadu.com'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
  {
    title: 'ManageSieve',
    description: 'خاص بفلاتر البريد المتقدمة. لا يتم استخدامه إلا عند الحاجة وبحذر.',
    rows: [
      ['Protocol', 'ManageSieve'],
      ['Server', 'imap.migadu.com'],
      ['Port', '4190'],
      ['Security', 'StartTLS'],
      ['Authentication', 'Password'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
];

const alternativeSettings = [
  {
    title: 'POP3 Access',
    description: 'بديل قديم لا يدعم المجلدات أو الاستخدام المتزامن من عدة أجهزة. لا تستخدمه إلا لو كان برنامج البريد لا يدعم IMAP.',
    rows: [
      ['Protocol', 'POP3'],
      ['Server', 'pop.migadu.com'],
      ['Port', '995'],
      ['Security', 'TLS'],
      ['Authentication', 'Password'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
  {
    title: 'SMTP / StartTLS',
    description: 'بديل للإرسال عندما لا يقبل برنامج البريد منفذ SMTP/TLS الأساسي 465.',
    rows: [
      ['Protocol', 'SMTP'],
      ['Server', 'smtp.migadu.com'],
      ['Port', '587'],
      ['Security', 'StartTLS'],
      ['Authentication', 'Password'],
      ['Username', 'mailbox@alazab.com'],
      ['Password', '(mailbox password)'],
    ],
  },
];

const setupSteps = [
  'افتح تطبيق البريد على الهاتف أو الكمبيوتر واختر إضافة حساب بريد يدوي/Manual setup.',
  'اكتب البريد الكامل بصيغة mailbox@alazab.com وكلمة مرور صندوق البريد فقط.',
  'استخدم IMAP للاستقبال على imap.migadu.com بمنفذ 993 وتشفير TLS.',
  'استخدم SMTP للإرسال على smtp.migadu.com بمنفذ 465 وتشفير TLS.',
  'أرسل رسالة اختبار ثم تحقق من الاستقبال والرد قبل اعتماد الحساب للعمل.',
];

const SettingCard = ({ section }: { section: { title: string; description: string; rows: string[][] } }) => (
  <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-construction-primary/10 p-2 text-construction-primary">
        <Server className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-construction-primary">{section.title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{section.description}</p>
      </div>
    </div>
    <div className="overflow-hidden rounded-xl border border-border">
      {section.rows.map(([label, value]) => (
        <div key={`${section.title}-${label}`} className="grid grid-cols-1 border-b border-border last:border-b-0 md:grid-cols-[180px_1fr]">
          <div className="bg-muted/50 px-4 py-3 text-sm font-semibold text-muted-foreground">{label}</div>
          <div className="px-4 py-3 font-mono text-sm text-foreground" dir="ltr">{value}</div>
        </div>
      ))}
    </div>
  </section>
);

const MailSetupPage: React.FC = () => {
  return (
    <PageLayout title="تعليمات البريد المؤسسي">
      <Helmet>
        <title>تعليمات البريد المؤسسي | شركة العزب</title>
        <meta
          name="description"
          content="إعدادات بريد شركة العزب عبر Migadu: IMAP وSMTP وWebmail وPOP3 البديل."
        />
      </Helmet>

      <div className="space-y-8" dir="rtl">
        <section className="rounded-3xl bg-gradient-to-br from-construction-primary to-construction-dark p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
                <Mail className="h-4 w-4" />
                بريد alazab.com
              </div>
              <h1 className="text-2xl font-black leading-tight md:text-4xl">إعداد بريد شركة العزب على الأجهزة والويب ميل</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/85 md:text-base">
                استخدم هذه الصفحة كمرجع رسمي لإعداد صناديق البريد بصيغة mailbox@alazab.com. لا يتم عرض أو حفظ كلمات مرور حقيقية هنا؛ كل مستخدم يستعمل كلمة مرور صندوقه فقط.
              </p>
            </div>
            <a href="https://webmail.migadu.com" target="_blank" rel="noopener noreferrer">
              <Button className="bg-construction-accent text-construction-primary hover:bg-construction-accent/90">
                <Globe2 className="ml-2 h-4 w-4" />
                فتح Webmail
                <ExternalLink className="mr-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <ShieldCheck className="mb-3 h-8 w-8 text-construction-primary" />
            <h2 className="font-bold text-construction-primary">الأفضل للاستخدام اليومي</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">IMAP للاستقبال وSMTP/TLS للإرسال حتى تعمل الرسائل والمجلدات على كل الأجهزة.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <Lock className="mb-3 h-8 w-8 text-construction-primary" />
            <h2 className="font-bold text-construction-primary">لا تنشر كلمة المرور</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">استخدم كلمة مرور الصندوق فقط داخل تطبيق البريد ولا ترسلها في محادثات أو مستندات عامة.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <CheckCircle2 className="mb-3 h-8 w-8 text-construction-primary" />
            <h2 className="font-bold text-construction-primary">اختبار بعد الإعداد</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">بعد الإضافة أرسل رسالة اختبار وتأكد من الاستقبال والرد قبل الاعتماد الرسمي.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-construction-primary">خطوات الإعداد السريعة</h2>
          <ol className="space-y-3">
            {setupSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-7 text-muted-foreground">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-construction-primary text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-construction-primary">الإعدادات الأساسية الموصى بها</h2>
            <p className="mt-2 text-sm text-muted-foreground">استخدم هذه البيانات مع Outlook أو Apple Mail أو Gmail أو أي برنامج بريد يدعم الإعداد اليدوي.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {primarySettings.map((section) => (
              <SettingCard key={section.title} section={section} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-bold">تنبيه مهم بخصوص ManageSieve وPOP3</h2>
              <p className="mt-2 text-sm leading-7">
                ManageSieve يكون معطلًا افتراضيًا، وأي سكربت فلترة خاطئ قد يسبب فقدان أو نقل رسائل بشكل غير مقصود. أما POP3 فهو بروتوكول قديم ولا يدعم المجلدات أو تعدد الأجهزة، لذلك لا يظهر ما يتم تحويله إلى Junk عبر POP3.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-construction-primary">بدائل عند عدم دعم الإعداد الأساسي</h2>
            <p className="mt-2 text-sm text-muted-foreground">لا تستخدم البدائل إلا إذا كان تطبيق البريد لا يقبل الإعدادات الأساسية.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {alternativeSettings.map((section) => (
              <SettingCard key={section.title} section={section} />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default MailSetupPage;
