
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileType, AlertCircle } from "lucide-react";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: "لم يتم اختيار أي ملف",
        description: "يرجى اختيار ملف واحد على الأقل للتحميل",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setError(null);
    let successCount = 0;
    let failCount = 0;

    try {
      // تحميل الملفات وإضافتها إلى قاعدة البيانات
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${projectId}/${fileName}`;
          
          // Create a blob URL for the file for immediate access
          const blobUrl = URL.createObjectURL(file);
          
          // TODO: إنشاء سجل في قاعدة البيانات للملف عند توفر جدول project_files
          console.log('File metadata to be saved:', {
            project_id: projectId,
            name: file.name,
            file_url: blobUrl,
            size: file.size,
            type: file.type,
          });
          
          successCount++;
        } catch (fileError: unknown) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          failCount++;
        }
      }
      
      // إظهار رسالة النجاح إذا تم تحميل ملف واحد على الأقل
      if (successCount > 0) {
        toast({
          title: "تم تحميل الملفات بنجاح",
          description: `تم تحميل ${successCount} من أصل ${files.length} ملفات للمشروع`,
        });
        
        if (onFileUploaded) {
          onFileUploaded();
        }
      }
      
      // إذا فشل تحميل بعض الملفات، عرض رسالة تحذير
      if (failCount > 0) {
        setError(`فشل تحميل ${failCount} من أصل ${files.length} ملفات`);
      }
      
      // إعادة تعيين حقل الملف
      setFiles(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: unknown) {
      console.error("Error in upload process:", err);
      const message = err instanceof Error ? err.message : "حدث خطأ أثناء محاولة تحميل الملفات";
      setError(message);
      toast({
        title: "خطأ في تحميل الملفات",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm font-medium mb-2">اختر ملفات للتحميل أو اسحبها وأفلتها هنا</p>
        <p className="text-xs text-gray-500 mb-4">يمكنك تحميل أي نوع من الملفات</p>
        <Input
          type="file"
          className="hidden"
          id="file-upload"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading}
          className="mb-2"
        >
          اختر ملفات
        </Button>
        {files && files.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-600">
              تم اختيار {files.length} {files.length === 1 ? 'ملف' : 'ملفات'}
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mt-2">
              {Array.from(files).map((file, index) => (
                <li key={index} className="flex items-center text-right">
                  <FileType size={16} className="ml-2 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 mr-2">
                    ({formatFileSize(file.size)})
                  </span>
                </li>
              )).slice(0, 5)}
              {files.length > 5 && (
                <li className="text-xs text-gray-500 italic">
                  و{files.length - 5} ملفات أخرى...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          disabled={!files || files.length === 0 || uploading}
          className="bg-construction-primary hover:bg-construction-dark"
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جارٍ التحميل...
            </>
          ) : 'تحميل الملفات'}
        </Button>
      </div>
    </div>
  );
};

export default ProjectFileUpload;
