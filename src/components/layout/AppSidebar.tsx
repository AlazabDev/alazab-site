import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Settings, User, Wrench, ClipboardList, FolderOpen, MessageSquare, Search, ListChecks } from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import UserAvatar from '@/components/shared/UserAvatar';
import { useUserProfile } from '@/contexts/UserProfileContext';

const navigationItems = [
  { title: 'الرئيسية', url: '/dashboard', icon: Home },
  { title: 'البحث', url: '/search', icon: Search },
  { title: 'طلبات الصيانة', url: '/maintenance-list', icon: ClipboardList },
  { title: 'المشاريع', url: '/project-management', icon: FolderOpen },
  { title: 'PN | ملاحظات المشروعات', url: '/pn', icon: ListChecks },
  { title: 'الرسائل', url: '/messages', icon: MessageSquare },
];

const bottomItems = [
  { title: 'الإعدادات', url: '/settings', icon: Settings },
  { title: 'الملف الشخصي', url: '/profile', icon: User },
];

export function AppSidebar() {
  const location = useLocation();
  const { profile, roleLabel } = useUserProfile();

  const isActive = (url: string) => {
    const [pathname, query] = url.split('?');
    if (location.pathname !== pathname) return false;
    return query ? location.search === `?${query}` : true;
  };

  const getNavClass = (path: string) =>
    isActive(path) ? 'bg-construction-primary text-white' : 'text-gray-700 hover:bg-gray-100';

  const renderItems = (items: typeof navigationItems) => items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink to={item.url} className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-lg px-2 py-2 transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 ${getNavClass(item.url)}`}>
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));

  return (
    <Sidebar side="left" collapsible="icon" className="shrink-0" >
      <SidebarHeader dir="rtl" className="overflow-hidden p-2 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-construction-primary"><Wrench className="h-4 w-4 text-white" /></div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden"><h2 className="whitespace-nowrap text-lg font-bold text-construction-primary">العزب للمقاولات</h2><p className="text-sm text-gray-500">إدارة المشاريع</p></div>
        </div>
      </SidebarHeader>
      <SidebarContent dir="rtl">
        <SidebarGroup>
          <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu>{renderItems(navigationItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent><SidebarMenu>{renderItems(bottomItems)}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter dir="rtl" className="overflow-hidden p-2 group-data-[collapsible=icon]:items-center">
        {profile && (
          <div className="flex items-center gap-3">
            <UserAvatar className="h-8 w-8 shrink-0" />
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium text-gray-900">{profile.fullName}</p>
              <p className="truncate text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
