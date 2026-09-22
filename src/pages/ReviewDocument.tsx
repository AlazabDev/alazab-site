import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle, Clock, FileText, Loader2, User, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/review/PDFViewer';
import { SignaturePanel } from '@/components/review/SignaturePanel';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReviewView {
  document: {
    id: string;
    number: string;
    title: string | null;
    description: string | null;
    type: string;
    clientName: string;
    total: number;
    currency: string;
    date: string;
    status: string;
    createdAt: string;
    fileUrl: string | null;
  };
  reviewer: {
    id: string;
    name: string;
    department: string;
    status: string;
    signedAt: string | null;
    rejectionReason: string | null;
  };
  reviewers: Array<{
    id: string;
    name: string;
    department: string;
    status: string;
    signedAt: string | null;
  }>;
}

const departmentLabels: Record<string, string> = {
  engineering: 'الهندسة',
  procurement: 'المشتريات',
  accounting: 'الحسابات',
  management: 'الإدارة',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  pending: 'في انتظار المراجعة',
  approved: 'تم الاعتماد',
  rejected: 'مرفوض',
};

const statusClasses: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusIcon = (status: string) => {
  if (status === 'approved') return <CheckCircle className="h-4 w-4" />;
  if (status === 'rejected') return <XCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
};

export default function ReviewDocument() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();

  const [view, setView] = useState<ReviewView | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const invoke = useCallback(async (action: 'get' | 'approve' | 'reject', extra: Record<string, unknown> = {}) => {
    if (!id || !token) throw new Error('INVALID_REVIEW_LINK');
    const { data, error: invokeError } = await supabase.functions.invoke('review-access', {
      body: { action, documentId: id, token, ...extra },
    });
    if (invokeError) throw invokeError;
    if (!data?.success) throw new Error(data?.error || 'REVIEW_REQUEST_FAILED');
    return data as ReviewView & { success: true };
  }, [id, token]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id || !token) {
        setError('رابط المراجعة غير مكتمل.');
        setLoading(false);
        return;
      }

      try {
        const data = await invoke('get');
        if (active) setView(data);
      } catch (loadError) {
        console.error('[review] access failed', loadError);
        if (!active) return;
        const message = loadError instanceof Error ? loadError.message : '';
        setError(
          message.includes('TOKEN_EXPIRED')
            ? 'انتهت صلاحية رابط المراجعة. اطلب رابطًا جديدًا من مرسل المستند.'
            : 'رابط المراجعة غير صالح أو لم يعد متاحًا.',
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [id, invoke, token]);

  const handleApprove = async (signatureData: string) => {
    setSubmitting(true);
    try {
      const data = await invoke('approve', { signatureData });
      setView(data);
      toast({ title: 'تم الاعتماد', description: 'تم حفظ قرارك وتوقيعك بنجاح.' });
    } catch (approveError) {
      console.error('[review] approve failed', approveError);
      toast({
        title: 'تعذر الاعتماد',
        description: approveError instanceof Error ? approveError.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      toast({ title: 'اكتب سبب الرفض', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await invoke('reject', { reason });
      setView(data);
      setShowRejectDialog(false);
      setRejectReason('');
      toast({ title: 'تم تسجيل الرفض', description: 'تم إرسال قرارك إلى نظام الاعتماد.' });
    } catch (rejectError) {
      console.error('[review] reject failed', rejectError);
      toast({
        title: 'تعذر تسجيل الرفض',
        description: rejectError instanceof Error ? rejectError.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <Skeleton className="mb-6 h-12 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-[650px] lg:col-span-2" />
            <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !view) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-10 text-center">
            <AlertCircle className="mx-auto mb-4 h-14 w-14 text-destructive" />
            <h1 className="mb-2 text-xl font-bold">تعذر فتح المراجعة</h1>
            <p className="text-muted-foreground">{error || 'الرابط غير متاح.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { document, reviewer, reviewers } = view;
  const completed = reviewer.status !== 'pending';

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-xl">{document.title || `مستند #${document.number}`}</h1>
            <p className="text-sm text-muted-foreground">مراجعة واعتماد مستند — العزب</p>
          </div>
          <Badge className={statusClasses[reviewer.status] || ''}>
            {statusIcon(reviewer.status)}
            <span className="me-1">{statusLabels[reviewer.status] || reviewer.status}</span>
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="h-[72vh] min-h-[520px] overflow-hidden lg:col-span-2">
            {document.fileUrl ? (
              <PDFViewer
                fileUrl={document.fileUrl}
                documentId={document.id}
                readOnly
                onAddComment={() => undefined}
              />
            ) : (
              <CardContent className="flex h-full items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto mb-4 h-14 w-14 opacity-50" />
                  <p>لا يوجد ملف متاح للعرض.</p>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="text-base">بيانات المراجعة</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{reviewer.name}</span></div>
                <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>{departmentLabels[reviewer.department] || reviewer.department}</span></div>
                <div className="border-t pt-3">
                  <p className="font-medium">{document.clientName}</p>
                  <p className="mt-1 text-muted-foreground">{document.description || 'بدون وصف إضافي'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">حالة المراجعين</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {reviewers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{departmentLabels[item.department] || item.department}</p>
                    </div>
                    <Badge className={statusClasses[item.status] || ''}>{statusIcon(item.status)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {!completed ? (
              <>
                <SignaturePanel onSign={(signature) => void handleApprove(signature)} disabled={submitting} />
                <Button variant="destructive" className="w-full" onClick={() => setShowRejectDialog(true)} disabled={submitting}>
                  <XCircle className="me-2 h-4 w-4" />رفض المستند
                </Button>
              </>
            ) : (
              <Card>
                <CardContent className="p-5 text-center">
                  {reviewer.status === 'approved' ? <CheckCircle className="mx-auto mb-3 h-10 w-10 text-green-600" /> : <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />}
                  <p className="font-bold">{statusLabels[reviewer.status]}</p>
                  {reviewer.rejectionReason ? <p className="mt-2 text-sm text-muted-foreground">{reviewer.rejectionReason}</p> : null}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>سبب الرفض</DialogTitle></DialogHeader>
          <Textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={5} maxLength={2000} placeholder="وضح سبب الرفض أو التعديل المطلوب..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={submitting}>إلغاء</Button>
            <Button variant="destructive" onClick={() => void handleReject()} disabled={submitting || rejectReason.trim().length < 3}>
              {submitting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
