import React, { useEffect, useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Link2, Loader2, Mail, RefreshCw, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Reviewer {
  id: string;
  reviewer_name: string;
  reviewer_email: string;
  department: string;
  status: string;
  email_sent_at: string | null;
  token_expires_at: string | null;
}

interface ReviewLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

interface LinkState {
  url: string;
  expiresAt: string;
  emailSent: boolean;
  emailError?: string | null;
}

const departmentLabels: Record<string, string> = {
  engineering: 'الهندسة',
  procurement: 'المشتريات',
  accounting: 'الحسابات',
  management: 'الإدارة',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const statusClasses: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const statusIcon = (status: string) => {
  if (status === 'approved') return <CheckCircle className="h-3 w-3" />;
  if (status === 'rejected') return <XCircle className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
};

export function ReviewLinksDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
}: ReviewLinksDialogProps) {
  const { toast } = useToast();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, LinkState>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLinks({});
      setCopiedId(null);
      return;
    }

    let active = true;
    setLoading(true);

    void supabase
      .from('document_reviewers')
      .select('id,reviewer_name,reviewer_email,department,status,email_sent_at,token_expires_at')
      .eq('document_id', documentId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('[approvals] reviewers load failed', error);
          toast({ title: 'تعذر تحميل المراجعين', description: error.message, variant: 'destructive' });
        }
        setReviewers((data || []) as Reviewer[]);
        setLoading(false);
      });

    return () => { active = false; };
  }, [documentId, open, toast]);

  const generateLink = async (reviewer: Reviewer) => {
    setGeneratingId(reviewer.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-review-email', {
        body: { reviewerId: reviewer.id },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'تعذر إنشاء الرابط');

      setLinks((current) => ({
        ...current,
        [reviewer.id]: {
          url: data.reviewLink,
          expiresAt: data.expiresAt,
          emailSent: Boolean(data.emailSent),
          emailError: data.emailError || null,
        },
      }));

      toast({
        title: data.emailSent ? 'تم إنشاء الرابط وإرسال البريد' : 'تم إنشاء رابط المراجعة',
        description: data.emailSent
          ? reviewer.reviewer_email
          : 'البريد لم يُرسل؛ يمكنك نسخ الرابط ومشاركته يدويًا.',
      });
    } catch (error) {
      toast({
        title: 'تعذر إنشاء الرابط',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const copyLink = async (reviewerId: string) => {
    const link = links[reviewerId]?.url;
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiedId(reviewerId);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>روابط مراجعة المستند</DialogTitle>
          <p className="text-sm text-muted-foreground">{documentTitle}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : reviewers.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">لا يوجد مراجعون مرتبطون بهذا المستند.</div>
        ) : (
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pe-1">
            {reviewers.map((reviewer) => {
              const generated = links[reviewer.id];

              return (
                <div key={reviewer.id} className="rounded-xl border p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{reviewer.reviewer_name}</p>
                        <Badge variant="outline">{departmentLabels[reviewer.department] || reviewer.department}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground" dir="ltr">{reviewer.reviewer_email}</p>
                    </div>
                    <Badge className={statusClasses[reviewer.status] || ''}>
                      {statusIcon(reviewer.status)}
                      <span className="me-1">{statusLabels[reviewer.status] || reviewer.status}</span>
                    </Badge>
                  </div>

                  {reviewer.status === 'pending' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void generateLink(reviewer)}
                        disabled={generatingId === reviewer.id}
                      >
                        {generatingId === reviewer.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : reviewer.email_sent_at ? <RefreshCw className="me-2 h-4 w-4" /> : <Link2 className="me-2 h-4 w-4" />}
                        {reviewer.email_sent_at ? 'تجديد الرابط وإعادة الإرسال' : 'إنشاء الرابط وإرسال الدعوة'}
                      </Button>

                      {generated ? (
                        <div className="mt-3 space-y-2">
                          <div className="flex gap-2">
                            <Input value={generated.url} readOnly dir="ltr" className="text-xs" />
                            <Button variant="outline" size="icon" onClick={() => void copyLink(reviewer.id)}>
                              {copiedId === reviewer.id ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => window.open(generated.url, '_blank', 'noopener,noreferrer')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>ينتهي: {new Date(generated.expiresAt).toLocaleString('ar-EG')}</span>
                            <span className={generated.emailSent ? 'text-green-700' : 'text-amber-700'}>
                              <Mail className="me-1 inline h-3 w-3" />
                              {generated.emailSent ? 'تم إرسال البريد' : 'لم يتم إرسال البريد'}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">انتهت مراجعة هذا المستخدم، لذلك لا يتم إصدار رابط جديد له.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          كل عملية إنشاء تُبطل الرابط السابق لهذا المراجع. الرابط الجديد شخصي ومؤقت ولا يُخزن بنصه الصريح في قاعدة البيانات.
        </p>
      </DialogContent>
    </Dialog>
  );
}
