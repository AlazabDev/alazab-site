import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Wrench } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MaintenanceModuleNav from '@/components/maintenance/MaintenanceModuleNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

type WorkOrder = {
  id: string;
  work_order_number: string;
  request_id: string | null;
  title: string;
  branch: string | null;
  service_type: string | null;
  priority: string;
  status: string;
  scheduled_at: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  new: 'جديد',
  triaged: 'تم الفرز',
  approved: 'معتمد',
  assigned: 'تم الإسناد',
  scheduled: 'مجدول',
  in_progress: 'قيد التنفيذ',
  waiting_parts: 'انتظار قطع',
  waiting_approval: 'انتظار اعتماد',
  completed: 'مكتمل',
  financial_review: 'مراجعة مالية',
  closed: 'مغلق',
  cancelled: 'ملغي',
};

const MaintenanceWorkOrders: React.FC = () => {
  const [rows, setRows] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('maintenance_work_orders')
      .select('id,work_order_number,request_id,title,branch,service_type,priority,status,scheduled_at,estimated_cost,actual_cost,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setSchemaReady(false);
      setRows([]);
    } else {
      setSchemaReady(true);
      setRows((data || []) as WorkOrder[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !term || [row.work_order_number, row.title, row.branch, row.service_type]
        .some((value) => (value || '').toLowerCase().includes(term));
      return matchesSearch && (status === 'all' || row.status === status);
    });
  }, [rows, search, status]);

  const updateStatus = async (row: WorkOrder, nextStatus: string) => {
    if (nextStatus === row.status) return;
    const { error } = await (supabase as any)
      .from('maintenance_work_orders')
      .update({ status: nextStatus })
      .eq('id', row.id);

    if (error) {
      toast({
        title: 'تعذر تغيير الحالة',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setRows((current) => current.map((item) => item.id === row.id ? { ...item, status: nextStatus } : item));
    toast({ title: 'تم تحديث أمر العمل', description: `${row.work_order_number} → ${statusLabels[nextStatus] || nextStatus}` });
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Header />
      <main className="pt-20" dir="rtl">
        <MaintenanceModuleNav />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-construction-primary">Work Orders</p>
              <h1 className="text-3xl font-bold tracking-tight">أوامر العمل</h1>
              <p className="mt-2 text-muted-foreground">التنفيذ الفعلي للبلاغات بعد الفرز والاعتماد والإسناد.</p>
            </div>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>

          {!schemaReady && (
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardContent className="p-5 text-sm text-amber-900">
                جدول <code>maintenance_work_orders</code> غير موجود في قاعدة البيانات الحالية. شغّل migration المضاف في هذا الفرع ثم أعد تحميل الصفحة.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> سجل أوامر العمل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالرقم أو العنوان أو الفرع..." className="pr-9" />
                </div>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الأمر</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>الأولوية</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التكلفة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.work_order_number}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.title}</div>
                          <div className="text-xs text-muted-foreground">{row.service_type || 'غير مصنف'}</div>
                        </TableCell>
                        <TableCell>{row.branch || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{row.priority}</Badge></TableCell>
                        <TableCell className="min-w-[180px]">
                          <Select value={row.status} onValueChange={(value) => void updateStatus(row, value)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{row.actual_cost ?? row.estimated_cost ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">لا توجد أوامر عمل مطابقة.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenanceWorkOrders;
