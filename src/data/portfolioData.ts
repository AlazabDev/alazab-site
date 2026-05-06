// Portfolio Gallery Data - Auto-generated from asset directories using Vite glob imports

export interface PortfolioImage {
  id: string;
  src: string;
  title: string;
  category: string;
  description?: string;
  tags?: string[];
  folder: 'projects' | 'img' | 'coll-hote';
}

export interface PortfolioCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  count: number;
}

// ===== Vite glob imports for all assets =====
const projectFiles = import.meta.glob<string>('/src/assets/projects/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const imgFiles = import.meta.glob<string>('/src/assets/img/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
const collHoteFiles = import.meta.glob<string>('/src/assets/coll-hote/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });

// ===== Helper: extract filename from path =====
const getFilename = (path: string) => path.split('/').pop() || '';

// ===== Category detection from filename =====
const detectCategory = (filename: string, folder: string): { category: string; titleAr: string; tags: string[] } => {
  const lower = filename.toLowerCase();
  
  if (folder === 'coll-hote') {
    if (lower.includes('ethanol') || lower.includes('fla')) return { category: 'fireplace-ethanol', titleAr: 'مدفأة إيثانول', tags: ['مدفأة', 'إيثانول'] };
    if (lower.includes('water') || lower.includes('cool_flame') || lower.includes('vapour')) return { category: 'fireplace-water', titleAr: 'مدفأة بخار ماء', tags: ['مدفأة', 'بخار'] };
    if (lower.includes('gas') || lower.includes('galio')) return { category: 'fireplace-gas', titleAr: 'مدفأة غاز', tags: ['مدفأة', 'غاز'] };
    if (lower.includes('electric') || lower.includes('astro')) return { category: 'fireplace-electric', titleAr: 'مدفأة كهربائية', tags: ['مدفأة', 'كهربائية'] };
    if (lower.includes('rock')) return { category: 'fireplace-rock', titleAr: 'مدفأة صخرية', tags: ['مدفأة', 'صخر'] };
    return { category: 'fireplace', titleAr: 'مدفأة', tags: ['مدفأة'] };
  }
  
  if (folder === 'img') {
    if (lower.includes('interior-design') || lower.includes('interior_design')) return { category: 'interior', titleAr: 'تصميم داخلي', tags: ['تصميم داخلي'] };
    if (lower.includes('metal') || lower.includes('aluminum')) return { category: 'industrial', titleAr: 'أعمال معدنية', tags: ['معدني', 'ألمنيوم'] };
    if (lower.includes('ml-')) return { category: 'modern', titleAr: 'تصميم عصري', tags: ['عصري'] };
    if (lower.includes('kitchen') || lower.includes('cucine') || lower.includes('pantry')) return { category: 'kitchen', titleAr: 'مطبخ', tags: ['مطبخ', 'تصميم'] };
    if (lower.includes('bedroom') || lower.includes('bed') || lower.includes('wardrobe') || lower.includes('dresser')) return { category: 'bedroom', titleAr: 'غرفة نوم', tags: ['غرفة نوم'] };
    if (lower.includes('living') || lower.includes('sofa') || lower.includes('armchair')) return { category: 'living', titleAr: 'غرفة معيشة', tags: ['غرفة معيشة'] };
    if (lower.includes('bookcase') || lower.includes('bookshelf') || lower.includes('desk') || lower.includes('office')) return { category: 'office', titleAr: 'مكتب', tags: ['مكتب', 'مكتبة'] };
    if (lower.includes('bathroom') || lower.includes('basin')) return { category: 'bathroom', titleAr: 'حمام', tags: ['حمام'] };
    if (lower.includes('dining') || lower.includes('table') || lower.includes('chair') || lower.includes('stool')) return { category: 'dining', titleAr: 'غرفة طعام', tags: ['طعام', 'أثاث'] };
    if (lower.includes('walk-in') || lower.includes('closet')) return { category: 'wardrobe', titleAr: 'غرفة ملابس', tags: ['ملابس', 'خزانة'] };
    if (lower.includes('rug') || lower.includes('lamp') || lower.includes('mirror') || lower.includes('console')) return { category: 'decor', titleAr: 'ديكور', tags: ['ديكور', 'إكسسوارات'] };
    if (lower.includes('idex') || lower.includes('k162') || lower.includes('k163') || lower.includes('kenyon') || lower.includes('larice') || lower.includes('lm-') || lower.includes('lu84') || lower.includes('jacklyne') || lower.includes('io')) return { category: 'furniture', titleAr: 'أثاث', tags: ['أثاث', 'تصميم'] };
    if (lower.includes('jpg_')) return { category: 'furniture', titleAr: 'أثاث', tags: ['أثاث'] };
    return { category: 'furniture', titleAr: 'أثاث وتصميم', tags: ['أثاث'] };
  }
  
  // projects folder
  if (lower.includes('abuauf')) return { category: 'commercial', titleAr: 'مشروع أبو عوف', tags: ['تجاري', 'تصميم داخلي'] };
  if (lower.includes('mansourh')) return { category: 'residential', titleAr: 'مشروع المنصورة', tags: ['سكني', 'تشطيبات'] };
  if (lower.includes('maintenance')) return { category: 'maintenance', titleAr: 'أعمال صيانة', tags: ['صيانة', 'ترميم'] };
  if (lower.includes('construction')) return { category: 'construction', titleAr: 'أعمال بناء', tags: ['بناء'] };
  if (lower.includes('design')) return { category: 'interior', titleAr: 'تصميم داخلي', tags: ['تصميم'] };
  if (lower.includes('remodeling')) return { category: 'renovation', titleAr: 'تجديد', tags: ['تجديد'] };
  if (lower.includes('repairs')) return { category: 'maintenance', titleAr: 'إصلاحات', tags: ['إصلاح'] };
  if (lower.includes('gallery')) return { category: 'featured', titleAr: 'معرض الأعمال', tags: ['مميز'] };
  if (lower.includes('slide')) return { category: 'featured', titleAr: 'عرض المشروع', tags: ['مميز'] };
  if (lower.includes('architecture')) return { category: 'architecture', titleAr: 'تصميم معماري', tags: ['معماري'] };
  if (lower.includes('engineering')) return { category: 'engineering', titleAr: 'هندسة', tags: ['هندسة'] };
  if (lower.includes('cover') || lower.includes('mumbai')) return { category: 'international', titleAr: 'مشروع دولي', tags: ['دولي'] };
  if (lower.includes('cucine') || lower.includes('valcucine') || lower.includes('chamonix')) return { category: 'kitchen', titleAr: 'مطبخ فاخر', tags: ['مطبخ', 'فاخر'] };
  return { category: 'projects', titleAr: 'مشروع', tags: ['مشروع'] };
};

// ===== Build images from glob results =====
const buildImages = (
  files: Record<string, string>,
  folder: 'projects' | 'img' | 'coll-hote'
): PortfolioImage[] => {
  return Object.entries(files).map(([path, src], index) => {
    const filename = getFilename(path);
    const { category, titleAr, tags } = detectCategory(filename, folder);
    
    return {
      id: `${folder}-${index}`,
      src,
      title: `${titleAr} ${index + 1}`,
      category,
      description: titleAr,
      tags,
      folder,
    };
  });
};

// ===== All images =====
const projectImages = buildImages(projectFiles, 'projects');
const interiorImages = buildImages(imgFiles, 'img');
const fireplaceImages = buildImages(collHoteFiles, 'coll-hote');

export const allPortfolioImages: PortfolioImage[] = [
  ...projectImages,
  ...interiorImages,
  ...fireplaceImages,
];

// ===== Categories =====
export const portfolioCategories: PortfolioCategory[] = [
  { id: 'all', name: 'All', nameAr: 'الكل', icon: '🏗️', count: allPortfolioImages.length },
  { id: 'featured', name: 'Featured', nameAr: 'مميز', icon: '⭐', count: 0 },
  { id: 'commercial', name: 'Commercial', nameAr: 'تجاري', icon: '🏢', count: 0 },
  { id: 'residential', name: 'Residential', nameAr: 'سكني', icon: '🏠', count: 0 },
  { id: 'interior', name: 'Interior', nameAr: 'تصميم داخلي', icon: '🎨', count: 0 },
  { id: 'construction', name: 'Construction', nameAr: 'بناء', icon: '🔨', count: 0 },
  { id: 'renovation', name: 'Renovation', nameAr: 'تجديد', icon: '🔧', count: 0 },
  { id: 'maintenance', name: 'Maintenance', nameAr: 'صيانة', icon: '🛠️', count: 0 },
  { id: 'architecture', name: 'Architecture', nameAr: 'معماري', icon: '📐', count: 0 },
  { id: 'engineering', name: 'Engineering', nameAr: 'هندسة', icon: '⚙️', count: 0 },
  { id: 'kitchen', name: 'Kitchen', nameAr: 'مطابخ', icon: '🍳', count: 0 },
  { id: 'bedroom', name: 'Bedroom', nameAr: 'غرف نوم', icon: '🛏️', count: 0 },
  { id: 'living', name: 'Living Room', nameAr: 'غرف معيشة', icon: '🛋️', count: 0 },
  { id: 'dining', name: 'Dining', nameAr: 'غرف طعام', icon: '🍽️', count: 0 },
  { id: 'bathroom', name: 'Bathroom', nameAr: 'حمامات', icon: '🚿', count: 0 },
  { id: 'office', name: 'Office', nameAr: 'مكاتب', icon: '💼', count: 0 },
  { id: 'wardrobe', name: 'Wardrobe', nameAr: 'غرف ملابس', icon: '👔', count: 0 },
  { id: 'decor', name: 'Decor', nameAr: 'ديكور', icon: '✨', count: 0 },
  { id: 'furniture', name: 'Furniture', nameAr: 'أثاث', icon: '🪑', count: 0 },
  { id: 'modern', name: 'Modern', nameAr: 'عصري', icon: '💎', count: 0 },
  { id: 'industrial', name: 'Industrial', nameAr: 'صناعي', icon: '🏭', count: 0 },
  { id: 'fireplace', name: 'Fireplaces', nameAr: 'مدافئ', icon: '🔥', count: 0 },
  { id: 'fireplace-ethanol', name: 'Ethanol', nameAr: 'مدافئ إيثانول', icon: '🔥', count: 0 },
  { id: 'fireplace-water', name: 'Water Vapor', nameAr: 'مدافئ بخار', icon: '💧', count: 0 },
  { id: 'fireplace-gas', name: 'Gas', nameAr: 'مدافئ غاز', icon: '🔵', count: 0 },
  { id: 'fireplace-electric', name: 'Electric', nameAr: 'مدافئ كهربائية', icon: '⚡', count: 0 },
  { id: 'fireplace-rock', name: 'Rock', nameAr: 'مدافئ صخرية', icon: '🪨', count: 0 },
  { id: 'international', name: 'International', nameAr: 'دولي', icon: '🌍', count: 0 },
  { id: 'projects', name: 'Projects', nameAr: 'مشاريع', icon: '📁', count: 0 },
];

// Update counts
portfolioCategories.forEach(cat => {
  if (cat.id === 'all') return;
  cat.count = allPortfolioImages.filter(img => img.category === cat.id).length;
});

// ===== Exports =====
export const getImagesByCategory = (categoryId: string): PortfolioImage[] => {
  if (categoryId === 'all') return allPortfolioImages;
  return allPortfolioImages.filter(img => img.category === categoryId);
};

export const getImagesByFolder = (folder: string): PortfolioImage[] => {
  return allPortfolioImages.filter(img => img.folder === folder);
};

export const searchImages = (query: string): PortfolioImage[] => {
  const q = query.toLowerCase();
  return allPortfolioImages.filter(img =>
    img.title.toLowerCase().includes(q) ||
    img.description?.toLowerCase().includes(q) ||
    img.tags?.some(t => t.toLowerCase().includes(q))
  );
};

export const getCategoriesWithImages = (): PortfolioCategory[] => {
  return portfolioCategories.filter(cat => cat.count > 0 || cat.id === 'all');
};

// Folder stats
export const folderStats = {
  projects: projectImages.length,
  img: interiorImages.length,
  'coll-hote': fireplaceImages.length,
  total: allPortfolioImages.length,
};
