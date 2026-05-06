
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";

interface Project {
  id: string;
  name: string;
  status: string;
  location: string;
  created_at: string;
}

interface MaintenanceRequest {
  id: string;
  status: string;
}

interface DashboardData {
  totalProjects: number;
  pendingMaintenance: number;
  completedTasks: number;
  activeProjects: number;
  recentProjects: Project[];
}

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>({
    totalProjects: 0,
    pendingMaintenance: 0,
    completedTasks: 0,
    activeProjects: 0,
    recentProjects: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // جلب بيانات المشاريع
        const projectsQuery = await supabase
          .from('projects')
          .select('id, name, status, location, created_at');

        if (projectsQuery.error) throw projectsQuery.error;

        // جلب بيانات طلبات الصيانة
        const maintenanceQuery = await supabase
          .from('maintenance_requests')
          .select('id, status');

        if (maintenanceQuery.error) throw maintenanceQuery.error;

        const projects = (projectsQuery.data || []) as Project[];
        const maintenance = (maintenanceQuery.data as MaintenanceRequest[]) || [];

        // حساب الإحصائيات
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'active').length;
        const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
        const completedTasks = maintenance.filter(m => m.status === 'completed').length;

        // آخر المشاريع (أحدث 5 مشاريع)
        const recentProjects = projects
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);

        setData({
          totalProjects,
          pendingMaintenance,
          completedTasks,
          activeProjects,
          recentProjects
        });

        console.log('تم تحميل بيانات لوحة التحكم بنجاح');
      } catch (error) {
        console.error('خطأ في جلب بيانات لوحة التحكم:', error);
        toast({
          title: "خطأ في تحميل البيانات",
          description: "سيتم استخدام البيانات الافتراضية",
          variant: "destructive",
        });

        // بيانات افتراضية في حالة الخطأ
        setData({
          totalProjects: 12,
          pendingMaintenance: 8,
          completedTasks: 45,
          activeProjects: 6,
          recentProjects: [
            {
              id: '1',
              name: 'مشروع تطوير المكاتب الإدارية',
              status: 'active',
              location: 'الرياض',
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              name: 'صيانة مبنى سكني',
              status: 'planning',
              location: 'جدة',
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { data, isLoading };
};
