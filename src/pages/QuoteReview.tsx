import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  RefreshCw,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { invokeDocumentAction } from '@/hooks/useDocuments';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision_requested';

interface QuoteItem {
  id: string;
  product_name: string;
  product_description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  approval_status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
}

interface QuoteDocument {
  id: string;
  number: string;
  client_name: string;
  client_email: string | null;
  total: number;
  currency: string;
  date: string;
  status: string;
  pdf_url: string | null;
}

export default function QuoteReview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<QuoteDocument | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchQuoteData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [{ data: docData, error: docError }, { data: itemsData, error: itemsError }] = await Promise.all([
        supabase.from('documents').select('id,number,client_name,client_email,total,currency,date,status,pdf_url').eq('id', id).maybeSingle(),
        supabase.from('quote_items').select('*').eq('document_id', id).order('created_at', { ascending: true }),
      ]);

      if (docError) throw docError;
      if (itemsError) throw itemsError;
      if (!docData) throw new Error('QUOTE_NOT_FOUND');

      setDocument(docData as QuoteDocument);
      setItems((itemsData || []).map((item) => ({
        ...item,
        approval_status: (item.approval_status || 'pending') as ApprovalStatus,
      })) as QuoteItem[]);
    } catch (error) {
      console.error('[approvals] quote load failed', error);
      toast.error('فشل تحميل بيانات عرض السعر');
      setDocument(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchQuoteData();
  }, [fetchQuoteData]);

  const updateItem = async (itemId: string, status: ApprovalStatus, reason?: string) => {
    if (!id) return;
    setActionLoading(itemId);
    try {
      await invokeDocumentAction({
        action: 'update_quote_item',
        documentId: id,
        quoteItemId: itemId,
        quoteItemStatus: status,
        reason,
      });
      await fetchQuoteData();
      toast.success(status === 'approved' ? 'تم اعتماد العنصر' : 'تم تسجيل قرار العنصر');
    } catch (error) {
      console.error('[approvals] quote item action failed', error);
      toast.error(error instanceof Error ? error.message : 'تعذر تنفيذ الإجراء');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedItemId || rejectionReason.trim().length < 3) return;
    await updateItem(selectedItemId, 'rejected', rejectionReason.trim());
    setRejectDialogOpen(false);
    setSelectedItemId(null);
    setRejectionReason('');
  };

  const handleApproveAll = async () => {
    if (!id) return;
    const pending = items.filter((item) => item.approval_status === 'pending').length;
    if (!pending) {
      toast.info('لا توجد عناصر معلقة');
      return;
    }

    setActionLoading('all');
    try {
      await invokeDocumentAction({ action: 'approve_quote_items', documentId: id });
      await fetchQuoteData();
      toast.success(`تم اعتماد ${pending} عنصر`);
    } catch (error) {
      console.error('[approvals] bulk quote approval failed', error);
      toast.error(error instanceof Error ? error.message : 'تعذر اعتماد العناصر');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    if (status === 'approved') return <Badge className="bg-green-500/20 text-green-700"><CheckCircle2 className="me-1 h-3 w-3" />معتمد</Badge>;
    if (status === 'rejected') return <Badge className="bg-red-500/20 text-red-700"><XCircle className="me-1 h-3 w-3" />مرفوض</Badge>;
    if (status === 'revision_requested') return <Badge className="bg-orange-500/20 text-orange-700"><MessageSquare className="me-1 h-3 w-3" />يحتاج مراجعة</Badge>;
    return <Badge className="bg-yellow-500/20 text-yellow-700"><Clock className="me-1 h-3 w-3" />معلق</Badge>;
  };

  const stats = {
    total: items.length,
    approved: items.filter((item) => item.approval_status === 'approved').length,
    rejected: items.filter((item) => item.approval_status === 'rejected').length,
    pending: items.filter((item) => item.approval_status === 'pending').length,
  };

  const formatCurrency = (amount: number, currency = 'EGP') =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency }).format(amount);

  if (loading) {
    return <MainLayout title="مراجعة عرض السعر"><div className="flex min-h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  if (!document) {
    return (
      <MainLayout title="عرض السعر غير موجود">
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-4 h-14 w-14 text-muted-foreground" />
          <Button onClick={() => navigate('/approvals/quotes')}>العودة لعروض الأسعار</Button>
        </div>
      </MainLayout>
    );
  }

  const progress = stats.total ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <MainLayout title="مراجعة عرض السعر" subtitle={`${document.number} • ${document.client_name}`}>
      <Button variant="ghost" className="mb-5" onClick={() => navigate('/approvals/quotes')}>
        <ArrowRight className="me-2 h-4 w-4" />العودة
      </Button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {document.pdf_url ? (
            <Button variant="outline" asChild><a href={document.pdf_url} target="_blank" rel="noopener noreferrer"><FileText className="me-2 h-4 w-4" />عرض PDF</a></Button>
          ) : null}
          <Button onClick={() => void handleApproveAll()} disabled={actionLoading === 'all' || stats.pending === 0}>
            {actionLoading === 'all' ? <RefreshCw className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
            اعتماد العناصر المعلقة ({stats.pending})
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card><CardContent className="flex items-center gap-3 p-4"><User className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">العميل</p><p className="text-sm font-medium">{document.client_name}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><Calendar className="h-5 w-5 text-blue-500" /><div><p className="text-xs text-muted-foreground">التاريخ</p><p className="text-sm font-medium">{new Date(document.date).toLocaleDateString('ar-EG')}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><DollarSign className="h-5 w-5 text-green-500" /><div><p className="text-xs text-muted-foreground">الإجمالي</p><p className="text-sm font-medium">{formatCurrency(document.total, document.currency)}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4"><FileText className="h-5 w-5 text-purple-500" /><div><p className="text-xs text-muted-foreground">التقدم</p><p className="text-sm font-medium">{progress}%</p></div></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="mb-2 flex justify-between text-sm"><span>تقدم الاعتماد</span><span>{stats.approved}/{stats.total}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.id} className={item.approval_status === 'approved' ? 'border-green-500/30' : item.approval_status === 'rejected' ? 'border-red-500/30' : ''}>
            <CardContent className="p-4">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.product_name}</h3>{getStatusBadge(item.approval_status)}</div>
                    {item.product_description ? <p className="mt-1 text-sm text-muted-foreground">{item.product_description}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <span>الكمية: <strong>{item.quantity}</strong></span>
                      <span>السعر: <strong>{formatCurrency(item.unit_price, document.currency)}</strong></span>
                      <span>الإجمالي: <strong>{formatCurrency(item.total_price, document.currency)}</strong></span>
                    </div>
                    {item.rejection_reason ? <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">السبب: {item.rejection_reason}</p> : null}
                  </div>
                </div>

                {item.approval_status === 'pending' ? (
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" className="border-red-500 text-red-600" onClick={() => { setSelectedItemId(item.id); setRejectDialogOpen(true); }} disabled={actionLoading === item.id}>
                      <X className="me-1 h-4 w-4" />رفض
                    </Button>
                    <Button size="sm" onClick={() => void updateItem(item.id, 'approved')} disabled={actionLoading === item.id}>
                      {actionLoading === item.id ? <RefreshCw className="me-1 h-4 w-4 animate-spin" /> : <Check className="me-1 h-4 w-4" />}اعتماد
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}

        {!items.length ? <Card><CardContent className="p-10 text-center text-muted-foreground">لا توجد عناصر مرتبطة بعرض السعر.</CardContent></Card> : null}
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>سبب رفض العنصر</DialogTitle></DialogHeader>
          <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={2000} placeholder="اكتب سبب الرفض..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => void handleReject()} disabled={actionLoading !== null || rejectionReason.trim().length < 3}>
              {actionLoading ? <RefreshCw className="me-2 h-4 w-4 animate-spin" /> : null}تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
