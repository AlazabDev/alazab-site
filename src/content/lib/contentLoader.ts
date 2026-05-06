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
  cover?: string;
  [k: string]: unknown;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface ContentItem {
  meta: ContentMeta;
  body: string;
  html: string;
  headings: Heading[];
  readingTimeMin: number;
  path: string;
}

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
  const imgs: string[] = [];
  const links: string[] = [];
  let work = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    imgs.push(`<img src="${src}" alt="${alt}" loading="lazy" class="content-img" />`);
    return `\u0000IMG${imgs.length - 1}\u0000`;
  });
  work = work.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    links.push(`<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    return `\u0000LNK${links.length - 1}\u0000`;
  });
  work = escapeHtml(work)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
  work = work.replace(/\u0000IMG(\d+)\u0000/g, (_, n) => imgs[+n]);
  work = work.replace(/\u0000LNK(\d+)\u0000/g, (_, n) => links[+n]);
  return work;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

interface RenderResult {
  html: string;
  headings: Heading[];
}

function renderMarkdown(md: string): RenderResult {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  const headings: Heading[] = [];
  // listStack: array of { type: 'ul'|'ol', indent: number }
  const listStack: { type: "ul" | "ol"; indent: number }[] = [];

  const closeListsTo = (indent: number) => {
    while (listStack.length && listStack[listStack.length - 1].indent >= indent) {
      const top = listStack.pop()!;
      out.push(top.type === "ul" ? "</ul>" : "</ol>");
    }
  };
  const closeAllLists = () => closeListsTo(-1);

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, "");
    const trimmed = line.trim();

    // blank line
    if (!trimmed) {
      closeAllLists();
      i++;
      continue;
    }

    // fenced code ```lang
    const fence = trimmed.match(/^```(\w*)\s*$/);
    if (fence) {
      closeAllLists();
      const lang = fence[1] || "";
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      out.push(
        `<div class="code-block" data-lang="${lang}"><button type="button" class="copy-btn" data-copy>نسخ</button><pre><code class="language-${lang}">${escapeHtml(buf.join("\n"))}</code></pre></div>`,
      );
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      closeAllLists();
      out.push("<hr />");
      i++;
      continue;
    }

    // table: header line, then |---|---| separator, then rows
    if (
      /\|/.test(trimmed) &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      closeAllLists();
      const splitRow = (r: string) =>
        r
          .replace(/^\s*\|/, "")
          .replace(/\|\s*$/, "")
          .split("|")
          .map((c) => c.trim());
      const headerCells = splitRow(trimmed);
      i += 2; // skip separator
      const bodyRows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
        bodyRows.push(splitRow(lines[i].trim()));
        i++;
      }
      out.push('<div class="table-wrap"><table>');
      out.push(
        "<thead><tr>" +
          headerCells.map((c) => `<th>${inline(c)}</th>`).join("") +
          "</tr></thead>",
      );
      out.push("<tbody>");
      for (const row of bodyRows) {
        out.push(
          "<tr>" + row.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>",
        );
      }
      out.push("</tbody></table></div>");
      continue;
    }

    // headings
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeAllLists();
      const level = h[1].length;
      const text = h[2];
      const id = slugify(text);
      if (level >= 2 && level <= 3) headings.push({ id, text, level });
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    // blockquote
    if (trimmed.startsWith("> ")) {
      closeAllLists();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        buf.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // list item (supports nested via leading spaces; 2-space indent = 1 level)
    const listMatch = raw.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const indent = Math.floor(listMatch[1].length / 2);
      const marker = listMatch[2];
      const type: "ul" | "ol" = /\d+\./.test(marker) ? "ol" : "ul";
      closeListsTo(indent);
      const top = listStack[listStack.length - 1];
      if (!top || top.indent < indent) {
        out.push(type === "ul" ? "<ul>" : "<ol>");
        listStack.push({ type, indent });
      } else if (top.type !== type) {
        out.push(top.type === "ul" ? "</ul>" : "</ol>");
        listStack.pop();
        out.push(type === "ul" ? "<ul>" : "<ol>");
        listStack.push({ type, indent });
      }
      out.push(`<li>${inline(listMatch[3])}</li>`);
      i++;
      continue;
    }

    // paragraph (collapse consecutive non-blank lines)
    closeAllLists();
    const para: string[] = [trimmed];
    i++;
    while (i < lines.length) {
      const nxt = lines[i].trim();
      if (
        !nxt ||
        /^#{1,6}\s/.test(nxt) ||
        /^```/.test(nxt) ||
        /^>\s/.test(nxt) ||
        /^([-*+]|\d+\.)\s/.test(nxt) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(nxt) ||
        /\|/.test(nxt)
      )
        break;
      para.push(nxt);
      i++;
    }
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  closeAllLists();
  return { html: out.join("\n"), headings };
}

export function markdownToHtml(md: string): string {
  return renderMarkdown(md).html;
}

function fileSection(path: string): ContentSection | null {
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

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function getSection(section: ContentSection): ContentItem[] {
  if (cache.has(section)) return cache.get(section)!;
  const items: ContentItem[] = [];
  for (const [path, raw] of Object.entries(rawFiles)) {
    if (fileSection(path) !== section) continue;
    const { meta, body } = parseFrontmatter(raw);
    if (meta.published === false) continue;
    if (!meta.slug) {
      const fname = path.split("/").pop() || "";
      meta.slug = fname.replace(/\.md$/, "");
    }
    if (!meta.title || meta.title === "Untitled") {
      const h1 = body.match(/^#\s+(.+)$/m);
      if (h1) meta.title = h1[1].trim();
    }
    if (!meta.description) {
      const firstPara = body
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .find((s) => s && !s.startsWith("#") && !s.startsWith("**"));
      if (firstPara) meta.description = firstPara.replace(/[*_`#>]/g, "").slice(0, 160);
    }
    const { html, headings } = renderMarkdown(body);
    items.push({
      meta,
      body,
      html,
      headings,
      readingTimeMin: readingTime(body),
      path,
    });
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

export function getItem(
  section: ContentSection,
  slug: string,
): ContentItem | null {
  return getSection(section).find((i) => i.meta.slug === slug) || null;
}
