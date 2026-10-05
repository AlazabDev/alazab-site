import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, ClipboardList, RefreshCw, Wrench } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MaintenanceModuleNav from '@/components/maintenance/MaintenanceModuleNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type RequestRow = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  service_type: string | null;
  created_at: string;
};

type WorkOrderRow = {
  id: string;
  work_order_number: string;
  status: string;
  priority: string;
  title: string;
  created_at: string;
};

const normalize = (value: string | null | undefined) => (value || '').trim().toLowerCase().replace(/[_\s-]+/g, '');

const MaintenanceOperations: React.FC = () => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [workOrdersReady, setWorkOrdersReady] = useState(true);

  const load = async () => {
    setLoading(true);
    const client = supabase as any;

    const [{ data: requestData }, workOrderResult] = await Promise.all([
      client
        .from('maintenance_requests')
        .select('id,title,status,priority,service_type,created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      client
        .from('maintenance_work_orders')
        .select('id,work_order_number,status,priority,title,created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    setRequests((requestData || []) as RequestRow[]);
    if (workOrderResult.error) {
      setWorkOrdersReady(false);
      setWorkOrders([]);
    } else {
      setWorkOrdersReady(true);
      setWorkOrders((workOrderResult.data || []) as WorkOrderRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const metrics = useMemo(() => {
    const open = requests.filter((item) => !['completed', 'closed', 'cancelled', 'canceled'].includes(normalize(item.status))).length;
    const urgent = requests.filter((item) => ['urgent', 'عاجلة', 'عاجل'].includes((item.priority || '').toLowerCase())).length;
    const completed = requests.filter((item) => ['completed', 'closed', 'مكتمل', 'مغلقة', 'مغلق'].includes((item.status || '').toLowerCase())).length;
    const activeWorkOrders = workOrders.filter((item) => !['completed', 'closed', 'cancelled'].includes(normalize(item.status))).length;
    return { open, urgent, completed, activeWorkOrders };
  }, [requests, workOrders]);

  const cards = [
    { label: 'طلبات مفتوحة', value: metrics.open, icon: ClipboardList },
    { label: 'طلبات عاجلة', value: metrics.urgent, icon: AlertTriangle },
    { label: 'أوامر عمل نشطة', value: metrics.activeWorkOrders, icon: Wrench },
    { label: 'طلبات مكتملة', value: metrics.completed, icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <main className="pt-20" dir="rtl">
        <MaintenanceModuleNav />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-construction-primary">Maintenance Operations</p>
              <h1 className="text-3xl font-bold tracking-tight">لوحة تشغيل الصيانة</h1>
              <p className="mt-2 text-muted-foreground">حالة البلاغات وأوامر العمل من نقطة تشغيل واحدة.</p>
            </div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-bold">{loading ? '—' : value}</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!workOrdersReady && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              جدول أوامر العمل غير مطبق بعد في قاعدة البيانات. واجهة التشغيل جاهزة وستتصل به تلقائيًا بعد تشغيل migration الخاص بهذا الفرع.
            </div>
          )}

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>أحدث طلبات الصيانة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {requests.slice(0, 6).map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{request.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{request.service_type || 'غير مصنف'}</p>
                    </div>
                    <Badge variant="outline">{request.status || 'Open'}</Badge>
                  </div>
                ))}
                {!loading && requests.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد طلبات صيانة.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أوامر العمل الأخيرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workOrders.slice(0, 6).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-muted-foreground">{order.work_order_number}</p>
                      <p className="truncate font-medium">{order.title}</p>
                    </div>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                ))}
                {!loading && workOrders.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                    <Clock3 className="mb-2 h-6 w-6" />
                    <p className="text-sm">لا توجد أوامر عمل بعد.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenanceOperations;
