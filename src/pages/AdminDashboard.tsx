import React from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { AdminWelcomeCard } from '@/components/admin/AdminWelcomeCard';
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid';
import { AdminRecentActivity } from '@/components/admin/AdminRecentActivity';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminSystemOverview } from '@/components/admin/AdminSystemOverview';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData();

  return (
    <AdminDashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="azab-card animate-fade-in-up">
            <AdminWelcomeCard userName={user?.email} />
          </div>

          {/* Stats Grid */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <AdminStatsGrid
              totalProjects={data.totalProjects}
              pendingMaintenance={data.pendingMaintenance}
              completedTasks={data.completedTasks}
              activeProjects={data.activeProjects}
              isLoading={isLoading}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Recent Activity */}
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <AdminRecentActivity 
                projects={data.recentProjects}
                isLoading={isLoading}
              />
              <AdminSystemOverview />
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <AdminQuickActions />
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminDashboard;