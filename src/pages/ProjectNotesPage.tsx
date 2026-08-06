import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Copy, Loader2, RefreshCw, Share2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import ProjectNotesTab from '@/components/project/ProjectNotesTab';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ARABESQUE_NOTES_ROUTE, ARABESQUE_PROJECT_ID } from '@/config/projectRoutes';
import { fetchProjectNoteRole } from '@/lib/projectNotes';
import type { ProjectNoteMemberRole } from '@/types/projectNotes';
import { projectNoteRoleLabels } from '@/types/projectNotes';

const copyText = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  textarea.remove();
};

const ProjectNotesPage: React.FC = () => {
  const [role, setRole] = useState<ProjectNoteMemberRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadAccess = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextRole = await fetchProjectNoteRole(ARABESQUE_PROJECT_ID);
      if (requestId !== requestIdRef.current) return;
      setRole(nextRole);
    } catch (accessError) {
      if (requestId !== requestIdRef.current) return;
      setRole(null);
      setError(
        accessError instanceof Error
          ? accessError.message
          : 'تعذر التحقق من صلاحية الوصول إلى ملاحظات المشروع',
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAccess();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadAccess]);

  const handleShare = async (): Promise<void> => {
    const url = `${window.location.origin}${ARABESQUE_NOTES_ROUTE}`;
    setShareStatus(null);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'ملاحظات تنفيذ مشروع اربيسك',
          text: 'متابعة ملاحظات تنفيذ مشروع اربيسك',
          url,
        });
        return;
      }

      await copyText(url);
      setShareStatus('تم نسخ الرابط');
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
      setShareStatus('تعذر نسخ الرابط');
    }
  };

  return (
    <PageLayout title="ملاحظات تنفيذ مشروع اربيسك">
      <div className="mx-auto w-full max-w-7xl space-y-5 overflow-x-hidden" dir="rtl">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>لوحة ملاحظات التنفيذ</CardTitle>
              <CardDescription className="mt-1">
                المسار المعتمد للمشاركة والمتابعة: {ARABESQUE_NOTES_ROUTE}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {role && <Badge variant="outline">صلاحيتك: {projectNoteRoleLabels[role]}</Badge>}
              <Button variant="outline" onClick={() => void handleShare()}>
                {navigator.share ? (
                  <Share2 className="ml-2 h-4 w-4" />
                ) : (
                  <Copy className="ml-2 h-4 w-4" />
                )}
                مشاركة الرابط
              </Button>
              <Button variant="outline" asChild>
                <Link to="/project-management">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  إدارة المشاريع
                </Link>
              </Button>
            </div>
          </CardHeader>
          {shareStatus && (
            <CardContent className="pt-0 text-sm text-muted-foreground" aria-live="polite">
              {shareStatus}
            </CardContent>
          )}
        </Card>

        {loading ? (
          <Card>
            <CardContent className="flex min-h-64 items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-construction-primary" />
              <span>جارٍ التحقق من الحساب وتحميل صلاحية المشروع...</span>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="h-5 w-5" />
                تعذر فتح ملاحظات المشروع
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void loadAccess()}>
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        ) : !role ? (
          <Card className="border-amber-300 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="h-5 w-5" />
                الحساب الحالي غير مضاف إلى المشروع
              </CardTitle>
              <CardDescription className="text-amber-900/80">
                سجّل الدخول بالحساب الذي تمت مشاركته داخل المشروع، أو اطلب من مالك المشروع إضافة حسابك.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => void loadAccess()}>
                <RefreshCw className="ml-2 h-4 w-4" />
                التحقق مرة أخرى
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ProjectNotesTab projectId={ARABESQUE_PROJECT_ID} />
        )}
      </div>
    </PageLayout>
  );
};

export default ProjectNotesPage;
