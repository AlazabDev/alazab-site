
import React, { useState, useEffect } from 'react';
import PageLayout from "../components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MapPin, Search, Filter, ArrowLeft, ArrowRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  category?: string;
  image?: string;
  location?: string;
  description?: string;
  created_at: string;
  client_name?: string;
}

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  
  // إحضار المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }
        
        if (data) {
          setProjects(data);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  // استخلاص الفئات المتاحة من المشاريع
  const categories = React.useMemo(() => {
    const uniqueCategories = new Set<string>();
    projects.forEach(project => {
      if (project.category) {
        uniqueCategories.add(project.category);
      }
    });
    return ['all', ...Array.from(uniqueCategories)];
  }, [projects]);
  
  // تصفية المشاريع حسب مصطلح البحث والفئة المحددة
  const filteredProjects = React.useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = 
        project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [projects, searchTerm, selectedCategory]);

  // حساب المشاريع المعروضة حسب الصفحة الحالية
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProjects, currentPage]);

  // إعادة تعيين الصفحة عند تغيير البحث أو الفئة
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  return (
    <PageLayout title="مشاريعنا">
      <div className="mb-8 text-center">
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          استعرض أحدث المشاريع التي نفذتها شركة العزب للمقاولات في مختلف المجالات بأعلى معايير الجودة والاحترافية
        </p>
      </div>
      
      {/* قسم البطل */}
      <div className="relative bg-gradient-to-br from-construction-primary via-construction-dark to-construction-accent text-white py-16 mb-12 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">مشاريعنا المتميزة</h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            نفخر بتقديم مشاريع استثنائية تجمع بين الإبداع والجودة العالية في جميع أنحاء المملكة
          </p>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* أدوات البحث والتصفية */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl mb-8 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute top-1/2 transform -translate-y-1/2 right-3 text-construction-primary" size={18} />
            <Input 
              placeholder="ابحث عن مشروع..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 border-construction-primary/20 focus:border-construction-primary focus:ring-construction-primary/20"
            />
          </div>
          
          <div className="w-full md:w-1/4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-construction-primary/20 focus:border-construction-primary focus:ring-construction-primary/20">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.filter(c => c !== 'all').map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 mr-auto">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? "bg-construction-primary hover:bg-construction-dark" : "border-construction-primary/20 text-construction-primary hover:bg-construction-primary hover:text-white"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? "bg-construction-primary hover:bg-construction-dark" : "border-construction-primary/20 text-construction-primary hover:bg-construction-primary hover:text-white"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>
      </div>
      
      {/* عرض المشاريع */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-construction-primary"></div>
          <p className="mt-4 text-gray-600">جاري تحميل المشاريع...</p>
        </div>
      ) : paginatedProjects.length > 0 ? (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "flex flex-col gap-4"
        }>
          {paginatedProjects.map((project) => (
            viewMode === 'grid' ? (
              <Link to={`/projects/${project.id}`} key={project.id}>
                <div className="project-card group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    <img 
                      src={project.image || '/placeholder.svg'} 
                      alt={project.name} 
                      className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent"></div>
                    
                    {/* شارة الفئة */}
                    {project.category && (
                      <div className="absolute top-4 left-4 bg-construction-accent/90 backdrop-blur-sm text-white text-xs font-medium py-2 px-3 rounded-full border border-white/20">
                        {project.category}
                      </div>
                    )}
                    
                    {/* المحتوى */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6">
                      <h3 className="text-white text-xl font-bold mb-3 group-hover:text-construction-accent transition-colors duration-300">
                        {project.name}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3 text-gray-200">
                        <div className="p-1 bg-white/10 rounded-full">
                          <MapPin size={14} />
                        </div>
                        <p className="text-sm font-medium">{project.location}</p>
                      </div>
                      
                      {project.description && (
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="self-start bg-white/15 backdrop-blur-md text-white border-white/30 hover:bg-construction-primary hover:border-construction-primary transition-all duration-300 font-medium"
                      >
                        عرض التفاصيل
                        <ArrowLeft className="mr-2" size={14} />
                      </Button>
                    </div>
                    
                    {/* تأثير الإضاءة */}
                    <div className="absolute inset-0 bg-gradient-to-br from-construction-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </Link>
            ) : (
              <Card key={project.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-gray-200 hover:border-construction-primary/30">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-56 md:h-auto relative overflow-hidden">
                    <img 
                      src={project.image || '/placeholder.svg'} 
                      alt={project.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                    {project.category && (
                      <div className="absolute top-4 left-4 bg-construction-accent text-white text-xs font-medium py-1 px-3 rounded-full">
                        {project.category}
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:w-2/3 flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
                      <h3 className="text-xl font-bold text-construction-primary mb-2 md:mb-0 hover:text-construction-dark transition-colors">
                        {project.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <div className="p-1 bg-construction-primary/10 rounded-full">
                        <MapPin size={14} className="text-construction-primary" />
                      </div>
                      <span className="text-sm font-medium">{project.location}</span>
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 line-clamp-3 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto">
                      <Link to={`/projects/${project.id}`}>
                        <Button size="sm" className="bg-construction-primary hover:bg-construction-dark transition-all duration-300 font-medium">
                          عرض التفاصيل
                          <ArrowLeft className="mr-2" size={14} />
                        </Button>
                      </Link>
                      
                      {project.client_name && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          العميل: {project.client_name}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-1">لم يتم العثور على مشاريع</h3>
          <p className="text-gray-500">
            لم يتم العثور على مشاريع تطابق معايير البحث الخاصة بك. يرجى تعديل البحث أو تصفية المعايير.
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
          >
            عرض جميع المشاريع
          </Button>
        </div>
      )}
      
      {/* التنقل بين الصفحات */}
      {filteredProjects.length > 0 && totalPages > 1 && (
        <div className="flex flex-col items-center gap-4 mt-12">
          <div className="flex gap-2 flex-wrap justify-center">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="hover:bg-construction-primary hover:text-white"
            >
              <ArrowRight size={16} />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button 
                key={page}
                variant="outline" 
                onClick={() => setCurrentPage(page)}
                className={currentPage === page 
                  ? "bg-construction-primary text-white hover:bg-construction-dark" 
                  : "hover:bg-construction-primary/10"
                }
              >
                {page}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="hover:bg-construction-primary hover:text-white"
            >
              <ArrowLeft size={16} />
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            صفحة {currentPage} من {totalPages} ({filteredProjects.length} مشروع)
          </p>
        </div>
      )}
      
      <div className="mt-16 bg-gradient-to-r from-construction-primary/5 via-construction-accent/5 to-construction-primary/5 p-8 rounded-2xl text-center border border-construction-primary/10">
        <h3 className="text-2xl font-bold text-construction-primary mb-4">هل لديك مشروع تود تنفيذه؟</h3>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-lg leading-relaxed">
          نحن في شركة العزب للمقاولات نقدم خدمات متكاملة في مجال المقاولات والبناء بأعلى معايير الجودة والدقة في جميع أنحاء المملكة العربية السعودية
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/contact">
            <Button className="bg-construction-primary hover:bg-construction-dark text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
              تواصل معنا الآن
            </Button>
          </Link>
          <Link to="/services">
            <Button variant="outline" className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white px-8 py-3 rounded-xl font-medium transition-all duration-300">
              استعرض خدماتنا
            </Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProjectsPage;
