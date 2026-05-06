// src/components/project/ProjectList.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Eye, FileUp, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import ProjectForm from './ProjectForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  name: string;
  client_name?: string;
  category?: string;
  image?: string;
  location?: string;
  description?: string;
  created_at: string;
  status?: string;
  progress?: number;
  model3d_url?: string;
}

interface ProjectListProps {
  searchTerm?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ searchTerm = '' }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditingOpen, setIsEditingOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        variant: "destructive",
        title: "خطأ في جلب المشاريع",
        description: "حدث خطأ أثناء محاولة استرداد بيانات المشاريع",
      });
    } finally {
      setLoading(false);
    }
  };

  // تصفية المشاريع بناءً على مصطلح البحث
  const filteredProjects = useMemo(() => {
    const searchTermToUse = searchTerm || internalSearchTerm;
    if (!searchTermToUse) return projects;

    return projects.filter(project => 
      project.name.toLowerCase().includes(searchTermToUse.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchTermToUse.toLowerCase())) ||
      (project.client_name && project.client_name.toLowerCase().includes(searchTermToUse.toLowerCase())) ||
      (project.location && project.location.toLowerCase().includes(searchTermToUse.toLowerCase()))
    );
  }, [projects, searchTerm, internalSearchTerm]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsEditingOpen(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      toast({
        title: "تم حذف المشروع",
        description: "تم حذف المشروع بنجاح",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        variant: "destructive",
        title: "خطأ في حذف المشروع",
        description: "حدث خطأ أثناء محاولة حذف المشروع",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch(status) {
      case 'جديد': return 'bg-blue-500';
      case 'قيد التنفيذ': return 'bg-yellow-500';
      case 'مكتمل': return 'bg-green-500';
      case 'متوقف': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleEditSuccess = () => {
    setIsEditingOpen(false);
    fetchProjects();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg shadow-lg border border-gray-200 bg-white overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        لا توجد مشاريع حالياً. أضف مشروعاً جديداً باستخدام الزر أعلاه.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شريط البحث الداخلي (يظهر فقط إذا لم يتم تمرير searchTerm من الأب) */}
      {!searchTerm && (
        <div className="relative w-full max-w-md">
          <Search className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" size={18} />
          <Input 
            placeholder="ابحث عن مشروع..." 
            className="pl-4 pr-10" 
            value={internalSearchTerm}
            onChange={(e) => setInternalSearchTerm(e.target.value)}
          />
        </div>
      )}

      {filteredProjects.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          لا توجد نتائج مطابقة للبحث
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id} 
              className="group relative overflow-hidden rounded-lg shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-shadow duration-300"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={project.image || '/placeholder.svg'} 
                  alt={project.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-construction-primary">{project.name}</h3>
                  <span className={`text-white text-xs py-1 px-2 rounded ${getStatusBadgeColor(project.status)}`}>
                    {project.status || 'جديد'}
                  </span>
                </div>
                
                {project.client_name && (
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">العميل:</span> {project.client_name}
                  </p>
                )}
                
                {project.location && (
                  <p className="text-gray-600 text-sm mb-2 flex items-center">
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {project.location}
                  </p>
                )}
                
                {project.description && (
                  <p className="text-gray-700 text-sm line-clamp-2 mb-2">{project.description}</p>
                )}
                
                {(project.progress !== undefined && project.progress > 0) && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>نسبة الإنجاز</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Link to={`/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye size={16} className="ml-1" /> عرض
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(project)}
                  >
                    <Edit size={16} className="ml-1" /> تعديل
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmDelete(project)}
                  >
                    <Trash size={16} className="ml-1" /> حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet for editing project */}
      <Sheet open={isEditingOpen} onOpenChange={setIsEditingOpen}>
        <SheetContent side="left" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader className="text-right">
            <SheetTitle className="text-construction-primary text-2xl">تعديل المشروع</SheetTitle>
            <SheetDescription>
              قم بتعديل بيانات المشروع وانقر على حفظ عند الانتهاء
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {editingProject && (
              <ProjectForm 
                initialData={editingProject} 
                isEditing={true} 
                onSuccess={handleEditSuccess}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من رغبتك في حذف هذا المشروع؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المشروع "{projectToDelete?.name}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectList;
