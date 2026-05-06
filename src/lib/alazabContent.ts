import fs from 'fs';
import path from 'path';
import type { AlazabContentItem, AlazabContentMeta, AlazabContentSection } from '../types/alazab-content';

const CONTENT_ROOT = path.join(process.cwd(), 'src', 'content');

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed.replace(/^"|"$/g, '');
  }
}

export function parseFrontmatter(raw: string): { meta: AlazabContentMeta; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {
      meta: { title: 'Untitled', slug: 'untitled', section: 'knowledge', published: false },
      body: raw,
    };
  }

  const meta: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    meta[key] = parseScalar(value);
  }

  return { meta: meta as AlazabContentMeta, body: raw.slice(match[0].length) };
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdown(input: string): string {
  return escapeHtml(input)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const html: string[] = [];
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push('</ul>');
      listOpen = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('### ')) { closeList(); html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`); continue; }
    if (line.startsWith('## ')) { closeList(); html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('# ')) { closeList(); html.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`); continue; }
    if (line.startsWith('> ')) { closeList(); html.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
    if (line.startsWith('- ')) {
      if (!listOpen) { html.push('<ul>'); listOpen = true; }
      html.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!listOpen) { html.push('<ul>'); listOpen = true; }
      html.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  return html.join('\n');
}

export function getContentItem(section: AlazabContentSection, slug: string): AlazabContentItem | null {
  const filePath = path.join(CONTENT_ROOT, section, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  return { meta, body, html: markdownToHtml(body), filePath };
}

export function getContentList(section: AlazabContentSection, includeUnpublished = false): AlazabContentItem[] {
  const dir = path.join(CONTENT_ROOT, section);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const raw = fs.readFileSync(path.join(dir, name), 'utf8');
      const { meta, body } = parseFrontmatter(raw);
      return { meta, body, html: markdownToHtml(body), filePath: path.join(dir, name) };
    })
    .filter((item) => includeUnpublished || item.meta.published !== false)
    .sort((a, b) => (a.meta.order ?? 9999) - (b.meta.order ?? 9999) || a.meta.title.localeCompare(b.meta.title, 'ar'));
}

export function getStaticSlugs(section: AlazabContentSection): { params: { slug: string } }[] {
  return getContentList(section).map((item) => ({ params: { slug: item.meta.slug } }));
}
