import React from 'react';
import { Building2, Wrench, CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface AdminStatsGridProps {
  totalProjects: number;
  pendingMaintenance: number;
  completedTasks: number;
  activeProjects: number;
  isLoading: boolean;
}

export const AdminStatsGrid: React.FC<AdminStatsGridProps> = ({
  totalProjects,
  pendingMaintenance,
  completedTasks,
  activeProjects,
  isLoading
}) => {
  const stats = [
    {
      title: "إجمالي المشاريع",
      value: totalProjects,
      icon: Building2,
      color: "var(--azab-primary)",
      bgColor: "rgba(26, 54, 93, 0.1)",
      change: "+12%",
      changeType: "positive"
    },
    {
      title: "طلبات الصيانة المعلقة",
      value: pendingMaintenance,
      icon: Wrench,
      color: "var(--azab-warning)",
      bgColor: "rgba(245, 158, 11, 0.1)",
      change: "-5%",
      changeType: "negative"
    },
    {
      title: "المهام المكتملة",
      value: completedTasks,
      icon: CheckCircle,
      color: "var(--azab-success)",
      bgColor: "rgba(16, 185, 129, 0.1)",
      change: "+23%",
      changeType: "positive"
    },
    {
      title: "المشاريع النشطة",
      value: activeProjects,
      icon: Clock,
      color: "var(--azab-secondary)",
      bgColor: "rgba(45, 90, 123, 0.1)",
      change: "+8%",
      changeType: "positive"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="azab-card animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="azab-card hover-lift relative overflow-hidden"
          style={{
            transition: 'var(--azab-transition)',
            border: `1px solid ${stat.color}20`
          }}
        >
          {/* Background Icon */}
          <div 
            className="absolute -top-4 -left-4 w-20 h-20 rounded-full flex items-center justify-center opacity-10"
            style={{ backgroundColor: stat.color }}
          >
            <stat.icon className="w-10 h-10" style={{ color: stat.color }} />
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div className={`flex items-center text-sm ${
                stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`w-4 h-4 ml-1 ${
                  stat.changeType === 'negative' ? 'rotate-180' : ''
                }`} />
                {stat.change}
              </div>
            </div>

            {/* Stats */}
            <div className="mb-2">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: stat.color }}
              >
                {stat.value.toLocaleString('ar-SA')}
              </div>
              <div className="text-gray-600 text-sm font-medium">
                {stat.title}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="h-2 rounded-full transition-all duration-1000"
                style={{ 
                  backgroundColor: stat.color,
                  width: `${Math.min((stat.value / Math.max(...stats.map(s => s.value))) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};