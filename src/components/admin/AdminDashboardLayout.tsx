import React from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen" style={{
      background: 'var(--azab-light)',
      fontFamily: 'var(--azab-font-family)',
      direction: 'rtl'
    }}>
      {/* Header */}
      <AdminHeader />
      
      <div className="flex">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};