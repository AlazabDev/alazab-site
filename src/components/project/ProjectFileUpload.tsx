import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileType, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProjectFileUploadProps {
  projectId: string;
  onFileUploaded?: () => void;
}

const ProjectFileUpload: React.FC<ProjectFileUploadProps> = ({ projectId, onFileUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string =>
    bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(2)} KB` : `${(bytes / 1048576).toFixed(2)} MB`;

  const handleUpload = async (): Promise<void> => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^\p{L}\p{N}._-]+/gu, '-');
        const objectPath = `${projectId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(objectPath, file, { contentType: file.type || 'application/octet-stream', upsert: false });
        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from('project_files').insert({
          project_id: projectId,
          name: file.name,
          file_size: file.size,
          mime_type: file.type || null,
          bucket_id: 'project-files',
          object_path: objectPath,
        });

        if (dbError) {
          await supabase.storage.from('project-files').remove([objectPath]);
          throw dbError;
        }
        successCount += 1;
      }

      toast({ title: 'تم رفع الملفات', description: `تم رفع ${successCount} ملف فعليًا إلى مخزن المشروع.` });
      setFiles(null);
      const input = document.getElementById('file-upload') as HTMLInputElement | null;
      if (input) input.value = '';
      onFileUploaded?.();
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'حدث خطأ أثناء رفع الملفات';
      setError(message);
      toast({ title: 'تعذر رفع الملفات', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <Upload className="mx-auto mb-2 h-10 w-10 text-gray-400" />
        <p className="mb-2 text-sm font-medium">اختر ملفات المشروع</p>
        <p className="mb-4 text-xs text-gray-500">تُحفظ الملفات في مخزن خاص ويُنشأ رابط مؤقت عند العرض.</p>
        <Input type="file" className="hidden" id="file-upload" multiple onChange={(e) => { setFiles(e.target.files); setError(null); }} disabled={uploading} />
        <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()} disabled={uploading}>اختر ملفات</Button>
        {files?.length ? (
          <ul className="mt-4 space-y-1 text-sm text-gray-600">
            {Array.from(files).slice(0, 5).map((file) => <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-center gap-2"><FileType className="h-4 w-4" /><span className="max-w-72 truncate">{file.name}</span><span className="text-xs">({formatFileSize(file.size)})</span></li>)}
            {files.length > 5 && <li className="text-xs">و{files.length - 5} ملفات أخرى...</li>}
          </ul>
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button onClick={() => void handleUpload()} disabled={!files?.length || uploading} className="bg-construction-primary hover:bg-construction-dark">
          {uploading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {uploading ? 'جارٍ الرفع...' : 'رفع الملفات'}
        </Button>
      </div>
    </div>
  );
};

export default ProjectFileUpload;
