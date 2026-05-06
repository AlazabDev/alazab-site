import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, LayoutGrid, Search, X, ZoomIn, ChevronLeft, ChevronRight,
  Filter, Heart, Image, Box, Layers
} from 'lucide-react';
import { 
  allPortfolioImages, portfolioCategories, getImagesByCategory,
  searchImages, getCategoriesWithImages, folderStats,
  PortfolioImage 
} from '@/data/portfolioData';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProjectViewer3D from '@/components/project/ProjectViewer3D';

const CLOUDINARY_CLOUD = 'dn4ne1ep1';

const Portfolio: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<PortfolioImage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('masonry');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(30);
  const [activeTab, setActiveTab] = useState('images');

  // 3D Models - sample URLs (can be managed via admin)
  const [models3D] = useState([
    { id: '3d-1', title: 'نموذج مشروع المنصورة', embedUrl: '' },
    { id: '3d-2', title: 'نموذج مشروع أبو عوف', embedUrl: '' },
  ]);

  const filteredImages = useMemo(() => {
    let images = selectedCategory === 'all' 
      ? allPortfolioImages 
      : getImagesByCategory(selectedCategory);
    if (searchQuery) {
      const results = searchImages(searchQuery);
      images = images.filter(img => results.some(r => r.id === img.id));
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

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set(prev).add(id));
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

  const activeCategories = getCategoriesWithImages();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-construction-primary via-construction-dark to-construction-primary text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,191,36,0.15)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4 bg-construction-accent/20 text-construction-accent border-construction-accent/30 text-sm">
              +{folderStats.total} عمل
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              معرض الأعمال
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed">
              مجموعة شاملة من أعمالنا في البناء والتصميم الداخلي والمدافئ الفاخرة
            </p>
          </motion.div>
          
          {/* Folder Stats */}
          <motion.div 
            className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-10 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {[
              { label: 'المشاريع', value: folderStats.projects, icon: '🏗️' },
              { label: 'التصاميم والأثاث', value: folderStats.img, icon: '🎨' },
              { label: 'المدافئ', value: folderStats['coll-hote'], icon: '🔥' },
              { label: 'الإجمالي', value: folderStats.total, icon: '📊' },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-2xl font-bold text-construction-accent">{s.value}</div>
                <div className="text-xs text-white/50">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-md shadow-sm border-b">
          <div className="container mx-auto px-4">
            <TabsList className="w-full justify-start gap-2 bg-transparent h-12 md:h-14 p-0">
              <TabsTrigger 
                value="images" 
                className="data-[state=active]:bg-construction-accent data-[state=active]:text-construction-primary gap-1.5 text-sm md:text-base px-3 md:px-6 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-construction-accent min-h-[44px]"
              >
                <Image className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">معرض</span> الصور
                <Badge variant="secondary" className="mr-1 text-[10px] md:text-xs px-1.5">{folderStats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="3d"
                className="data-[state=active]:bg-construction-accent data-[state=active]:text-construction-primary gap-1.5 text-sm md:text-base px-3 md:px-6 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-construction-accent min-h-[44px]"
              >
                <Box className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">العرض</span> 3D
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* ===== IMAGES TAB ===== */}
        <TabsContent value="images" className="mt-0">
          {/* Filters */}
          <div className="sticky top-[7rem] md:top-[8.5rem] z-30 bg-background/95 backdrop-blur-md border-b">
            <div className="container mx-auto px-4 py-2 md:py-3">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="بحث في المعرض..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 pl-8 py-5 rounded-lg"
                    />
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
                      <Filter className="w-4 h-4 ml-1" />
                      تصفية
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
                              variant={selectedCategory === cat.id ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => { setSelectedCategory(cat.id); setVisibleCount(30); }}
                              className={`whitespace-nowrap rounded-full text-xs ${
                                selectedCategory === cat.id 
                                  ? 'bg-construction-accent hover:bg-construction-accent/90 text-construction-primary' 
                                  : ''
                              }`}
                            >
                              <span className="ml-1">{cat.icon}</span>
                              {cat.nameAr}
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

          {/* Gallery Grid */}
          <section className="container mx-auto px-4 py-8">
            {filteredImages.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-muted-foreground text-xl mb-4">لا توجد نتائج</p>
                <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} variant="outline">
                  إعادة تعيين
                </Button>
              </div>
            ) : (
              <>
                <motion.div
                  className={viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                    : 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3'
                  }
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
                >
                  {visibleImages.map(image => (
                    <motion.div
                      key={image.id}
                      variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
                      className={`group relative overflow-hidden rounded-lg bg-muted cursor-pointer hover:shadow-xl transition-shadow duration-300 ${viewMode === 'masonry' ? 'mb-3 break-inside-avoid' : ''}`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className={viewMode === 'grid' ? 'aspect-square' : ''}>
                        {!loadedImages.has(image.id) && (
                          <div className="absolute inset-0 bg-muted animate-pulse" />
                        )}
                        <img
                          src={image.src}
                          alt={image.title}
                          loading="lazy"
                          onLoad={() => handleImageLoad(image.id)}
                          className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            viewMode === 'grid' ? 'h-full' : 'h-auto'
                          } ${loadedImages.has(image.id) ? 'opacity-100' : 'opacity-0'}`}
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                        <h3 className="text-white font-semibold text-sm line-clamp-1">{image.title}</h3>
                        {image.tags && (
                          <div className="flex gap-1 mt-1">
                            {image.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <button onClick={(e) => toggleFavorite(image.id, e)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              favorites.has(image.id) ? 'bg-red-500 text-white' : 'bg-black/30 backdrop-blur-sm text-white hover:bg-black/50'
                            }`}>
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
        </TabsContent>

        {/* ===== 3D TAB ===== */}
        <TabsContent value="3d" className="mt-0">
          <section className="container mx-auto px-4 py-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-construction-accent/10 text-construction-accent px-4 py-2 rounded-full mb-4">
                <Box className="w-5 h-5" />
                <span className="font-semibold">العرض التفاعلي ثلاثي الأبعاد</span>
              </div>
              <p className="text-muted-foreground max-w-xl mx-auto">
                استعرض مشاريعنا بتقنية العرض ثلاثي الأبعاد التفاعلي - قم بالتدوير والتكبير لاستكشاف كل التفاصيل
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {models3D.map(model => (
                <motion.div key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden border bg-card shadow-sm"
                >
                  <div className="p-4 border-b bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-construction-accent" />
                      <h3 className="font-bold text-lg">{model.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <ProjectViewer3D embedUrl={model.embedUrl} />
                  </div>
                </motion.div>
              ))}
            </div>

            {models3D.every(m => !m.embedUrl) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center mt-8 p-8 border-2 border-dashed rounded-2xl bg-muted/30"
              >
                <Box className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">قريباً - نماذج ثلاثية الأبعاد</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  سيتم إضافة نماذج تفاعلية ثلاثية الأبعاد لمشاريعنا قريباً. يمكنك إضافة روابط النماذج من لوحة التحكم.
                </p>
              </motion.div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-7xl w-[98vw] h-[95vh] p-0 bg-black/98 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <X className="w-5 h-5 text-white" />
            </button>

            <button onClick={() => navigateImage('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
            <button onClick={() => navigateImage('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <AnimatePresence mode="wait">
              {selectedImage && (
                <motion.div key={selectedImage.id} className="relative max-w-full max-h-full p-6"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}>
                  <img src={selectedImage.src} alt={selectedImage.title}
                    className="max-w-full max-h-[82vh] object-contain rounded-lg" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold text-xl text-right">{selectedImage.title}</h3>
                        {selectedImage.tags && (
                          <div className="flex gap-2 mt-2">
                            {selectedImage.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="bg-white/20 text-white border-none text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={(e) => toggleFavorite(selectedImage.id, e)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          favorites.has(selectedImage.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white'
                        }`}>
                        <Heart className={`w-5 h-5 ${favorites.has(selectedImage.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                    <p className="text-white/40 text-sm text-right mt-2">{currentImageIndex + 1} / {filteredImages.length}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-construction-primary via-construction-dark to-construction-primary text-white text-center relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">هل أعجبك ما رأيت؟</h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
              تواصل معنا للحصول على استشارة مجانية وتصميم مخصص
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-construction-accent hover:bg-construction-accent/90 text-construction-primary px-8 py-5 text-base rounded-xl">
                  تواصل معنا
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-5 text-base rounded-xl">
                  خدماتنا
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Portfolio;
