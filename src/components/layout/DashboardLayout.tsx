import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from './AppSidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div dir="ltr" className="flex min-h-svh w-full min-w-0 bg-gray-50">
        <AppSidebar />
        <div dir="rtl" className="flex min-h-svh min-w-0 flex-1 flex-col overflow-x-hidden">
          <DashboardHeader />
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
