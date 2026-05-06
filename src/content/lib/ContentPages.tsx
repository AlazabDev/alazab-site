import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, ArrowRight, Search, Calendar, Tag } from "lucide-react";
import { contentStyles as s, sectionMeta } from "./contentStyles";
import { getSection, getItem, type ContentSection } from "./contentLoader";

interface SectionProps {
  section: ContentSection;
}

export function ContentSectionPage({ section }: SectionProps) {
  const meta = sectionMeta[section];
  const items = useMemo(() => getSection(section), [section]);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => {
      const blob = `${i.meta.title} ${i.meta.description ?? ""} ${(i.meta.tags ?? []).join(" ")} ${
        i.meta.category ?? ""
      } ${i.meta.english_name ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [items, query]);

  const pageTitle = `${meta.title} | مجموعة العزب`;

  return (
    <div className={s.page}>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={`https://alazab.com/${section}`} />
      </Helmet>
      <Header />

      <section className={`${s.hero} bg-gradient-to-br ${meta.color}`}>
        <div className={s.heroInner}>
          <span className={s.badge}>
            <span aria-hidden>{meta.emoji}</span> {meta.title}
          </span>
          <h1 className={s.title}>{meta.title}</h1>
          <p className={s.subtitle}>{meta.description}</p>
          <div className="mt-8 max-w-xl relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المحتوى..."
              className={`${s.searchInput} pr-10`}
              dir="rtl"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {filtered.length} من {items.length} عنصراً
          </p>
        </div>
      </section>

      <main className={s.container}>
        {filtered.length === 0 ? (
          <div className={s.empty}>لا توجد نتائج مطابقة لبحثك.</div>
        ) : (
          <div className={s.grid}>
            {filtered.map((item) => (
              <Link
                key={item.meta.slug}
                to={`/${section}/${item.meta.slug}`}
                className={s.card}
              >
                {item.meta.category && (
                  <span className={s.tag}>{item.meta.category}</span>
                )}
                <h2 className={`${s.cardTitle} mt-3`}>{item.meta.title}</h2>
                {item.meta.description && (
                  <p className={s.cardDesc}>{item.meta.description}</p>
                )}
                <div className={s.cardMeta}>
                  {item.meta.brandName && (
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {item.meta.brandName}
                    </span>
                  )}
                  {item.meta.updatedAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {String(item.meta.updatedAt).slice(0, 10)}
                    </span>
                  )}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  اقرأ المزيد <ArrowLeft className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export function ContentArticlePage({ section }: SectionProps) {
  const { slug = "" } = useParams();
  const meta = sectionMeta[section];
  const item = useMemo(() => getItem(section, slug), [section, slug]);
  const all = useMemo(() => getSection(section), [section]);

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

  return (
    <div className={s.page}>
      <Helmet>
        <title>{`${item.meta.title} | ${meta.title}`}</title>
        <meta name="description" content={item.meta.description ?? meta.description} />
        <link rel="canonical" href={`https://alazab.com/${section}/${slug}`} />
        <meta property="og:title" content={item.meta.title} />
        <meta property="og:description" content={item.meta.description ?? meta.description} />
        <meta property="og:type" content="article" />
      </Helmet>
      <Header />

      <section className={`${s.hero} bg-gradient-to-br ${meta.color}`}>
        <div className={s.heroInner}>
          <Link to={`/${section}`} className={s.backLink}>
            <ArrowRight className="w-4 h-4" /> {meta.title}
          </Link>
          <h1 className={`${s.title} mt-4`}>{item.meta.title}</h1>
          {item.meta.description && (
            <p className={s.subtitle}>{item.meta.description}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {item.meta.category && <span className={s.tag}>{item.meta.category}</span>}
            {item.meta.brandName && <span className={s.tag}>{item.meta.brandName}</span>}
            {item.meta.priority && <span className={s.tag}>أولوية: {item.meta.priority}</span>}
            {(item.meta.tags ?? []).map((t) => (
              <span key={t} className={s.tag}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className={s.container}>
        <article
          className={s.prose}
          dir="rtl"
          dangerouslySetInnerHTML={{ __html: item.html }}
        />

        <nav className="mt-12 grid gap-4 sm:grid-cols-2">
          {prev && (
            <Link
              to={`/${section}/${prev.meta.slug}`}
              className="rounded-xl border border-border p-4 hover:border-primary transition"
            >
              <div className="text-xs text-muted-foreground">السابق</div>
              <div className="mt-1 font-semibold">{prev.meta.title}</div>
            </Link>
          )}
          {next && (
            <Link
              to={`/${section}/${next.meta.slug}`}
              className="rounded-xl border border-border p-4 text-left sm:text-right hover:border-primary transition sm:col-start-2"
            >
              <div className="text-xs text-muted-foreground">التالي</div>
              <div className="mt-1 font-semibold">{next.meta.title}</div>
            </Link>
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
