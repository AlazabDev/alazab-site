import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncLog {
  id: string;
  document_type: string;
  page: number;
  status: 'running' | 'success' | 'error';
  synced_count: number;
  items_synced: number;
  error_count: number;
  message: string | null;
  started_at: string;
  completed_at: string | null;
}

const syncTypeLabels: Record<string, string> = {
  all: 'الكل',
  invoices: 'الفواتير',
  invoice: 'الفواتير',
  quotes: 'عروض الأسعار',
  quote: 'عروض الأسعار',
  estimates: 'عروض الأسعار',
};

export default function Sync() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [type, setType] = useState<'all' | 'invoices' | 'quotes'>('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('document_sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(40);

    if (error) {
      console.error('[approvals] sync logs failed', error);
      toast({ title: 'تعذر تحميل سجل المزامنة', description: error.message, variant: 'destructive' });
    } else {
      setLogs((data || []) as SyncLog[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const runSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-daftra', {
        body: { type, page: 1, limit: 15 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'فشلت المزامنة');

      toast({
        title: 'اكتملت المزامنة',
        description: `تمت مزامنة ${data.synced || 0} مستند و${data.itemsSynced || 0} عنصر.`,
      });
    } catch (error) {
      console.error('[approvals] sync failed', error);
      toast({
        title: 'فشلت المزامنة',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
      await loadLogs();
    }
  };

  const latest = logs[0];

  const statusBadge = (status: SyncLog['status']) => {
    if (status === 'success') return <Badge className="bg-green-100 text-green-800"><CheckCircle className="me-1 h-3 w-3" />نجاح</Badge>;
    if (status === 'error') return <Badge className="bg-red-100 text-red-800"><AlertCircle className="me-1 h-3 w-3" />خطأ</Badge>;
    return <Badge className="bg-amber-100 text-amber-800"><Clock className="me-1 h-3 w-3" />جارٍ التنفيذ</Badge>;
  };

  return (
    <MainLayout title="مزامنة دفترة" subtitle="مزامنة الفواتير وعروض الأسعار مع سجل تنفيذي حقيقي">
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">آخر مزامنة</p>
            <p className="mt-1 font-semibold">{latest ? new Date(latest.started_at).toLocaleString('ar-EG') : 'لا توجد'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">آخر نتيجة</p>
            <div className="mt-2">{latest ? statusBadge(latest.status) : <Badge variant="outline">لم تبدأ</Badge>}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">المستندات في آخر تشغيل</p>
            <p className="mt-1 text-2xl font-bold">{latest?.synced_count || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>تشغيل المزامنة</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">نوع البيانات</label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)} disabled={syncing}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الفواتير وعروض الأسعار</SelectItem>
                <SelectItem value="invoices">الفواتير فقط</SelectItem>
                <SelectItem value="quotes">عروض الأسعار فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void runSync()} disabled={syncing}>
            {syncing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
            {syncing ? 'جارٍ المزامنة...' : 'بدء المزامنة'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>سجل المزامنة</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : logs.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">البداية</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">المستندات</TableHead>
                    <TableHead className="text-right">العناصر</TableHead>
                    <TableHead className="text-right">الأخطاء</TableHead>
                    <TableHead className="text-right">الرسالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.started_at).toLocaleString('ar-EG')}</TableCell>
                      <TableCell>{syncTypeLabels[log.document_type] || log.document_type}</TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell>{log.synced_count}</TableCell>
                      <TableCell>{log.items_synced}</TableCell>
                      <TableCell className={log.error_count ? 'text-red-700' : ''}>{log.error_count}</TableCell>
                      <TableCell className="max-w-72 truncate text-sm text-muted-foreground">{log.message || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-10 text-center text-muted-foreground">لا توجد عمليات مزامنة مسجلة.</p>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
