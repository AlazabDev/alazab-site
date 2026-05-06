
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { Project } from "@/types/project";

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file_url: string;
  uploaded_at: string;
  project_id: string;
}

export const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const { toast } = useToast();

  const fetchProjectDetails = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      // تحويل البيانات لتتوافق مع نوع Project
      const projectData: Project = {
        id: data.id,
        name: data.name || 'مشروع غير مسمى',
        description: data.description || null,
        status: data.status || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        created_at: data.created_at || null,
        progress: data.progress || null,
        client_name: data.company_name || null,
        budget: data.budget || null,
        model3d_url: null,
        area: null,
        assigned_to: null,
        category: null,
        engineer_name: null,
        image: data.cover_image_url || null,
        location: data.location || null,
        notes: null,
        order_number: null,
        project_number: null,
        tags: null,
        work_type: null
      };
      
      setProject(projectData);
    } catch (error) {
      console.error("Error fetching project details:", error);
      toast({
        variant: "destructive",
        title: "خطأ في جلب بيانات المشروع",
        description: "حدث خطأ أثناء محاولة استرداد بيانات المشروع"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectFiles = async () => {
    if (!projectId) return;
    
    try {
      setLoadingFiles(true);
      // TODO: Implement project files when project_files table is created
      setFiles([]);
    } catch (error) {
      console.error("Error fetching project files:", error);
      toast({
        variant: "destructive",
        title: "خطأ في جلب ملفات المشروع",
        description: "حدث خطأ أثناء محاولة استرداد ملفات المشروع"
      });
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleDownloadFile = (file: ProjectFile) => {
    try {
      // Create a link element
      const link = document.createElement("a");
      link.href = file.file_url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "جاري التنزيل",
        description: `جاري تنزيل الملف: ${file.name}`
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تنزيل الملف",
        description: "حدث خطأ أثناء محاولة تنزيل الملف"
      });
      
      // Fallback: open in new tab
      window.open(file.file_url, '_blank');
    }
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    try {
      // TODO: Implement file deletion when project_files table is created
      setFiles(files.filter(f => f.id !== file.id));
      toast({
        title: "تم حذف الملف",
        description: `تم حذف الملف: ${file.name}`
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        variant: "destructive",
        title: "خطأ في حذف الملف",
        description: "حدث خطأ أثناء محاولة حذف الملف"
      });
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
      fetchProjectFiles();
    }
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    project,
    loading,
    files,
    loadingFiles,
    fetchProjectDetails,
    fetchProjectFiles,
    handleDownloadFile,
    handleDeleteFile
  };
};
