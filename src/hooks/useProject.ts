import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { Project } from '@/types/project';

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file_url: string;
  uploaded_at: string;
  project_id: string;
  bucket_id: string;
  object_path: string;
}

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { toast } = useToast();

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (error) throw error;
      setProject({
        id: data.id,
        name: data.name || 'مشروع غير مسمى',
        description: data.description || null,
        status: data.status || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        created_at: data.created_at || null,
        progress: data.progress || null,
        client_name: data.client_name || data.company_name || null,
        budget: data.budget || null,
        model3d_url: data.model_3d_url || null,
        area: data.area_sqm || null,
        assigned_to: null,
        category: data.category || null,
        engineer_name: null,
        image: data.cover_image_url || null,
        location: data.location || null,
        notes: null,
        order_number: null,
        project_number: null,
        tags: null,
        work_type: null,
      });
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({ variant: 'destructive', title: 'خطأ في جلب بيانات المشروع', description: 'تعذر استرداد بيانات المشروع' });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const fetchProjectFiles = useCallback(async () => {
    if (!projectId) return;
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase
        .from('project_files')
        .select('id,project_id,name,file_size,mime_type,bucket_id,object_path,created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const resolved = await Promise.all((data || []).map(async (row) => {
        const { data: signed, error: signedError } = await supabase.storage.from(row.bucket_id).createSignedUrl(row.object_path, 3600);
        if (signedError) throw signedError;
        return {
          id: row.id,
          name: row.name,
          size: Number(row.file_size || 0),
          type: row.mime_type || 'application/octet-stream',
          file_url: signed.signedUrl,
          uploaded_at: row.created_at,
          project_id: row.project_id,
          bucket_id: row.bucket_id,
          object_path: row.object_path,
        } satisfies ProjectFile;
      }));
      setFiles(resolved);
    } catch (error) {
      console.error('Error fetching project files:', error);
      setFiles([]);
      toast({ variant: 'destructive', title: 'خطأ في جلب ملفات المشروع', description: 'تعذر استرداد ملفات المشروع' });
    } finally {
      setLoadingFiles(false);
    }
  }, [projectId, toast]);

  const handleDownloadFile = (file: ProjectFile) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    try {
      const { error: storageError } = await supabase.storage.from(file.bucket_id).remove([file.object_path]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('project_files').delete().eq('id', file.id);
      if (dbError) throw dbError;
      setFiles((current) => current.filter((item) => item.id !== file.id));
      toast({ title: 'تم حذف الملف', description: file.name });
    } catch (error) {
      console.error('Error deleting project file:', error);
      toast({ variant: 'destructive', title: 'تعذر حذف الملف', description: error instanceof Error ? error.message : 'خطأ غير معروف' });
    }
  };

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    void fetchProjectDetails();
    void fetchProjectFiles();
  }, [fetchProjectDetails, fetchProjectFiles, projectId]);

  return { project, loading, files, loadingFiles, fetchProjectDetails, fetchProjectFiles, handleDownloadFile, handleDeleteFile };
};
