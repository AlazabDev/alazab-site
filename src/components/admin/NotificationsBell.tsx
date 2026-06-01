import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Trash2, ExternalLink,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  useAdminNotifications, type AdminNotification, type NotificationSeverity,
} from '@/hooks/useAdminNotifications';

const severityIcon = (s: NotificationSeverity) => {
  const cls = 'w-4 h-4 shrink-0';
  switch (s) {
    case 'success': return <CheckCircle2 className={`${cls} text-green-500`} />;
    case 'warning': return <AlertTriangle className={`${cls} text-amber-500`} />;
    case 'error': return <XCircle className={`${cls} text-red-500`} />;
    default: return <Info className={`${cls} text-blue-500`} />;
  }
};

const NotificationItem: React.FC<{
  n: AdminNotification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
  onNavigate: (link: string) => void;
}> = ({ n, onRead, onRemove, onNavigate }) => {
  const unread = !n.read_at;
  return (
    <div
      className={`group relative p-3 border-b last:border-b-0 transition-colors ${
        unread ? 'bg-blue-50/50' : 'bg-transparent'
      } hover:bg-muted/50`}
    >
      <div className="flex gap-2">
        {severityIcon(n.severity)}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm leading-tight ${unread ? 'font-semibold' : 'font-medium'}`}>
              {n.title}
            </p>
            {unread && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />}
          </div>
          {n.message && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{n.source}</Badge>
              <span>
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ar })}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {n.link && (
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  onClick={() => { onRead(n.id); onNavigate(n.link!); }}
                  aria-label="فتح"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              )}
              {unread && (
                <Button
                  size="icon" variant="ghost" className="h-6 w-6"
                  onClick={() => onRead(n.id)} aria-label="تمييز كمقروء"
                >
                  <CheckCheck className="w-3 h-3" />
                </Button>
              )}
              <Button
                size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-600"
                onClick={() => onRemove(n.id)} aria-label="حذف"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationsBell: React.FC = () => {
  const { items, unreadCount, markAsRead, markAllAsRead, remove } = useAdminNotifications();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-lg hover:bg-gray-100"
          aria-label={`الإشعارات (${unreadCount} غير مقروء)`}
        >
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end" sideOffset={8} className="w-[360px] p-0" dir="rtl"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h3 className="font-semibold text-sm">الإشعارات</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} غير مقروء` : 'لا توجد إشعارات جديدة'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="w-3 h-3 ml-1" /> تمييز الكل
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">لا توجد إشعارات</p>
            </div>
          ) : (
            items.map((n) => (
              <NotificationItem
                key={n.id} n={n}
                onRead={markAsRead}
                onRemove={remove}
                onNavigate={(link) => {
                  if (link.startsWith('http')) window.open(link, '_blank');
                  else navigate(link);
                }}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
