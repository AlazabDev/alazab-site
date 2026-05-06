import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, LayoutGrid, Search, X, ZoomIn, ChevronLeft, ChevronRight, Filter, Heart } from 'lucide-react';
import { furnitureImages, furnitureCategories, FurnitureImage } from '@/data/furnitureData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const THUMB = 'w_600,q_auto,f_auto';
const FULL = 'w_1400,q_auto,f_auto';

const optimizeUrl = (url: string, transform: string) => {
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transform}/`);
  }
  return url;
};

const FurnitureGallery: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<FurnitureImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(30);

  const filteredImages = useMemo(() => {
    let images = selectedCategory === 'all'
      ? furnitureImages
      : furnitureImages.filter(img => img.folder === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      images = images.filter(img =>
        img.name.toLowerCase().includes(q) || img.folderName.toLowerCase().includes(q)
      );
    }
    return images;
  }, [selectedCategory, searchQuery]);

  const visibleImages = useMemo(() =>
    filteredImages.slice(0, visibleCount),
    [filteredImages, visibleCount]
  );

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 30, filteredImages.length));
  }, [filteredImages.length]);

  const currentImageIndex = selectedImage
    ? filteredImages.findIndex(img => img.id === selectedImage.id) : -1;

  const navigateImage = useCallback((direction: 'prev' | 'next') => {
    if (currentImageIndex === -1) return;
    const newIndex = direction === 'prev'
      ? (currentImageIndex - 1 + filteredImages.length) % filteredImages.length
      : (currentImageIndex + 1) % filteredImages.length;
    setSelectedImage(filteredImages[newIndex]);
  }, [currentImageIndex, filteredImages]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const s = new Set(prev);
      if (s.has(id)) { s.delete(id); } else { s.add(id); }
      return s;
    });
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'ArrowLeft') navigateImage('next');
      if (e.key === 'ArrowRight') navigateImage('prev');
      if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, currentImageIndex, navigateImage]);

  const activeCategories = furnitureCategories.filter(c => c.count > 0 || c.id === 'all');

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-construction-primary via-construction-dark to-construction-primary text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,191,36,0.15)_0%,transparent_60%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4 bg-construction-accent/20 text-construction-accent border-construction-accent/30 text-sm">
              +{furnitureImages.length} قطعة
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">معرض الأثاث والتصميم</h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
              مجموعة حصرية من أرقى قطع الأثاث والتصاميم الداخلية والمدافئ الفاخرة
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 max-w-3xl"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {activeCategories.slice(0, 4).map((cat, i) => (
              <div key={i} className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => { setSelectedCategory(cat.id); setVisibleCount(30); }}>
                <div className="text-2xl font-bold text-construction-accent">{cat.count}</div>
                <div className="text-xs text-white/50">{cat.name}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-md shadow-sm border-b">
        <div className="container mx-auto px-4 py-2 md:py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="text" placeholder="بحث في المعرض..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 pl-8 py-5 rounded-lg" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{filteredImages.length} صورة</span>
                <div className="flex gap-1 bg-muted p-1 rounded-md">
                  <Button variant={viewMode === 'masonry' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('masonry')}>
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
                    <Grid className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'bg-construction-accent text-construction-primary border-construction-accent' : ''}>
                  <Filter className="w-4 h-4 ml-1" /> تصفية
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <ScrollArea className="w-full">
                    <div className="flex gap-2 pb-2 flex-wrap">
                      {activeCategories.map(cat => (
                        <Button key={cat.id}
                          variant={selectedCategory === cat.id ? 'default' : 'outline'} size="sm"
                          onClick={() => { setSelectedCategory(cat.id); setVisibleCount(30); }}
                          className={`whitespace-nowrap rounded-full text-xs ${selectedCategory === cat.id ? 'bg-construction-accent hover:bg-construction-accent/90 text-construction-primary' : ''}`}>
                          {cat.name}
                          <Badge variant="secondary" className="mr-1 text-[10px] px-1.5">{cat.count}</Badge>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <section className="container mx-auto px-4 py-8">
        {filteredImages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-muted-foreground text-xl mb-4">لا توجد نتائج</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} variant="outline">إعادة تعيين</Button>
          </div>
        ) : (
          <>
            <motion.div
              className={viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                : 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3'}
              initial="hidden" animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } }}>
              {visibleImages.map(image => (
                <motion.div key={image.id}
                  variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                  className={`group relative overflow-hidden rounded-lg bg-muted cursor-pointer hover:shadow-xl transition-shadow duration-300 ${viewMode === 'masonry' ? 'mb-3 break-inside-avoid' : ''}`}
                  onClick={() => setSelectedImage(image)}>
                  <div className={viewMode === 'grid' ? 'aspect-square' : ''}>
                    {!loadedImages.has(image.id) && <div className="absolute inset-0 bg-muted animate-pulse" />}
                    <img src={optimizeUrl(image.url, THUMB)} alt={image.name} loading="lazy"
                      onLoad={() => setLoadedImages(prev => new Set(prev).add(image.id))}
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${viewMode === 'grid' ? 'h-full' : 'h-auto'} ${loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-1">{image.folderName}</h3>
                    <div className="absolute top-2 left-2">
                      <button onClick={(e) => toggleFavorite(image.id, e)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${favorites.has(image.id) ? 'bg-red-500 text-white' : 'bg-black/30 backdrop-blur-sm text-white hover:bg-black/50'}`}>
                        <Heart className={`w-3.5 h-3.5 ${favorites.has(image.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
                        <ZoomIn className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {visibleCount < filteredImages.length && (
              <div className="text-center mt-10">
                <Button size="lg" onClick={loadMore}
                  className="bg-construction-accent hover:bg-construction-accent/90 text-construction-primary px-10 py-5 text-base rounded-xl">
                  تحميل المزيد ({filteredImages.length - visibleCount} متبقي)
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <img src={optimizeUrl(selectedImage.url, FULL)} alt={selectedImage.name}
                className="max-w-full max-h-full object-contain" />
              <button onClick={() => navigateImage('next')}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="w-6 h-6" />
              </button>
              <button onClick={() => navigateImage('prev')}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-center">
                <p className="font-semibold">{selectedImage.folderName}</p>
                <p className="text-sm text-white/60">{currentImageIndex + 1} / {filteredImages.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FurnitureGallery;
