import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SEO } from '@/components/SEO';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full bg-muted/20">
        <Sidebar />
        <SidebarInset>
          <SEO
            title={`${title} | نظام اعتماد المستندات | العزب`}
            description={subtitle || 'نظام العزب لإدارة ومراجعة واعتماد المستندات والفواتير وعروض الأسعار.'}
          />
          <Header title={title} subtitle={subtitle} />
          <div className="flex-1 p-3 sm:p-6">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
