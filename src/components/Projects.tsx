
import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

const projectCategories = [
  "جميع المشاريع",
  "المباني السكنية",
  "المباني التجارية",
  "الفلل الخاصة",
  "المجمعات السكنية"
];

const projects = [
  {
    id: 1,
    title: "برج الأمير السكني",
    category: "المباني السكنية",
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2670&auto=format&fit=crop",
    location: "الرياض، المملكة العربية السعودية",
    year: "2023",
    client: "شركة الأمير للاستثمار العقاري",
    featured: true
  },
  {
    id: 2,
    title: "مجمع التميز التجاري",
    category: "المباني التجارية",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop",
    location: "جدة، المملكة العربية السعودية",
    year: "2022",
    client: "مجموعة التميز"
  },
  {
    id: 3,
    title: "فيلا الواحة الخضراء",
    category: "الفلل الخاصة",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2675&auto=format&fit=crop",
    location: "الدمام، المملكة العربية السعودية",
    year: "2024",
    client: "عائلة السعيد"
  },
  {
    id: 4,
    title: "مجمع النخيل السكني",
    category: "المجمعات السكنية",
    image: "https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?q=80&w=2605&auto=format&fit=crop",
    location: "الخبر، المملكة العربية السعودية",
    year: "2023",
    client: "شركة النخيل للعقارات",
    featured: true
  },
  {
    id: 5,
    title: "برج المستقبل",
    category: "المباني التجارية",
    image: "https://images.unsplash.com/photo-1693314212095-3659d9ca30c9?q=80&w=2574&auto=format&fit=crop",
    location: "مكة، المملكة العربية السعودية",
    year: "2021",
    client: "هيئة تطوير مكة المكرمة"
  },
  {
    id: 6,
    title: "مجمع الأندلس",
    category: "المجمعات السكنية",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2573&auto=format&fit=crop",
    location: "المدينة المنورة، المملكة العربية السعودية",
    year: "2022",
    client: "شركة إعمار"
  }
];

const Projects: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("جميع المشاريع");
  const [searchTerm, setSearchTerm] = useState("");

  // استخدام useMemo لتحسين الأداء
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesCategory = activeCategory === "جميع المشاريع" || project.category === activeCategory;
      const matchesSearch = project.title.includes(searchTerm) || 
                            project.location.includes(searchTerm) || 
                            project.category.includes(searchTerm);
      return matchesCategory && (searchTerm === "" || matchesSearch);
    });
  }, [activeCategory, searchTerm]);


  return (
    <section id="projects" className="section bg-white">
      <div className="container mx-auto">
        <h2 className="section-title">مشاريعنا</h2>
        <p className="section-subtitle">تصفح أحدث وأهم مشاريعنا المنفذة</p>
        
        {/* بحث وتصفية */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8">
            {/* البحث */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن مشروع..." 
                className="w-full py-3 pr-10 pl-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-construction-primary focus:border-construction-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="بحث في المشاريع"
              />
            </div>
            
            {/* أزرار التصفية */}
            <div className="w-full lg:flex-1 lg:mr-6">
              <Tabs 
                defaultValue="جميع المشاريع" 
                value={activeCategory}
                onValueChange={setActiveCategory}
                className="w-full"
              >
                <TabsList className="bg-gray-100 p-1 flex flex-wrap justify-center lg:justify-end w-full">
                  {projectCategories.map((category) => (
                    <TabsTrigger 
                      key={category}
                      value={category}
                      className="px-4 py-2 text-sm whitespace-nowrap data-[state=active]:bg-construction-primary data-[state=active]:text-white transition-all hover:bg-construction-primary/10"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* مشاريع مميزة */}
        {!searchTerm && activeCategory === "جميع المشاريع" && (
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-construction-primary flex items-center gap-2">
              <span className="w-1 h-8 bg-construction-accent rounded-full"></span>
              مشاريع مميزة
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projects
                .filter(project => project.featured)
                .map(project => (
                  <article key={`featured-${project.id}`} className="group relative overflow-hidden rounded-xl shadow-lg transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10"></div>
                    <LazyImage 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-[450px] object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
                      <div className="bg-construction-accent/90 backdrop-blur-sm text-white text-xs py-2 px-4 rounded-full absolute top-6 right-6 font-medium">
                        {project.category}
                      </div>
                      <h3 className="text-3xl font-bold mb-3">{project.title}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin size={18} aria-hidden="true" />
                        <span className="text-lg">{project.location}</span>
                      </div>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">سنة: {project.year}</span>
                        <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">العميل: {project.client}</span>
                      </div>
                      <Link 
                        to={`/projects-gallery/${project.id}`} 
                        className="flex items-center gap-2 bg-white text-construction-primary font-bold py-3 px-6 rounded-lg transition-all hover:bg-construction-accent hover:text-white self-start group-hover:scale-105"
                        aria-label={`عرض تفاصيل مشروع ${project.title}`}
                      >
                        تفاصيل المشروع
                        <ArrowLeft size={18} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        )}
        
        {/* عرض المشاريع */}
        <div className="mt-8">
          {filteredProjects.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-construction-primary">
                  {searchTerm ? `نتائج البحث عن: "${searchTerm}"` : 
                   activeCategory === "جميع المشاريع" ? "جميع المشاريع" : activeCategory}
                </h3>
                <span className="text-gray-500 text-sm" aria-live="polite">
                  {filteredProjects.length} مشروع
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" role="list">
                {filteredProjects.map((project) => (
                  <article 
                    key={project.id} 
                    className="project-card group relative overflow-hidden rounded-xl shadow-md transition-all duration-500 hover:shadow-xl"
                    role="listitem"
                  >
                    <Link 
                      to={`/projects-gallery/${project.id}`}
                      aria-label={`عرض تفاصيل مشروع ${project.title}`}
                    >
                      <LazyImage 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                        <h3 className="text-white text-xl font-bold mb-2 group-hover:text-construction-accent transition-colors">{project.title}</h3>
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                          <MapPin size={16} aria-hidden="true" />
                          <p className="text-sm">{project.location}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="bg-construction-accent text-white text-xs py-1 px-3 rounded-full font-medium">
                            {project.category}
                          </div>
                          <span className="text-white/80 text-xs">{project.year}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl" role="alert">
              <div className="text-gray-500 mb-4">
                <Search size={60} className="mx-auto mb-6 text-gray-400" aria-hidden="true" />
                <p className="text-xl font-medium">لم يتم العثور على مشاريع مطابقة</p>
              </div>
              <p className="text-gray-400 text-lg mb-6">
                حاول استخدام كلمات بحث مختلفة أو تصفية أخرى
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm("");
                  setActiveCategory("جميع المشاريع");
                }}
                variant="outline"
                className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white"
              >
                إعادة تعيين البحث
              </Button>
            </div>
          )}
        </div>
        
        {filteredProjects.length > 0 && (
          <div className="text-center mt-16">
            <Link to="/projects-gallery">
              <Button className="bg-construction-primary hover:bg-construction-dark text-white py-3 px-8 text-lg">
                عرض جميع المشاريع
                <ArrowLeft className="mr-2" size={18} aria-hidden="true" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default Projects;
