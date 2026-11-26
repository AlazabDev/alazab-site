import React, { useState, useEffect, useCallback } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, AlertTriangle, CheckCircle, RefreshCw, Search, 
  Clock, Wifi, WifiOff, Filter, ChevronDown, ChevronUp,
  MessageSquare, ArrowDownLeft, ArrowUpRight, XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WebhookEvent {
  id: string;
  source: string;
  payload: any;
  created_at: string;
  event_hash: string;
  raw_body: string | null;
  signature: string | null;
}

interface WhatsAppMessage {
  id: string;
  wa_message_id: string | null;
  phone_number: string;
  customer_name: string | null;
  direction: string;
  message_type: string;
  content: string | null;
  status: string | null;
  created_at: string;
}

const WebhookMonitorPage: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'messages' | 'errors'>('events');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, errors: 0, messages: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [eventsRes, messagesRes] = await Promise.all([
      supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('whatsapp_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const evts = eventsRes.data || [];
    const msgs = messagesRes.data || [];

    setEvents(evts);
    setMessages(msgs);

    const todayEvents = evts.filter(e => new Date(e.created_at!) >= todayStart);
    const errorEvents = evts.filter(e => {
      const p = e.payload as any;
      return p?.entry?.some?.((en: any) => 
        en?.changes?.some?.((c: any) => c?.value?.errors?.length > 0)
      );
    });

    setStats({
      total: evts.length,
      today: todayEvents.length,
      errors: errorEvents.length,
      messages: msgs.length,
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!isLive) return;

    const evtChannel = supabase
      .channel('webhook-events-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'webhook_events' }, (payload) => {
        setEvents(prev => [payload.new as WebhookEvent, ...prev].slice(0, 100));
        setStats(prev => ({ ...prev, total: prev.total + 1, today: prev.today + 1 }));
      })
      .subscribe();

    const msgChannel = supabase
      .channel('whatsapp-messages-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [payload.new as WhatsAppMessage, ...prev].slice(0, 100));
          setStats(prev => ({ ...prev, messages: prev.messages + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === (payload.new as WhatsAppMessage).id ? payload.new as WhatsAppMessage : m));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(evtChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [isLive]);

  const getEventErrors = (event: WebhookEvent) => {
    const p = event.payload as any;
    const errors: any[] = [];
    p?.entry?.forEach((en: any) => {
      en?.changes?.forEach((c: any) => {
        c?.value?.errors?.forEach((err: any) => errors.push(err));
      });
    });
    return errors;
  };

  const getEventMessageCount = (event: WebhookEvent) => {
    const p = event.payload as any;
    let count = 0;
    p?.entry?.forEach((en: any) => {
      en?.changes?.forEach((c: any) => {
        count += (c?.value?.messages?.length || 0);
      });
    });
    return count;
  };

  const filteredEvents = events.filter(e => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return e.source.toLowerCase().includes(s) || 
           e.event_hash.toLowerCase().includes(s) ||
           JSON.stringify(e.payload).toLowerCase().includes(s);
  });

  const errorEvents = events.filter(e => getEventErrors(e).length > 0);

  const filteredMessages = messages.filter(m => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return m.phone_number.includes(s) || 
           m.content?.toLowerCase().includes(s) ||
           m.customer_name?.toLowerCase().includes(s);
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'read': return 'bg-emerald-100 text-emerald-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'received': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string | null) => {
    const map: Record<string, string> = {
      sent: 'مُرسل', delivered: 'تم التوصيل', read: 'مقروء',
      failed: 'فشل', received: 'مستلم', pending: 'قيد الانتظار'
    };
    return map[status || ''] || status || 'غير معروف';
  };

  return (
    <AdminDashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">مراقبة الويب هوك</h1>
              <p className="text-muted-foreground text-sm mt-1">مراقبة أحداث واتساب والرسائل في الوقت الفعلي</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={isLive ? "default" : "outline"}
                size="sm"
                onClick={() => setIsLive(!isLive)}
                className="gap-2"
              >
                {isLive ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isLive ? 'مباشر' : 'متوقف'}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50"><Activity className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50"><Clock className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.today}</p>
                  <p className="text-xs text-muted-foreground">أحداث اليوم</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-50"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.errors}</p>
                  <p className="text-xs text-muted-foreground">أخطاء</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50"><MessageSquare className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.messages}</p>
                  <p className="text-xs text-muted-foreground">رسائل</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2">
              {(['events', 'messages', 'errors'] as const).map(tab => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab)}
                  className="gap-1"
                >
                  {tab === 'events' && <Activity className="w-3.5 h-3.5" />}
                  {tab === 'messages' && <MessageSquare className="w-3.5 h-3.5" />}
                  {tab === 'errors' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {tab === 'events' ? 'الأحداث' : tab === 'messages' ? 'الرسائل' : 'الأخطاء'}
                  {tab === 'errors' && stats.errors > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{stats.errors}</Badge>
                  )}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
          </div>

          {/* Content */}
          {activeTab === 'events' && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">أحداث الويب هوك ({filteredEvents.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">لا توجد أحداث</div>
                ) : (
                  <div className="divide-y">
                    {filteredEvents.map(event => {
                      const errors = getEventErrors(event);
                      const msgCount = getEventMessageCount(event);
                      const isExpanded = expandedEvent === event.id;
                      return (
                        <div key={event.id} className="hover:bg-muted/30 transition-colors">
                          <button
                            onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                            className="w-full px-4 py-3 flex items-center justify-between text-right"
                          >
                            <div className="flex items-center gap-3">
                              {errors.length > 0 ? (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              )}
                              <div className="text-right">
                                <p className="text-sm font-medium text-foreground">{event.source}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(event.created_at!), 'dd MMM yyyy HH:mm:ss', { locale: ar })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {msgCount > 0 && <Badge variant="secondary" className="text-[10px]">{msgCount} رسالة</Badge>}
                              {errors.length > 0 && <Badge variant="destructive" className="text-[10px]">{errors.length} خطأ</Badge>}
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-auto max-h-64 text-left" dir="ltr">
                                <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                              </div>
                              {errors.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {errors.map((err, i) => (
                                    <div key={i} className="text-xs bg-red-50 text-red-700 p-2 rounded">
                                      {err.code}: {err.title} — {err.message}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-2">Hash: {event.event_hash}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'messages' && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">الرسائل ({filteredMessages.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredMessages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">لا توجد رسائل</div>
                ) : (
                  <div className="divide-y">
                    {filteredMessages.map(msg => (
                      <div key={msg.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {msg.direction === 'inbound' ? (
                            <ArrowDownLeft className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{msg.customer_name || msg.phone_number}</p>
                              <Badge variant="outline" className="text-[10px]">{msg.message_type}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">{msg.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {format(new Date(msg.created_at), 'dd MMM HH:mm:ss', { locale: ar })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-[10px] ${getStatusColor(msg.status)}`}>
                          {getStatusLabel(msg.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'errors' && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  الأخطاء ({errorEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {errorEvents.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                    <p>لا توجد أخطاء — كل شيء يعمل بشكل سليم</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {errorEvents.map(event => {
                      const errors = getEventErrors(event);
                      return (
                        <div key={event.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(event.created_at!), 'dd MMM yyyy HH:mm:ss', { locale: ar })}
                            </p>
                            <Badge variant="destructive" className="text-[10px]">{errors.length} خطأ</Badge>
                          </div>
                          {errors.map((err, i) => (
                            <div key={i} className="text-sm bg-red-50 text-red-700 p-3 rounded-lg mb-1">
                              <p className="font-medium">{err.title || `خطأ ${err.code}`}</p>
                              <p className="text-xs mt-1">{err.message || err.error_data?.details || JSON.stringify(err)}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default WebhookMonitorPage;
