import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ClipboardList,
  FileCheck,
  FileText,
  Home,
  Receipt,
  RefreshCw,
  Settings,
  ShieldCheck,
  Upload,
  Users,
} from 'lucide-react';
import {
  Sidebar as UiSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { useApprovalAccess } from '@/hooks/useApprovalAccess';
import UserAvatar from '@/components/shared/UserAvatar';
import { useUserProfile } from '@/contexts/UserProfileContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const primaryItems: NavItem[] = [
  { label: 'لوحة الاعتماد', href: '/approvals', icon: ShieldCheck },
  { label: 'المستندات', href: '/approvals/documents', icon: FileText },
  { label: 'عروض الأسعار', href: '/approvals/quotes', icon: Receipt },
  { label: 'فواتير دفترة', href: '/approvals/daftra-invoices', icon: Receipt },
  { label: 'رفع مستند', href: '/approvals/upload', icon: Upload },
];

const managementItems: NavItem[] = [
  { label: 'المزامنة', href: '/approvals/sync', icon: RefreshCw, adminOnly: true },
  { label: 'تقرير النظام', href: '/approvals/system-report', icon: ClipboardList, adminOnly: true },
  { label: 'المستخدمون والصلاحيات', href: '/approvals/users', icon: Users, adminOnly: true },
  { label: 'الإعدادات العامة', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { canManage } = useApprovalAccess();
  const { profile, roleLabel } = useUserProfile();
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from('document_sync_logs')
      .select('completed_at, started_at')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setLastSync(data?.completed_at || data?.started_at || null);
      });
    return () => { active = false; };
  }, []);

  const isActive = (href: string) => {
    if (href === '/approvals') return location.pathname === '/approvals';
    return location.pathname.startsWith(href);
  };

  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const render = (items: NavItem[]) => items
    .filter((item) => !item.adminOnly || canManage)
    .map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
          <NavLink to={item.href} onClick={closeMobile}>
            <item.icon />
            <span>{item.label}</span>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <UiSidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b p-3">
        <NavLink to="/approvals" onClick={closeMobile} className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-construction-primary">
            <FileCheck className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate font-bold text-sidebar-foreground">نظام الاعتماد</p>
            <p className="truncate text-xs text-sidebar-foreground/60">مراجعة المستندات</p>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>المراجعة والاعتماد</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{render(primaryItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>الإدارة</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{render(managementItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="العودة إلى لوحة التحكم">
                  <NavLink to="/dashboard" onClick={closeMobile}>
                    <Home />
                    <span>لوحة التحكم الرئيسية</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="mb-2 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          {lastSync ? `آخر مزامنة: ${new Date(lastSync).toLocaleString('ar-EG')}` : 'لا توجد مزامنة مسجلة'}
        </div>
        {profile && (
          <div className="flex items-center gap-2 overflow-hidden">
            <UserAvatar className="h-8 w-8 shrink-0" />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{profile.fullName}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </UiSidebar>
  );
}
