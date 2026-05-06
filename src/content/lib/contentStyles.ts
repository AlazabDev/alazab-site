/* ==========================================================================
   Alazab Content — Visual System
   Palette: Navy #0f1b3d  •  Amber #FFB900  •  Cream #f5f0e0
   Editorial layout, dramatic gradients, restrained motion.
   ========================================================================== */

export const contentStyles = {
  page: "min-h-screen bg-background text-foreground antialiased",

  /* ------- HERO ------- */
  hero:
    "relative overflow-hidden isolate border-b border-accent/20 " +
    "bg-[#0f1b3d] text-[#f5f0e0]",
  heroBg:
    "absolute inset-0 -z-10 " +
    "bg-[radial-gradient(ellipse_at_top_right,_hsl(43_100%_50%/0.25),_transparent_55%)," +
    "radial-gradient(ellipse_at_bottom_left,_hsl(213_52%_25%/0.6),_transparent_60%)]",
  heroInner:
    "container mx-auto px-4 py-20 md:py-28 relative",
  badge:
    "inline-flex items-center gap-2 rounded-full border border-[#FFB900]/40 " +
    "bg-[#FFB900]/10 backdrop-blur px-4 py-1.5 text-xs font-semibold " +
    "uppercase tracking-[0.18em] text-[#FFB900]",
  title:
    "mt-6 text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] " +
    "bg-gradient-to-br from-white via-[#f5f0e0] to-[#FFB900] bg-clip-text text-transparent",
  subtitle:
    "mt-6 max-w-3xl text-base md:text-xl text-[#f5f0e0]/75 leading-relaxed",

  /* ------- LIST PAGE ------- */
  container: "container mx-auto px-4 py-14 md:py-20",
  grid: "grid gap-7 sm:grid-cols-2 lg:grid-cols-3",
  card:
    "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 " +
    "bg-card shadow-sm transition-all duration-300 " +
    "hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-[#0f1b3d]/15 hover:border-[#FFB900]/50",
  cardImage:
    "relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-[#0f1b3d] to-[#1e3a5f]",
  cardImageInner:
    "w-full h-full object-cover transition-transform duration-700 group-hover:scale-110",
  cardBody: "flex-1 p-6 flex flex-col",
  cardTitle:
    "text-lg md:text-xl font-bold text-foreground leading-snug " +
    "group-hover:text-[#0f1b3d] transition-colors",
  cardDesc: "mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed",
  cardMeta:
    "mt-4 pt-4 border-t border-border/60 flex flex-wrap items-center gap-3 " +
    "text-[11px] uppercase tracking-wider text-muted-foreground",
  tag:
    "inline-flex items-center rounded-full bg-[#0f1b3d] text-[#FFB900] " +
    "px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",

  /* ------- ARTICLE ------- */
  prose: "alazab-prose max-w-none",
  searchInput:
    "w-full rounded-full border-2 border-[#FFB900]/30 bg-white/95 text-[#0f1b3d] " +
    "placeholder:text-[#0f1b3d]/50 backdrop-blur px-5 py-3.5 text-sm shadow-xl " +
    "focus:border-[#FFB900] focus:outline-none focus:ring-4 focus:ring-[#FFB900]/20",
  backLink:
    "inline-flex items-center gap-2 text-sm font-semibold text-[#FFB900] " +
    "hover:text-white transition-colors",
  empty:
    "rounded-2xl border-2 border-dashed border-border p-16 text-center text-muted-foreground",
};

export const sectionMeta: Record<
  string,
  { title: string; description: string; emoji: string; color: string }
> = {
  blogs: {
    title: "المدونة",
    description: "مقالات تحليلية عن نظام تشغيل مجموعة العزب ومنهجية التسليم.",
    emoji: "📝",
    color: "from-[#0f1b3d] to-[#1e3a5f]",
  },
  knowledge: {
    title: "قاعدة المعرفة",
    description: "طبقات المعرفة التشغيلية لفهم منظومة العمل من الداخل.",
    emoji: "📚",
    color: "from-[#1e3a5f] to-[#0f1b3d]",
  },
  brands: {
    title: "العلامات التجارية",
    description: "خمس علامات داخل مجموعة العزب — هوية مستقلة وجودة موحّدة.",
    emoji: "🏷️",
    color: "from-[#FFB900] to-[#0f1b3d]",
  },
  guidance: {
    title: "أدلة الاستخدام",
    description: "أدلة عملية خطوة بخطوة لكل مسار طلب أو خدمة.",
    emoji: "🧭",
    color: "from-[#0f1b3d] to-[#FFB900]/80",
  },
  faq: {
    title: "الأسئلة الشائعة",
    description: "أكثر من 50 سؤالاً وإجابة عن خدمات وعلامات مجموعة العزب.",
    emoji: "❓",
    color: "from-[#1e3a5f] to-[#FFB900]/80",
  },
  services: {
    title: "خدمات الصيانة والمقاولات",
    description: "61 خدمة تشغيلية تحت مظلة Alazab / UberFix — تنفيذ احترافي في مصر.",
    emoji: "🔧",
    color: "from-[#0f1b3d] via-[#1e3a5f] to-[#FFB900]",
  },
};
