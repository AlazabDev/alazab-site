// Browser-safe content loader using Vite's import.meta.glob
// Loads .md files as raw strings for all content sections.

export type ContentSection =
  | "blogs"
  | "knowledge"
  | "brands"
  | "guidance"
  | "faq"
  | "services";

export interface ContentMeta {
  title: string;
  slug: string;
  description?: string;
  section?: string;
  brand?: string;
  brandName?: string;
  category?: string;
  language?: string;
  published?: boolean;
  order?: number;
  tags?: string[];
  author?: string;
  updatedAt?: string;
  english_name?: string;
  service_id?: string;
  service_number?: string;
  priority?: string;
  brand_context?: string;
  [k: string]: unknown;
}

export interface ContentItem {
  meta: ContentMeta;
  body: string;
  html: string;
  path: string;
}

// Eagerly load all markdown files at build time
const rawFiles = import.meta.glob("/src/content/**/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function parseScalar(value: string): unknown {
  const t = value.trim();
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t.startsWith("[") && t.endsWith("]")) {
    try {
      return JSON.parse(t.replace(/'/g, '"'));
    } catch {
      return t
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }
  return t.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(raw: string): { meta: ContentMeta; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: { title: "Untitled", slug: "untitled" }, body: raw };
  const meta: Record<string, unknown> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key) continue;
    meta[key] = parseScalar(value);
  }
  return { meta: meta as ContentMeta, body: raw.slice(m[0].length) };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeLists();
      continue;
    }
    if (line.startsWith("### ")) {
      closeLists();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      closeLists();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("# ")) {
      closeLists();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("> ")) {
      closeLists();
      out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`);
      continue;
    }
    if (/^-\s+/.test(line)) {
      if (!inUl) {
        closeLists();
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inline(line.replace(/^-\s+/, ""))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!inOl) {
        closeLists();
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inline(line.replace(/^\d+\.\s+/, ""))}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeLists();
  return out.join("\n");
}

function fileSection(path: string): ContentSection | null {
  // /src/content/<section>/file.md  OR  /src/content/alazab_services_scratch/services/file.md
  if (path.includes("/alazab_services_scratch/services/")) return "services";
  const m = path.match(/\/src\/content\/([^/]+)\//);
  if (!m) return null;
  const s = m[1];
  if (
    s === "blogs" ||
    s === "knowledge" ||
    s === "brands" ||
    s === "guidance" ||
    s === "faq"
  )
    return s;
  return null;
}

const cache = new Map<string, ContentItem[]>();

export function getSection(section: ContentSection): ContentItem[] {
  if (cache.has(section)) return cache.get(section)!;
  const items: ContentItem[] = [];
  for (const [path, raw] of Object.entries(rawFiles)) {
    if (fileSection(path) !== section) continue;
    const { meta, body } = parseFrontmatter(raw);
    if (meta.published === false) continue;
    // ensure slug exists (fallback to filename)
    if (!meta.slug) {
      const fname = path.split("/").pop() || "";
      meta.slug = fname.replace(/\.md$/, "");
    }
    items.push({ meta, body, html: markdownToHtml(body), path });
  }
  items.sort((a, b) => {
    const oa = a.meta.order ?? 9999;
    const ob = b.meta.order ?? 9999;
    if (oa !== ob) return oa - ob;
    return (a.meta.title || "").localeCompare(b.meta.title || "", "ar");
  });
  cache.set(section, items);
  return items;
}

export function getItem(section: ContentSection, slug: string): ContentItem | null {
  return getSection(section).find((i) => i.meta.slug === slug) || null;
}
