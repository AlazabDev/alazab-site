import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Calendar,
  Tag,
  Clock,
  ListTree,
  X,
  Share2,
  Check,
} from "lucide-react";
import { contentStyles as s, sectionMeta } from "./contentStyles";
import { getSection, getItem, type ContentSection } from "./contentLoader";
import { pickImage, banners, illustrations } from "./contentImages";

interface SectionProps {
  section: ContentSection;
}

/* ---------- Reading progress bar ---------- */
function ReadingProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setW(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 inset-x-0 z-50 h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-150"
        style={{ width: `${w}%` }}
      />
    </div>
  );
}

/* ---------- Lightbox ---------- */
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        onClick={onClose}
        aria-label="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ---------- Copy button helper ---------- */
function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
      {copied ? "تم النسخ" : "مشاركة"}
    </button>
  );
}

/* ---------- Section listing ---------- */
export function ContentSectionPage({ section }: SectionProps) {
  const meta = sectionMeta[section];
  const items = useMemo(() => getSection(section), [section]);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => i.meta.category && set.add(String(i.meta.category)));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (activeCat && String(i.meta.category) !== activeCat) return false;
      if (!q) return true;
      const blob = `${i.meta.title} ${i.meta.description ?? ""} ${(i.meta.tags ?? []).join(" ")} ${
        i.meta.category ?? ""
      } ${i.meta.english_name ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, query, activeCat]);

  const heroImg = pickImage(section, banners);
  const pageTitle = `${meta.title} | مجموعة العزب`;

  return (
    <div className={s.page}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={`https://alazab.com/${section}`} />
      </Helmet>
      <Header />

      <section className={s.hero}>
        <div className={s.heroBg} />
        {heroImg && (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-luminosity"
            loading="eager"
          />
        )}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#FFB900 1px, transparent 1px), linear-gradient(90deg, #FFB900 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className={s.heroInner}>
          <span className={s.badge}>
            <span aria-hidden>{meta.emoji}</span> {meta.title}
          </span>
          <h1 className={s.title}>{meta.title}</h1>
          <p className={s.subtitle}>{meta.description}</p>

          <div className="mt-10 max-w-2xl relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0f1b3d]/60 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المحتوى..."
              className={`${s.searchInput} pr-12`}
              dir="rtl"
            />
          </div>

          {categories.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveCat("")}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border-2 transition ${
                  !activeCat
                    ? "bg-[#FFB900] text-[#0f1b3d] border-[#FFB900]"
                    : "bg-transparent text-[#f5f0e0]/80 border-[#f5f0e0]/20 hover:border-[#FFB900] hover:text-[#FFB900]"
                }`}
              >
                الكل · {items.length}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCat(c === activeCat ? "" : c)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border-2 transition ${
                    activeCat === c
                      ? "bg-[#FFB900] text-[#0f1b3d] border-[#FFB900]"
                      : "bg-transparent text-[#f5f0e0]/80 border-[#f5f0e0]/20 hover:border-[#FFB900] hover:text-[#FFB900]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <p className="mt-4 text-xs text-[#f5f0e0]/60 font-medium">
            عرض {filtered.length} من {items.length} عنصراً
          </p>
        </div>
      </section>

      <main className={s.container}>
        {filtered.length === 0 ? (
          <div className={s.empty}>لا توجد نتائج مطابقة لبحثك.</div>
        ) : (
          <div className={s.grid}>
            {filtered.map((item, idx) => {
              const img =
                (item.meta.cover as string | undefined) ||
                pickImage(item.meta.slug, banners);
              return (
                <Link
                  key={item.meta.slug}
                  to={`/${section}/${item.meta.slug}`}
                  className={s.card}
                >
                  <div className={s.cardImage}>
                    {img && (
                      <img
                        src={img}
                        alt={item.meta.title}
                        loading="lazy"
                        className={s.cardImageInner}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1b3d]/90 via-[#0f1b3d]/20 to-transparent" />
                    <span className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#FFB900] text-[#0f1b3d] text-xs font-black shadow-lg">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {item.meta.category && (
                      <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-[#FFB900]/95 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#0f1b3d]">
                        {String(item.meta.category)}
                      </span>
                    )}
                  </div>
                  <div className={s.cardBody}>
                    <h2 className={s.cardTitle}>{item.meta.title}</h2>
                    {item.meta.description && (
                      <p className={s.cardDesc}>{item.meta.description}</p>
                    )}
                    <div className={s.cardMeta}>
                      {item.meta.brandName && (
                        <span className="inline-flex items-center gap-1.5">
                          <Tag className="w-3 h-3" /> {item.meta.brandName}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {item.readingTimeMin} د قراءة
                      </span>
                      <span className="ms-auto inline-flex items-center gap-1 text-[#0f1b3d] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        اقرأ <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ---------- Article page ---------- */
export function ContentArticlePage({ section }: SectionProps) {
  const { slug = "" } = useParams();
  const meta = sectionMeta[section];
  const item = useMemo(() => getItem(section, slug), [section, slug]);
  const all = useMemo(() => getSection(section), [section]);
  const articleRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");

  // Wire copy buttons + image lightbox + scroll-spy
  useEffect(() => {
    if (!item || !articleRef.current) return;
    const root = articleRef.current;

    // Copy code buttons
    root.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const code = btn.parentElement?.querySelector("code");
        if (!code) return;
        await navigator.clipboard.writeText(code.textContent || "");
        const original = btn.textContent;
        btn.textContent = "تم النسخ ✓";
        setTimeout(() => (btn.textContent = original || "نسخ"), 1500);
      });
    });

    // Image click → lightbox
    root.querySelectorAll<HTMLImageElement>("img.content-img").forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => setLightbox(img.src));
    });

    // Scroll-spy for TOC
    const heads = root.querySelectorAll<HTMLElement>("h2[id], h3[id]");
    if (!heads.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    heads.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [item]);

  if (!item) {
    return (
      <div className={s.page}>
        <Header />
        <main className={s.container}>
          <div className={s.empty}>
            لم يتم العثور على هذا العنصر.{" "}
            <Link to={`/${section}`} className="text-primary underline">
              العودة إلى {meta.title}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const idx = all.findIndex((i) => i.meta.slug === slug);
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
  const heroImg =
    (item.meta.cover as string | undefined) || pickImage(slug, banners);
  const sideIllustration = pickImage(slug + "-side", illustrations);

  return (
    <div className={s.page}>
      <Helmet>
        <title>{`${item.meta.title} | ${meta.title}`}</title>
        <meta
          name="description"
          content={item.meta.description ?? meta.description}
        />
        <link rel="canonical" href={`https://alazab.com/${section}/${slug}`} />
        <meta property="og:title" content={item.meta.title} />
        <meta
          property="og:description"
          content={item.meta.description ?? meta.description}
        />
        {heroImg && <meta property="og:image" content={heroImg} />}
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.meta.title,
            description: item.meta.description,
            image: heroImg,
            datePublished: item.meta.updatedAt,
            author: {
              "@type": "Organization",
              name: item.meta.author || "Alazab Construction Company",
            },
          })}
        </script>
      </Helmet>
      <ReadingProgress />
      <Header />

      <section className={s.hero}>
        {heroImg && (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            loading="eager"
          />
        )}
        <div className={`${s.heroBg} bg-gradient-to-br ${meta.color}`} />
        <div className={s.heroInner}>
          <Link to={`/${section}`} className={s.backLink}>
            <ArrowRight className="w-4 h-4" /> {meta.title}
          </Link>
          <h1 className={`${s.title} mt-4`}>{item.meta.title}</h1>
          {item.meta.description && (
            <p className={s.subtitle}>{item.meta.description}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
            {item.meta.category && (
              <span className={s.tag}>{String(item.meta.category)}</span>
            )}
            {item.meta.brandName && (
              <span className={s.tag}>{String(item.meta.brandName)}</span>
            )}
            {item.meta.priority && (
              <span className={s.tag}>أولوية: {String(item.meta.priority)}</span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> {item.readingTimeMin} دقيقة قراءة
            </span>
            {item.meta.updatedAt && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {String(item.meta.updatedAt).slice(0, 10)}
              </span>
            )}
            <ShareButton title={item.meta.title} />
          </div>
        </div>
      </section>

      <main className={s.container}>
        <div className="grid gap-10 lg:grid-cols-[1fr_260px]">
          <article
            ref={articleRef}
            className={s.prose}
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: item.html }}
          />

          {/* Sidebar TOC */}
          {item.headings.length > 0 && (
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                  <ListTree className="w-4 h-4 text-primary" /> فهرس المحتوى
                </div>
                <ul className="space-y-1.5 text-sm">
                  {item.headings.map((h) => (
                    <li
                      key={h.id}
                      className={h.level === 3 ? "pr-3" : ""}
                    >
                      <a
                        href={`#${h.id}`}
                        className={`block rounded-md px-2 py-1 transition ${
                          activeId === h.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-primary hover:bg-muted"
                        }`}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              {sideIllustration && (
                <img
                  src={sideIllustration}
                  alt=""
                  loading="lazy"
                  className="rounded-2xl border border-border w-full"
                />
              )}
            </aside>
          )}
        </div>

        <nav className="mt-12 grid gap-4 sm:grid-cols-2">
          {prev && (
            <Link
              to={`/${section}/${prev.meta.slug}`}
              className="rounded-xl border border-border p-4 hover:border-primary hover:shadow-lg transition"
            >
              <div className="text-xs text-muted-foreground">السابق</div>
              <div className="mt-1 font-semibold">{prev.meta.title}</div>
            </Link>
          )}
          {next && (
            <Link
              to={`/${section}/${next.meta.slug}`}
              className="rounded-xl border border-border p-4 text-left sm:text-right hover:border-primary hover:shadow-lg transition sm:col-start-2"
            >
              <div className="text-xs text-muted-foreground">التالي</div>
              <div className="mt-1 font-semibold">{next.meta.title}</div>
            </Link>
          )}
        </nav>
      </main>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <Footer />
    </div>
  );
}

