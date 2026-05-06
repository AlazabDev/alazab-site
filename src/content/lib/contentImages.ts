// Curated image URLs from Oracle Object Storage, grouped by category.
import raw from "@/assets/safe_urls.txt?raw";

const all = raw
  .split(/\r?\n/)
  .map((l) => l.replace(/^\uFEFF/, "").trim())
  .filter((l) => l.startsWith("http"));

function category(url: string): string {
  const m = url.match(/\/o\/([^/]+)\//);
  return m ? m[1] : "other";
}

export const allImages: string[] = all;

export const imagesByCategory: Record<string, string[]> = all.reduce(
  (acc, url) => {
    const c = category(url);
    (acc[c] ||= []).push(url);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const banners = imagesByCategory.banners ?? [];
export const clientImages = imagesByCategory.clients ?? [];
export const illustrations = imagesByCategory.cuate ?? [];

// Deterministic pick by string (so the same slug always gets the same image)
export function pickImage(seed: string, pool: string[] = banners): string {
  if (!pool.length) return "";
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

export function pickIllustration(seed: string): string {
  return pickImage(seed, illustrations.length ? illustrations : banners);
}
