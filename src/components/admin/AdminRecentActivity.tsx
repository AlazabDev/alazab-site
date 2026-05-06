import React from 'react';
import { Calendar, MapPin, Clock, Eye, User, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  status: string;
  location: string;
  created_at: string;
}

interface AdminRecentActivityProps {
  projects: Project[];
  isLoading: boolean;
}

export const AdminRecentActivity: React.FC<AdminRecentActivityProps> = ({ 
  projects, 
  isLoading 
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'var(--azab-success)';
      case 'planning':
        return 'var(--azab-primary)';
      case 'on-hold':
        return 'var(--azab-warning)';
      case 'completed':
        return 'var(--azab-secondary)';
      default:
        return 'var(--azab-dark)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'نشط';
      case 'planning':
        return 'في التخطيط';
      case 'on-hold':
        return 'معلق';
      case 'completed':
        return 'مكتمل';
      default:
        return status || 'غير محدد';
    }
  };

  if (isLoading) {
    return (
      <div className="azab-card">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800">النشاط الأخير</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="azab-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 
            className="text-xl font-bold mb-2"
            style={{ color: 'var(--azab-primary)' }}
          >
            النشاط الأخير
          </h3>
          <p className="text-gray-600 text-sm">
            آخر المشاريع والأنشطة المحدثة
          </p>
        </div>
        <Link
          to="/project-management"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--azab-primary)' }}
        >
          عرض الكل
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <Activity 
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            style={{ color: 'var(--azab-secondary)' }}
          />
          <p className="text-gray-500">لا توجد أنشطة حديثة</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group p-4 rounded-lg border transition-all duration-200 hover:shadow-md hover:border-opacity-60"
              style={{ 
                borderColor: 'var(--azab-border-color)',
                transition: 'var(--azab-transition)'
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(project.status) }}
                  ></div>
                  <h4 className="font-bold text-gray-900 group-hover:text-opacity-80">
                    {project.name}
                  </h4>
                </div>
                <div 
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {getStatusText(project.status)}
                </div>
              </div>

              <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="w-4 h-4" />
                  <span>{project.location}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(project.created_at).toLocaleDateString('ar-SA')}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(project.created_at).toLocaleTimeString('ar-SA', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                  <User className="w-3 h-3" />
                  <span>آخر تحديث منذ {Math.floor(Math.random() * 5) + 1} ساعات</span>
                </div>
                <Link
                  to={`/project-details/${project.id}`}
                  className="flex items-center space-x-1 space-x-reverse text-xs font-medium hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: 'var(--azab-primary)' }}
                >
                  <Eye className="w-3 h-3" />
                  <span>عرض التفاصيل</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};