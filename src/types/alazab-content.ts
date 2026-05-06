export type AlazabContentSection = 'blogs' | 'knowledge' | 'brands' | 'guidance' | 'faq';

export type AlazabContentMeta = {
  title: string;
  slug: string;
  description?: string;
  section: AlazabContentSection;
  brand?: string;
  brandName?: string;
  brandNameEn?: string;
  category?: string;
  route?: string;
  intent?: string;
  language?: string;
  published?: boolean;
  source?: string;
  updatedAt?: string;
  order?: number;
  tags?: string[];
  author?: string;
};

export type AlazabContentItem = {
  meta: AlazabContentMeta;
  body: string;
  html: string;
  filePath: string;
};
