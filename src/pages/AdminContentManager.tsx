import React from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Sparkles, Star } from 'lucide-react';
import ProjectsManager from '@/components/admin/content/ProjectsManager';
import ServicesManager from '@/components/admin/content/ServicesManager';
import ReviewsManager from '@/components/admin/content/ReviewsManager';

const AdminContentManager: React.FC = () => {
  return (
    <AdminDashboardLayout>
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6" dir="rtl">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-construction-primary">
            إدارة المحتوى
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground mt-1">
            المشروعات، الخدمات، الصور، النماذج ثلاثية الأبعاد، وتقييمات العملاء
          </p>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="projects" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Building2 className="w-4 h-4" /> <span className="hidden xs:inline">المشروعات</span><span className="xs:hidden">مشاريع</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" /> الخدمات
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              <Star className="w-4 h-4" /> التقييمات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <ProjectsManager />
          </TabsContent>
          <TabsContent value="services" className="mt-6">
            <ServicesManager />
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <ReviewsManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminContentManager;
