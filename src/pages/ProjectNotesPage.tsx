import React, { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import PublicProjectNotesBoard from '@/components/project/PublicProjectNotesBoard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ARABESQUE_NOTES_ROUTE, ARABESQUE_PROJECT_ID } from '@/config/projectRoutes';

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
  const [shareStatus, setShareStatus] = useState<string | null>(null);

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
                رابط عام للعرض والمتابعة دون تسجيل دخول.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                وصول عام
              </Badge>
              <Button variant="outline" onClick={() => void handleShare()}>
                {typeof navigator !== 'undefined' && navigator.share ? (
                  <Share2 className="ml-2 h-4 w-4" />
                ) : (
                  <Copy className="ml-2 h-4 w-4" />
                )}
                مشاركة الرابط
              </Button>
            </div>
          </CardHeader>
          {shareStatus && (
            <CardContent className="pt-0 text-sm text-muted-foreground" aria-live="polite">
              {shareStatus}
            </CardContent>
          )}
        </Card>

        <PublicProjectNotesBoard projectId={ARABESQUE_PROJECT_ID} />
      </div>
    </PageLayout>
  );
};

export default ProjectNotesPage;
