import { useCallback, useState } from 'react';
import { CheckCircle, FileText, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface FileUploaderProps {
  documentId: string;
  onUploadComplete: (fileUrl: string) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export function FileUploader({ documentId, onUploadComplete }: FileUploaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({ title: 'غير مصرح', description: 'يجب أن تكون داخل حسابك لرفع نسخة جديدة.', variant: 'destructive' });
      return;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast({ title: 'نوع ملف غير مدعوم', description: 'يرجى رفع PDF أو Excel فقط.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'الملف كبير', description: 'الحد الأقصى 50 ميجابايت.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setProgress(10);

    const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '-');
    const objectPath = `${documentId}/${user.id}/${crypto.randomUUID()}-${safeName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('approval-documents')
        .upload(objectPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
      if (uploadError) throw uploadError;

      setProgress(55);

      const { data: latest, error: versionLookupError } = await supabase
        .from('document_versions')
        .select('version_number')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (versionLookupError) throw versionLookupError;

      const nextVersion = (latest?.version_number || 0) + 1;

      const { error: versionError } = await supabase.from('document_versions').insert({
        document_id: documentId,
        version_number: nextVersion,
        source: 'revision',
        file_bucket: 'approval-documents',
        file_path: objectPath,
        file_url: null,
        created_by: user.id,
        notes: `رفع نسخة: ${file.name}`,
      });

      if (versionError) {
        await supabase.storage.from('approval-documents').remove([objectPath]);
        throw versionError;
      }

      setProgress(75);

      const { error: documentError } = await supabase
        .from('documents')
        .update({
          file_bucket: 'approval-documents',
          file_path: objectPath,
          file_url: null,
        })
        .eq('id', documentId);

      if (documentError) throw documentError;

      const { data: signed, error: signedError } = await supabase.storage
        .from('approval-documents')
        .createSignedUrl(objectPath, 15 * 60);
      if (signedError) throw signedError;

      setProgress(100);
      onUploadComplete(signed.signedUrl);
      toast({ title: 'تم الرفع', description: `تم حفظ النسخة رقم ${nextVersion} بنجاح.` });
    } catch (error) {
      console.error('[approvals] revision upload failed', error);
      toast({
        title: 'فشل رفع الملف',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 500);
    }
  }, [documentId, onUploadComplete, toast, user]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleUpload(file);
  }, [handleUpload]);

  return (
    <div
      onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
    >
      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <Progress value={progress} className="mx-auto max-w-xs" />
          <p className="text-sm text-muted-foreground">جارٍ رفع النسخة وحفظها...</p>
        </div>
      ) : (
        <>
          <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <h3 className="mb-2 font-bold">اسحب الملف هنا أو اختر ملفًا</h3>
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <FileText className="me-2 h-4 w-4" />
              اختر ملف
              <input
                type="file"
                accept=".pdf,.xlsx,.xls"
                className="hidden"
                onChange={(event) => event.target.files?.[0] && void handleUpload(event.target.files[0])}
              />
            </label>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">PDF أو Excel — حتى 50MB</p>
          {progress === 100 ? <CheckCircle className="mx-auto mt-3 h-5 w-5 text-green-600" /> : null}
        </>
      )}
    </div>
  );
}
