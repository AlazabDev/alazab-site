import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, FileCheck2, Gauge, Plus, ReceiptText, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const links = [
  { to: '/maintenance', label: 'لوحة التشغيل', icon: Gauge, end: true },
  { to: '/maintenance/requests', label: 'طلبات الصيانة', icon: ClipboardList },
  { to: '/maintenance/work-orders', label: 'أوامر العمل', icon: Wrench },
  { to: '/maintenance/receipts', label: 'مراجعة الأذون', icon: ReceiptText },
  { to: '/maintenance/reports', label: 'التقارير', icon: FileCheck2 },
];

const MaintenanceModuleNav: React.FC = () => (
  <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
    <div className="container mx-auto flex flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" aria-label="قسم الصيانة">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-construction-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Button asChild className="shrink-0 bg-construction-primary text-white hover:bg-construction-primary/90">
        <NavLink to="/maintenance-request">
          <Plus className="ml-2 h-4 w-4" />
          طلب صيانة جديد
        </NavLink>
      </Button>
    </div>
  </div>
);

export default MaintenanceModuleNav;
