import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{
      background: 'var(--azab-light)',
      fontFamily: 'var(--azab-font-family)',
      direction: 'rtl'
    }}>
      <div className="flex items-center gap-2 lg:hidden px-3 pt-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="فتح القائمة">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 w-[280px]" dir="rtl">
            <div onClick={() => setOpen(false)}>
              <AdminSidebar />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <AdminHeader />

      <div className="flex">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        <main className="flex-1 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
