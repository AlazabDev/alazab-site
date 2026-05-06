// Tailwind class presets shared across content pages
export const contentStyles = {
  page: "min-h-screen bg-background text-foreground",
  hero: "relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border",
  heroInner: "container mx-auto px-4 py-16 md:py-24",
  badge:
    "inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary",
  title: "mt-4 text-3xl md:text-5xl font-bold tracking-tight",
  subtitle: "mt-4 max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed",
  container: "container mx-auto px-4 py-10 md:py-16",
  grid: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  card:
    "group relative flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl",
  cardTitle: "text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors",
  cardDesc: "mt-2 text-sm text-muted-foreground line-clamp-3",
  cardMeta: "mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
  tag: "inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground",
  prose:
    "prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h3:text-xl prose-a:text-primary prose-strong:text-foreground prose-blockquote:border-primary prose-li:marker:text-primary",
  searchInput:
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
  backLink:
    "inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors",
  empty: "rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground",
};

export const sectionMeta: Record<
  string,
  { title: string; description: string; emoji: string; color: string }
> = {
  blogs: {
    title: "المدونة",
    description: "مقالات مفصّلة عن نظام التشغيل ومنهجية مجموعة العزب.",
    emoji: "📝",
    color: "from-blue-500/10 to-cyan-500/10",
  },
  knowledge: {
    title: "قاعدة المعرفة",
    description: "طبقات المعرفة الأساسية لفهم منظومة العمل.",
    emoji: "📚",
    color: "from-purple-500/10 to-pink-500/10",
  },
  brands: {
    title: "العلامات التجارية",
    description: "العلامات التجارية الخمس داخل مجموعة العزب.",
    emoji: "🏷️",
    color: "from-amber-500/10 to-orange-500/10",
  },
  guidance: {
    title: "أدلة الاستخدام",
    description: "أدلة عملية لكل مسار طلب أو خدمة.",
    emoji: "🧭",
    color: "from-emerald-500/10 to-teal-500/10",
  },
  faq: {
    title: "الأسئلة الشائعة",
    description: "أكثر من 50 سؤالاً وإجابة عن خدمات وعلامات العزب.",
    emoji: "❓",
    color: "from-rose-500/10 to-red-500/10",
  },
  services: {
    title: "خدمات الصيانة والمقاولات",
    description: "61 خدمة تشغيلية تحت مظلة Alazab / UberFix.",
    emoji: "🔧",
    color: "from-yellow-500/10 to-amber-500/10",
  },
};
