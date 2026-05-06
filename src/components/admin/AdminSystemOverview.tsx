import React from 'react';
import { 
  Server, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Shield,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

const systemMetrics = [
  {
    name: 'وحدة المعالجة المركزية',
    value: '45%',
    status: 'normal',
    icon: Cpu,
    color: 'var(--azab-success)'
  },
  {
    name: 'الذاكرة',
    value: '68%',
    status: 'warning',
    icon: Server,
    color: 'var(--azab-warning)'
  },
  {
    name: 'التخزين',
    value: '32%',
    status: 'normal',
    icon: HardDrive,
    color: 'var(--azab-success)'
  },
  {
    name: 'قاعدة البيانات',
    value: '89%',
    status: 'critical',
    icon: Database,
    color: 'var(--azab-error)'
  }
];

const systemStatus = [
  {
    service: 'خادم الويب',
    status: 'active',
    uptime: '99.9%',
    lastCheck: 'منذ دقيقتين'
  },
  {
    service: 'قاعدة البيانات',
    status: 'active',
    uptime: '99.8%',
    lastCheck: 'منذ دقيقة واحدة'
  },
  {
    service: 'خدمة الملفات',
    status: 'warning',
    uptime: '98.5%',
    lastCheck: 'منذ 5 دقائق'
  },
  {
    service: 'النسخ الاحتياطي',
    status: 'active',
    uptime: '100%',
    lastCheck: 'منذ ساعة'
  }
];

export const AdminSystemOverview: React.FC = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'var(--azab-success)';
      case 'warning':
        return 'var(--azab-warning)';
      case 'critical':
        return 'var(--azab-error)';
      default:
        return 'var(--azab-secondary)';
    }
  };

  return (
    <div className="azab-card">
      <div className="mb-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--azab-primary)' }}
        >
          نظرة عامة على النظام
        </h3>
        <p className="text-gray-600 text-sm">
          حالة الخوادم والموارد النظام
        </p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {systemMetrics.map((metric, index) => (
          <div 
            key={index}
            className="p-4 rounded-lg border text-center"
            style={{ 
              borderColor: 'var(--azab-border-color)',
              backgroundColor: `${metric.color}10`
            }}
          >
            <div className="flex justify-center mb-2">
              <metric.icon 
                className="w-6 h-6" 
                style={{ color: metric.color }} 
              />
            </div>
            <div 
              className="text-lg font-bold mb-1"
              style={{ color: metric.color }}
            >
              {metric.value}
            </div>
            <div className="text-xs text-gray-600">
              {metric.name}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div 
                className="h-1 rounded-full transition-all duration-1000"
                style={{ 
                  backgroundColor: metric.color,
                  width: metric.value
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div>
        <h4 
          className="font-bold mb-4"
          style={{ color: 'var(--azab-primary)' }}
        >
          حالة الخدمات
        </h4>
        <div className="space-y-3">
          {systemStatus.map((service, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: 'var(--azab-light)' }}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                {getStatusIcon(service.status)}
                <div>
                  <h5 className="font-medium text-gray-900">
                    {service.service}
                  </h5>
                  <p className="text-xs text-gray-500">
                    {service.lastCheck}
                  </p>
                </div>
              </div>
              <div className="text-left">
                <div 
                  className="text-sm font-medium"
                  style={{ color: getStatusColor(service.status) }}
                >
                  {service.uptime}
                </div>
                <div className="text-xs text-gray-500">
                  وقت التشغيل
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick System Actions */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--azab-border-color)' }}>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: 'var(--azab-primary)',
              color: 'white'
            }}
          >
            <Database className="w-4 h-4" />
            <span>نسخ احتياطي</span>
          </button>
          <button 
            className="flex items-center justify-center space-x-2 space-x-reverse py-2 px-4 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--azab-border-color)' }}
          >
            <Wifi className="w-4 h-4" />
            <span>فحص الاتصال</span>
          </button>
        </div>
      </div>
    </div>
  );
};