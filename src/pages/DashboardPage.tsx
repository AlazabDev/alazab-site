import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WelcomeCard from '@/components/dashboard/WelcomeCard';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentProjects from '@/components/dashboard/RecentProjects';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <WelcomeCard userName={user?.email} />
        
        <DashboardStats
          totalProjects={data.totalProjects}
          pendingMaintenance={data.pendingMaintenance}
          completedTasks={data.completedTasks}
          activeProjects={data.activeProjects}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentProjects 
            projects={data.recentProjects}
            isLoading={isLoading}
          />
          
          <div className="space-y-6">
            {/* يمكن إضافة مكونات أخرى هنا مستقبلاً */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
