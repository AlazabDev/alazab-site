import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Database, FileCheck, HardDrive, Loader2, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useApprovalAccess, APPROVAL_ROLE_LABELS } from '@/hooks/useApprovalAccess';

interface CheckState {
  ok: boolean;
  label: string;
  detail: string;
}

interface ReportState {
  documents: number;
  activeMembers: number;
  pendingReviewers: number;
  latestSync: { status: string; started_at: string; synced_count: number; error_count: number } | null;
  checks: CheckState[];
}

export default function SystemReport() {
  const { role } = useApprovalAccess();
  const [report, setReport] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);

    const checks: CheckState[] = [];

    const [
      documentsResult,
      membersResult,
      reviewersResult,
      syncResult,
      storageResult,
      apiResult,
    ] = await Promise.all([
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('approval_memberships').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('document_reviewers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('document_sync_logs').select('status,started_at,synced_count,error_count').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.storage.from('approval-documents').list('', { limit: 1 }),
      supabase.functions.invoke('approval-members', { body: { action: 'list' } }),
    ]);

    checks.push({
      ok: !documentsResult.error,
      label: 'قاعدة بيانات الاعتماد',
      detail: documentsResult.error ? documentsResult.error.message : 'الاتصال بجدول المستندات يعمل.',
    });
    checks.push({
      ok: !storageResult.error,
      label: 'مخزن المستندات الخاص',
      detail: storageResult.error ? storageResult.error.message : 'الوصول إلى approval-documents يعمل عبر الصلاحيات الحالية.',
    });
    checks.push({
      ok: !apiResult.error && apiResult.data?.success === true,
      label: 'بوابة إدارة الصلاحيات',
      detail: apiResult.error?.message || apiResult.data?.error || 'Edge Function تعمل ومحمية بالمصادقة.',
    });

    if (syncResult.error) {
      checks.push({ ok: false, label: 'سجل مزامنة دفترة', detail: syncResult.error.message });
    } else {
      checks.push({
        ok: syncResult.data?.status !== 'error',
        label: 'آخر مزامنة دفترة',
        detail: syncResult.data
          ? `${new Date(syncResult.data.started_at).toLocaleString('ar-EG')} — ${syncResult.data.status}`
          : 'لم تُشغل المزامنة بعد.',
      });
    }

    setReport({
      documents: documentsResult.count || 0,
      activeMembers: membersResult.count || 0,
      pendingReviewers: reviewersResult.count || 0,
      latestSync: syncResult.data || null,
      checks,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return (
    <MainLayout title="تقرير نظام الاعتماد" subtitle="فحص مباشر لمكونات النظام المتصلة بالإنتاج">
      <div className="mb-6 flex justify-end">
        <Button variant="outline" onClick={() => void loadReport()} disabled={loading}>
          {loading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <RefreshCw className="me-2 h-4 w-4" />}
          إعادة الفحص
        </Button>
      </div>

      {loading && !report ? (
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : report ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="flex items-center gap-3 p-4"><FileCheck className="h-6 w-6 text-primary" /><div><p className="text-sm text-muted-foreground">المستندات</p><p className="text-2xl font-bold">{report.documents}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><Users className="h-6 w-6 text-blue-600" /><div><p className="text-sm text-muted-foreground">الأعضاء النشطون</p><p className="text-2xl font-bold">{report.activeMembers}</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="h-6 w-6 text-amber-600" /><div><p className="text-sm text-muted-foreground">مراجعات معلقة</p><p className="text-2xl font-bold">{report.pendingReviewers}</p></div></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">صلاحيتك</p><p className="mt-1 font-bold">{role ? APPROVAL_ROLE_LABELS[role] : '-'}</p></CardContent></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {report.checks.map((check) => (
              <Card key={check.label}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className={`rounded-full p-2 ${check.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {check.ok ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{check.label}</p>
                      <Badge className={check.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{check.ok ? 'يعمل' : 'يحتاج مراجعة'}</Badge>
                    </div>
                    <p className="mt-2 break-words text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />ملاحظة تشغيلية</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm"><HardDrive className="h-4 w-4 text-muted-foreground" /><span>مخزن المستندات Private ويُعرض عبر روابط مؤقتة فقط.</span></div>
              <div className="flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4 text-muted-foreground" /><span>صلاحيات الإدارة والمراجعة منفصلة عن المصادقة العامة للموقع.</span></div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </MainLayout>
  );
}
