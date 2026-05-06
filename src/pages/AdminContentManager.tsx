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
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-construction-primary">
              إدارة المحتوى
            </h1>
            <p className="text-muted-foreground mt-1">
              إدارة المشروعات، الخدمات، الصور، النماذج ثلاثية الأبعاد، وتقييمات العملاء
            </p>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="projects" className="gap-2">
              <Building2 className="w-4 h-4" /> المشروعات
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Sparkles className="w-4 h-4" /> الخدمات
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
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
