import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AdminNotification {
  id: string;
  title: string;
  message: string | null;
  severity: NotificationSeverity;
  source: string;
  link: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const useAdminNotifications = (limit = 50) => {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) setItems(data as AdminNotification[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('admin_notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setItems((prev) => [payload.new as AdminNotification, ...prev].slice(0, limit));
          } else if (payload.eventType === 'UPDATE') {
            setItems((prev) =>
              prev.map((n) =>
                n.id === (payload.new as AdminNotification).id
                  ? (payload.new as AdminNotification)
                  : n
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setItems((prev) => prev.filter((n) => n.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, limit]);

  const unreadCount = items.filter((n) => !n.read_at).length;

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase
      .from('admin_notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
  }, [items]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('admin_notifications').delete().eq('id', id);
  }, []);

  return { items, unreadCount, loading, markAsRead, markAllAsRead, remove, refresh: fetchAll };
};
