import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast';
import { webhookApi, type WebhookEvent, type WebhookStats, type WebhookConfig } from '../lib/webhookApi';
import {
  RefreshCw, Trash2, Send, Activity, MessageSquare,
  AlertTriangle, CheckCircle2, XCircle, Clock, Settings,
  Copy, ExternalLink, Wifi, WifiOff
} from 'lucide-react';

const InternalWebhookPage: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats>({ total: 0, messages: 0, statuses: 0, errors: 0 });
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [eventsData, configData] = await Promise.all([
        webhookApi.getEvents({ limit: 200 }),
        webhookApi.getConfig().catch(() => null),
      ]);
      setEvents(eventsData.events);
      setStats(eventsData.stats);
      if (configData) setConfig(configData);
    } catch (err) {
      console.error('Failed to fetch webhook data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live polling
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [isLive, fetchData]);

  const handleClearEvents = async () => {
    try {
      await webhookApi.clearEvents();
      setEvents([]);
      setStats({ total: 0, messages: 0, statuses: 0, errors: 0 });
      toast({ title: 'تم مسح السجل' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل في مسح السجل', variant: 'destructive' });
    }
  };

  const handleSendTest = async () => {
    try {
      await webhookApi.sendTest({ test: true, source: 'dashboard', timestamp: new Date().toISOString() });
      toast({ title: 'تم إرسال حدث تجريبي' });
      fetchData();
    } catch {
      toast({ title: 'خطأ', description: 'فشل في إرسال الحدث التجريبي', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'تم النسخ' });
  };

  const getFilteredEvents = () => {
    let filtered = events;
    if (activeTab !== 'all') filtered = filtered.filter(e => e.type === activeTab);
    if (searchTerm) {
      filtered = filtered.filter(e =>
        JSON.stringify(e).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'status': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'test': return <Send className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      received: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      read: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[status] || 'bg-muted text-muted-foreground'}>{status}</Badge>;
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' });
    } catch { return ts; }
  };

  const filteredEvents = getFilteredEvents();

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مراقبة الويب هوك</h1>
            <p className="text-muted-foreground text-sm">مراقبة وإدارة أحداث WhatsApp Webhook من داخل التطبيق</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isLive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLive(!isLive)}
            >
              {isLive ? <Wifi className="h-4 w-4 ml-1" /> : <WifiOff className="h-4 w-4 ml-1" />}
              {isLive ? 'مباشر' : 'متوقف'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendTest}>
              <Send className="h-4 w-4 ml-1" />
              اختبار
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearEvents}>
              <Trash2 className="h-4 w-4 ml-1" />
              مسح
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">إجمالي الأحداث</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-6 w-6 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold">{stats.messages}</div>
              <div className="text-xs text-muted-foreground">الرسائل</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold">{stats.statuses}</div>
              <div className="text-xs text-muted-foreground">تحديثات الحالة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-red-500" />
              <div className="text-2xl font-bold">{stats.errors}</div>
              <div className="text-xs text-muted-foreground">الأخطاء</div>
            </CardContent>
          </Card>
        </div>

        {/* Config Card */}
        {config && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                إعدادات الويب هوك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رابط الويب هوك</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-muted px-3 py-1.5 rounded flex-1 truncate">
                      {config.whatsapp.webhookUrl}
                    </code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config.whatsapp.webhookUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Verify Token</span>
                    <Badge variant={config.whatsapp.verifyToken.includes('configured') ? 'default' : 'destructive'}>
                      {config.whatsapp.verifyToken.includes('configured') ? '✓ مُعدّ' : '✗ غير مُعدّ'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">App Secret</span>
                    <Badge variant={config.whatsapp.appSecret.includes('configured') ? 'default' : 'destructive'}>
                      {config.whatsapp.appSecret.includes('configured') ? '✓ مُعدّ' : '✗ غير مُعدّ'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Access Token</span>
                    <Badge variant={config.whatsapp.accessToken.includes('configured') ? 'default' : 'destructive'}>
                      {config.whatsapp.accessToken.includes('configured') ? '✓ مُعدّ' : '✗ غير مُعدّ'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Events */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">سجل الأحداث</CardTitle>
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
                <TabsTrigger value="message">رسائل ({stats.messages})</TabsTrigger>
                <TabsTrigger value="status">حالات ({stats.statuses})</TabsTrigger>
                <TabsTrigger value="error">أخطاء ({stats.errors})</TabsTrigger>
              </TabsList>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p>لا توجد أحداث بعد</p>
                    <p className="text-xs mt-1">سوف تظهر الأحداث هنا عند استلامها من Meta</p>
                  </div>
                ) : (
                  filteredEvents.map((event, idx) => {
                    const key = `${event.type}-${event.timestamp}-${idx}`;
                    const isExpanded = expandedEvent === key;
                    return (
                      <div
                        key={key}
                        className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setExpandedEvent(isExpanded ? null : key)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.type)}
                            <span className="font-medium text-sm">
                              {event.type === 'message' && `رسالة من ${event.from || 'مجهول'}`}
                              {event.type === 'status' && `تحديث حالة: ${event.status}`}
                              {event.type === 'error' && 'خطأ'}
                              {event.type === 'test' && 'حدث تجريبي'}
                            </span>
                            {event.status && getStatusBadge(event.status)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.timestamp)}
                          </div>
                        </div>

                        {event.type === 'message' && (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {event.customerName && <span className="font-medium">{event.customerName} • </span>}
                            <span>{event.messageType}</span>
                            {event.content && <span> • {event.content.slice(0, 80)}</span>}
                          </div>
                        )}

                        {isExpanded && (
                          <pre className="mt-3 bg-muted p-3 rounded text-xs overflow-x-auto max-h-60 ltr text-left" dir="ltr">
                            {JSON.stringify(event, null, 2)}
                          </pre>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InternalWebhookPage;
