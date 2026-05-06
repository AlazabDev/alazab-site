import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Clock, PieChart, Check, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageLayout from '../components/layout/PageLayout';
import ProjectForm from '../components/project/ProjectForm';
import ProjectList from '../components/project/ProjectList';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  upcoming: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'جديد' | 'قيد التنفيذ' | 'مكتمل';
  start_date: string;
  end_date: string;
  progress: number;
}

const ProjectManagement: React.FC = () => {
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    completed: 0,
    upcoming: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch project statistics
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        setIsLoading(true);
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, status, progress');
          
        if (error) throw error;
          
        if (projects) {
          const validProjects = projects;
          const stats: ProjectStats = {
            total: validProjects.length,
            active: validProjects.filter(p => p.status === 'قيد التنفيذ').length,
            completed: validProjects.filter(p => p.status === 'مكتمل').length,
            upcoming: validProjects.filter(p => p.status === 'جديد' || !p.status).length
          };
          
          setProjectStats(stats);
        }
      } catch (error) {
        console.error("Error fetching project stats:", error);
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء محاولة جلب إحصائيات المشاريع",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectStats();
  }, [toast]);
  
  const handleProjectAdded = () => {
    setIsAddingProject(false);
    toast({
      title: "تم إضافة المشروع بنجاح",
      description: "تمت إضافة المشروع الجديد وهو متاح الآن في قائمة المشاريع",
      duration: 5000,
    });
    // Refresh stats after adding new project
    setTimeout(() => window.location.reload(), 1000);
  };
  
  return (
    <PageLayout title="إدارة المشاريع">
      {/* Project Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Projects Card */}
        <Card className="bg-white border-l-4 border-l-blue-600">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المشاريع</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h4 className="text-2xl font-bold text-blue-600">{projectStats.total}</h4>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <PieChart size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* Active Projects Card */}
        <Card className="bg-white border-l-4 border-l-yellow-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">قيد التنفيذ</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h4 className="text-2xl font-bold text-yellow-600">{projectStats.active}</h4>
              )}
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* Completed Projects Card */}
        <Card className="bg-white border-l-4 border-l-green-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مشاريع مكتملة</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h4 className="text-2xl font-bold text-green-600">{projectStats.completed}</h4>
              )}
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Check size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Projects Card */}
        <Card className="bg-white border-l-4 border-l-purple-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">مشاريع جديدة</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <h4 className="text-2xl font-bold text-purple-600">{projectStats.upcoming}</h4>
              )}
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <User size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">المشاريع الحالية</h2>
          <p className="text-gray-500">إدارة وتتبع جميع مشاريع الشركة</p>
        </div>
        <div className="flex gap-3">
          <Sheet open={isAddingProject} onOpenChange={setIsAddingProject}>
            <SheetTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="ml-2" size={18} />
                إضافة مشروع جديد
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-[540px] overflow-y-auto">
              <SheetHeader className="text-right">
                <SheetTitle className="text-blue-600 text-2xl">إضافة مشروع جديد</SheetTitle>
                <SheetDescription>
                  أدخل بيانات المشروع الجديد وانقر على حفظ عند الانتهاء
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <ProjectForm onSuccess={handleProjectAdded} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-400" size={18} />
            <Input 
              placeholder="البحث عن مشروع..." 
              className="pl-4 pr-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            تصفية
          </Button>
        </div>
      </div>

      {/* Projects List */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <ProjectList searchTerm={searchTerm} />
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default ProjectManagement;
