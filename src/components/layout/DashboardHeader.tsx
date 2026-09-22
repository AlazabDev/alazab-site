import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import UserAccountMenu from '@/components/shared/UserAccountMenu';

export function DashboardHeader() {
  return (
    <header className="border-b bg-background px-3 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger />
          <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">لوحة التحكم</h1>
        </div>
        <UserAccountMenu showIdentity />
      </div>
    </header>
  );
}
