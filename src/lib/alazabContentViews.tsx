import Link from 'next/link';
import type { AlazabContentItem, AlazabContentSection } from '../types/alazab-content';

const sectionTitles: Record<AlazabContentSection, string> = {
  blogs: 'مدونة العزب',
  knowledge: 'قاعدة المعرفة',
  brands: 'علامات مجموعة العزب',
  guidance: 'الأدلة العملية',
  faq: 'الأسئلة الشائعة',
};

export function ContentIndexPage({ section, items }: { section: AlazabContentSection; items: AlazabContentItem[] }) {
  return (
    <main dir="rtl" className="alazab-content-page">
      <section className="hero">
        <p className="eyebrow">Alazab Knowledge</p>
        <h1>{sectionTitles[section]}</h1>
        <p>محتوى منظم مستخرج من قاعدة معرفة مجموعة العزب، جاهز للعرض والفهرسة والربط مع الموقع الرئيسي.</p>
      </section>

      <section className="grid">
        {items.map((item) => (
          <Link key={item.meta.slug} href={`/${section}/${item.meta.slug}`} className="card">
            <span>{item.meta.brand || 'enterprise'}</span>
            <h2>{item.meta.title}</h2>
            {item.meta.description ? <p>{item.meta.description}</p> : null}
          </Link>
        ))}
      </section>
      <style jsx>{styles}</style>
    </main>
  );
}

export function ContentArticlePage({ item }: { item: AlazabContentItem }) {
  return (
    <main dir="rtl" className="alazab-content-page">
      <article className="article">
        <p className="eyebrow">{item.meta.section} / {item.meta.brand || 'enterprise'}</p>
        <div dangerouslySetInnerHTML={{ __html: item.html }} />
      </article>
      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.alazab-content-page{max-width:1120px;margin:0 auto;padding:48px 20px;color:#111;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.9}.hero{background:#111;color:#fff;border-radius:28px;padding:42px;margin-bottom:32px}.hero h1{font-size:42px;margin:0 0 12px}.hero p{max-width:760px;color:#e5e5e5}.eyebrow{color:#f5bf23;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.card{display:block;text-decoration:none;color:#111;border:1px solid #eee;border-radius:24px;padding:24px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.06);transition:.2s ease}.card:hover{transform:translateY(-3px);border-color:#f5bf23}.card span{display:inline-block;color:#8a6a00;font-size:13px;font-weight:800;margin-bottom:8px}.card h2{font-size:22px;line-height:1.5;margin:0 0 10px}.card p{color:#555;margin:0}.article{max-width:860px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:28px;padding:42px;box-shadow:0 10px 30px rgba(0,0,0,.06)}.article :global(h1){font-size:38px;line-height:1.4;margin:0 0 22px}.article :global(h2){font-size:26px;margin:34px 0 12px}.article :global(h3){font-size:20px;margin:28px 0 10px}.article :global(p){margin:0 0 14px}.article :global(ul){padding-right:24px}.article :global(blockquote){border-right:4px solid #f5bf23;background:#fff8df;border-radius:12px;margin:18px 0;padding:16px 18px}.article :global(code){background:#f5f5f5;border-radius:6px;padding:2px 6px}
`;
