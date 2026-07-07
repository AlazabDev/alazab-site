import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, Server, Database, Cloud, Cpu, MemoryStick, Wifi, WifiOff,
  RefreshCw, Settings2, KeyRound, FileText, CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const LS_BASE = 'azab.adminApi.baseUrl';
const LS_KEY = 'azab.adminApi.key';

const DEFAULT_BASE = (() => {
  if (typeof window === 'undefined') return 'http://localhost:3004';
  const origin = window.location.origin;
  if (/localhost|127\.0\.0\.1/.test(origin)) return 'http://localhost:3004';
  return 'https://api.azab.services';
})();

type ServiceStatus = { ok?: boolean; connected?: boolean; error?: string; [k: string]: unknown };
type StatusResponse = {
  ok: boolean;
  timestamp: string;
  server: { name: string; env: string; port: number; uptime_human: string; pid: number; node_version: string };
  services: { api: ServiceStatus; mcp: ServiceStatus; database: ServiceStatus; supabase: ServiceStatus };
  memory: { rss_mb: string; heap_used_mb: string; heap_total_mb: string; external_mb: string };
};

type LogEntry = { message?: string; level?: string; timestamp?: string; [k: string]: unknown };

const isUp = (s?: ServiceStatus) => !!(s && (s.ok === true || s.connected === true));

const StatusDot: React.FC<{ up: boolean; label: string }> = ({ up, label }) => (
  <div className="flex items-center gap-2">
    <span className="relative flex h-3 w-3">
      <span
        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
          up ? 'animate-ping bg-green-400' : 'bg-red-400'
        }`}
      />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${up ? 'bg-green-500' : 'bg-red-500'}`} />
    </span>
    <span className="text-sm">{label}</span>
  </div>
);

const ServiceCard: React.FC<{
  title: string; icon: React.ReactNode; service?: ServiceStatus; extra?: React.ReactNode;
}> = ({ title, icon, service, extra }) => {
  const up = isUp(service);
  return (
    <Card className={`border-l-4 ${up ? 'border-l-green-500' : 'border-l-red-500'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            {icon}
            {title}
          </span>
          <Badge variant={up ? 'default' : 'destructive'} className="gap-1">
            {up ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {up ? 'متصل' : 'غير متصل'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-1">
        {service?.error && (
          <div className="flex items-start gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="break-all">{service.error}</span>
          </div>
        )}
        {extra}
      </CardContent>
    </Card>
  );
};

const AdminServerDashboard: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(LS_BASE) || DEFAULT_BASE);
  // SECURITY: Admin key is only kept in memory (sessionStorage) — never persisted to localStorage
  // to prevent long-lived exfiltration via XSS or malicious browser extensions.
  const [apiKey, setApiKey] = useState(() => {
    try { return sessionStorage.getItem(LS_KEY) || ''; } catch { return ''; }
  });
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [env, setEnv] = useState<Record<string, string> | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logType, setLogType] = useState<'combined' | 'error'>('combined');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [reachable, setReachable] = useState<boolean | null>(null);

  const headers = useMemo(
    () => ({ 'X-Admin-Key': apiKey, 'Content-Type': 'application/json' }),
    [apiKey]
  );

  const fetchAll = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        fetch(`${baseUrl}/api/admin/status`, { headers }).then((r) => r.json()),
        fetch(`${baseUrl}/api/admin/env`, { headers }).then((r) => r.json()),
      ]);
      if (s?.error) throw new Error(s.error);
      setStatus(s);
      setEnv(e?.env || null);
      setReachable(true);
      setLastFetch(new Date());
    } catch (err) {
      setReachable(false);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ title: 'فشل الاتصال بالخادم', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseUrl, headers]);

  const fetchLogs = useCallback(async () => {
    if (!apiKey) return;
    try {
      const r = await fetch(`${baseUrl}/api/admin/logs?type=${logType}&lines=100`, { headers });
      const j = await r.json();
      setLogs(j?.entries || []);
    } catch {
      /* ignore */
    }
  }, [apiKey, baseUrl, headers, logType]);

  const saveConfig = () => {
    localStorage.setItem(LS_BASE, baseUrl);
    // SECURITY: store admin key only for the tab session (cleared on tab close).
    try { sessionStorage.setItem(LS_KEY, apiKey); } catch { /* ignore */ }
    toast({ title: 'تم الحفظ', description: 'سيتم تحديث البيانات الآن (المفتاح محفوظ لهذه الجلسة فقط)' });
    fetchAll();
    fetchLogs();
  };

  useEffect(() => {
    fetchAll();
    fetchLogs();
  }, [fetchAll, fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      fetchAll();
      fetchLogs();
    }, 10000);
    return () => clearInterval(t);
  }, [autoRefresh, fetchAll, fetchLogs]);

  const overallUp = status?.ok && reachable !== false;

  return (
    <AdminDashboardLayout>
      <div className="container mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-construction-primary flex items-center gap-2">
              <Server className="w-6 h-6 sm:w-8 sm:h-8" />
              لوحة إدارة الخادم
            </h1>
            <p className="text-xs sm:text-base text-muted-foreground mt-1">
              مراقبة الخدمات وحالة الاتصال في الوقت الفعلي
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={overallUp ? 'default' : 'destructive'} className="gap-1 text-sm py-1.5 px-3">
              {overallUp ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {reachable === false ? 'الخادم غير متاح' : overallUp ? 'النظام يعمل' : 'يوجد مشاكل'}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { fetchAll(); fetchLogs(); }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Connection config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              إعدادات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <Label className="text-xs">عنوان الخادم</Label>
              <Input
                dir="ltr"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.azab.services"
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs flex items-center gap-1">
                <KeyRound className="w-3 h-3" /> ADMIN_API_KEY
              </Label>
              <Input
                dir="ltr"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="md:col-span-1 flex items-end gap-2">
              <Button onClick={saveConfig} className="flex-1">حفظ والاتصال</Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="icon"
                onClick={() => setAutoRefresh((v) => !v)}
                title="تحديث تلقائي"
              >
                <Activity className="w-4 h-4" />
              </Button>
            </div>
            {lastFetch && (
              <div className="md:col-span-3 text-xs text-muted-foreground">
                آخر تحديث: {lastFetch.toLocaleTimeString('ar-EG')}
                {autoRefresh && ' • تحديث تلقائي كل 10 ثوانٍ'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ServiceCard
            title="API Server"
            icon={<Server className="w-4 h-4" />}
            service={status?.services.api}
            extra={status && <div>المنفذ: {status.server.port} • PID: {status.server.pid}</div>}
          />
          <ServiceCard
            title="MCP Server"
            icon={<Activity className="w-4 h-4" />}
            service={status?.services.mcp}
          />
          <ServiceCard
            title="PostgreSQL"
            icon={<Database className="w-4 h-4" />}
            service={status?.services.database}
          />
          <ServiceCard
            title="Supabase"
            icon={<Cloud className="w-4 h-4" />}
            service={status?.services.supabase}
          />
        </div>

        {/* Metrics + tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="w-4 h-4" /> معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {status ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">البيئة</span><Badge variant="outline">{status.server.env}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">وقت التشغيل</span><span>{status.server.uptime_human}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Node.js</span><span>{status.server.node_version}</span></div>
                  <div className="border-t pt-2 mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MemoryStick className="w-3 h-3" /> الذاكرة</div>
                    <div className="flex justify-between text-xs"><span>RSS</span><span>{status.memory.rss_mb} MB</span></div>
                    <div className="flex justify-between text-xs"><span>Heap Used</span><span>{status.memory.heap_used_mb} MB</span></div>
                    <div className="flex justify-between text-xs"><span>Heap Total</span><span>{status.memory.heap_total_mb} MB</span></div>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground text-xs">لا توجد بيانات — أدخل مفتاح الإدارة</div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">تفاصيل</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="logs">
                <TabsList>
                  <TabsTrigger value="logs"><FileText className="w-4 h-4 ml-1" /> السجلات</TabsTrigger>
                  <TabsTrigger value="env"><KeyRound className="w-4 h-4 ml-1" /> المتغيرات</TabsTrigger>
                  <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Button size="sm" variant={logType === 'combined' ? 'default' : 'outline'} onClick={() => setLogType('combined')}>الكل</Button>
                    <Button size="sm" variant={logType === 'error' ? 'default' : 'outline'} onClick={() => setLogType('error')}>الأخطاء فقط</Button>
                    <Button size="sm" variant="ghost" onClick={fetchLogs}><RefreshCw className="w-3 h-3" /></Button>
                  </div>
                  <ScrollArea className="h-80 border rounded-md bg-muted/30 p-2 font-mono text-xs" dir="ltr">
                    {logs.length === 0 ? (
                      <div className="text-muted-foreground text-center py-8">لا توجد سجلات</div>
                    ) : logs.map((l, i) => (
                      <div key={i} className="border-b border-border/30 py-1">
                        {l.timestamp && <span className="text-muted-foreground">{l.timestamp} </span>}
                        {l.level && <span className={l.level === 'error' ? 'text-red-500' : 'text-blue-500'}>[{l.level}] </span>}
                        <span className="break-all">{l.message || JSON.stringify(l)}</span>
                      </div>
                    ))}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="env" className="mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {env ? Object.entries(env).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                        <span className="font-mono">{k}</span>
                        <span className={`font-mono ${v.startsWith('❌') ? 'text-red-500' : 'text-green-600'}`}>{v}</span>
                      </div>
                    )) : <div className="text-muted-foreground">لا توجد بيانات</div>}
                  </div>
                </TabsContent>

                <TabsContent value="overview" className="mt-3 space-y-2">
                  <StatusDot up={isUp(status?.services.api)} label="API Server" />
                  <StatusDot up={isUp(status?.services.mcp)} label="MCP Server" />
                  <StatusDot up={isUp(status?.services.database)} label="PostgreSQL Database" />
                  <StatusDot up={isUp(status?.services.supabase)} label="Supabase Cloud" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminServerDashboard;
