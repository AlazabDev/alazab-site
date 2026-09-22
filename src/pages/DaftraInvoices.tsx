import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, Eye, Loader2, Receipt, RefreshCw, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDocuments } from '@/hooks/useDocuments';
import { useApprovalAccess } from '@/hooks/useApprovalAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function DaftraInvoices() {
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const { canManage } = useApprovalAccess();
  const queryClient = useQueryClient();
  const { data: documents = [], isLoading, refetch } = useDocuments();

  const invoices = documents.filter((doc) => doc.type === 'invoice' && !!doc.daftra_id);
  const filteredInvoices = invoices.filter((doc) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return doc.number.toLowerCase().includes(term) || doc.client_name.toLowerCase().includes(term);
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-daftra', {
        body: { type: 'invoices', page: 1, limit: 15 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'فشلت المزامنة');

      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['documentStats'] });
      toast.success(`تمت مزامنة ${data.synced || 0} فاتورة`);
    } catch (error) {
      console.error('[approvals] invoice sync failed', error);
      toast.error(error instanceof Error ? error.message : 'فشلت المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'EGP') =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency }).format(amount);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));

  const paymentBadge = (status: string) => {
    if (status === 'paid') return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
    if (status === 'partial') return <Badge className="bg-amber-100 text-amber-800">جزئي</Badge>;
    return <Badge variant="outline" className="border-red-300 text-red-700">غير مدفوع</Badge>;
  };

  return (
    <MainLayout title="فواتير دفترة" subtitle={`${filteredInvoices.length} فاتورة متاحة داخل نظام الاعتماد`}>
      <div className="mb-6 rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث برقم الفاتورة أو العميل..." className="pe-10" />
          </div>
          {canManage ? (
            <Button onClick={() => void handleSync()} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
              مزامنة من دفترة
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><Receipt className="h-6 w-6 text-primary" /><div><p className="text-sm text-muted-foreground">الإجمالي</p><p className="text-xl font-bold">{invoices.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">مدفوع</p><p className="text-xl font-bold text-green-700">{invoices.filter((doc) => doc.payment_status === 'paid').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">جزئي</p><p className="text-xl font-bold text-amber-700">{invoices.filter((doc) => doc.payment_status === 'partial').length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">غير مدفوع</p><p className="text-xl font-bold text-red-700">{invoices.filter((doc) => doc.payment_status === 'unpaid').length}</p></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filteredInvoices.length ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">العميل</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الدفع</TableHead>
                <TableHead className="text-right">آخر مزامنة</TableHead>
                <TableHead className="w-28 text-center">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium"><Link to={`/approvals/documents/${doc.id}`} className="hover:text-primary">{doc.number}</Link></TableCell>
                  <TableCell>{doc.client_name}</TableCell>
                  <TableCell><span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(doc.date)}</span></TableCell>
                  <TableCell className="font-semibold">{formatCurrency(doc.total, doc.currency)}</TableCell>
                  <TableCell>{paymentBadge(doc.payment_status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{doc.synced_at ? formatDate(doc.synced_at) : '-'}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" asChild><Link to={`/approvals/invoices/${doc.id}`}><Eye className="h-4 w-4" /></Link></Button>
                      {doc.html_url ? <Button variant="ghost" size="icon" asChild><a href={doc.html_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a></Button> : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">لا توجد فواتير متزامنة حتى الآن.</p>
          {canManage ? <Button className="mt-4" onClick={() => void handleSync()} disabled={isSyncing}>مزامنة الآن</Button> : null}
        </div>
      )}
    </MainLayout>
  );
}
