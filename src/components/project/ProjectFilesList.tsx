
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  File, ExternalLink, Eye, Download, Trash2, 
  FileText, FileImage, FileVideo, FileAudio
} from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file_url: string;
  uploaded_at: string;
}

interface ProjectFilesListProps {
  files: ProjectFile[];
  onDownload: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
}

const ProjectFilesList: React.FC<ProjectFilesListProps> = ({ 
  files, 
  onDownload, 
  onDelete 
}) => {
  const [deleteFile, setDeleteFile] = useState<ProjectFile | null>(null);

  if (files.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="text-gray-400 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-500">لا توجد ملفات مرتبطة بهذا المشروع</p>
        <p className="text-sm text-gray-400 mt-2">يمكنك تحميل الملفات الخاصة بالمشروع من خلال نموذج التحميل أعلاه</p>
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ar-EG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return "تاريخ غير صالح";
    }
  };

  // تحديد نوع الملف لإظهار المحتوى المناسب
  const getFileType = (file: ProjectFile) => {
    if (!file.type) return 'other';
    const lowerType = file.type.toLowerCase();
    if (lowerType.includes('image')) return 'image';
    if (lowerType.includes('pdf')) return 'pdf';
    if (lowerType.includes('video')) return 'video';
    if (lowerType.includes('audio')) return 'audio';
    return 'other';
  };

  // تحديد أيقونة الملف بناءً على نوعه
  const getFileIcon = (file: ProjectFile) => {
    const fileType = getFileType(file);
    switch (fileType) {
      case 'image':
        return <FileImage size={24} className="text-blue-500" />;
      case 'pdf':
        return <FileText size={24} className="text-red-500" />;
      case 'video':
        return <FileVideo size={24} className="text-purple-500" />;
      case 'audio':
        return <FileAudio size={24} className="text-green-500" />;
      default:
        return <File size={24} className="text-gray-500" />;
    }
  };

  // تحديد لون الشارة بناءً على نوع الملف
  const getFileBadgeColor = (file: ProjectFile) => {
    const fileType = getFileType(file);
    switch (fileType) {
      case 'image':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pdf':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'video':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'audio':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // عرض معاينة محتوى الملف داخل التطبيق
  const renderFilePreview = (file: ProjectFile) => {
    const fileType = getFileType(file);
    
    switch (fileType) {
      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={file.file_url} 
              alt={file.name} 
              className="max-w-full max-h-[600px] object-contain rounded-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </div>
        );
      case 'pdf':
        return (
          <iframe 
            src={file.file_url} 
            className="w-full h-[600px] rounded-md border" 
            title={file.name}
          />
        );
      case 'video':
        return (
          <video 
            src={file.file_url} 
            controls 
            className="w-full max-h-[600px] rounded-md"
          />
        );
      case 'audio':
        return (
          <div className="p-8 bg-gray-50 rounded-md flex justify-center">
            <audio 
              src={file.file_url} 
              controls 
              className="w-full"
            />
          </div>
        );
      default:
        return (
          <div className="text-center py-12 bg-gray-50 rounded-md">
            <File size={64} className="mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">لا يمكن عرض محتوى هذا الملف مباشرة</p>
            <p className="text-sm text-gray-500 mb-6">يمكنك تنزيل الملف لفتحه على جهازك</p>
            <div className="flex justify-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => window.open(file.file_url, '_blank')}
              >
                <ExternalLink size={16} className="ml-2" />
                فتح في نافذة جديدة
              </Button>
              <Button 
                onClick={() => onDownload(file)}
              >
                <Download size={16} className="ml-2" />
                تنزيل الملف
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      {files.map(file => (
        <div 
          key={file.id} 
          className="border border-gray-200 rounded-md p-4 flex items-center justify-between bg-white hover:shadow-sm transition-all"
        >
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-md ml-3">
              {getFileIcon(file)}
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">{file.name}</h4>
              <div className="flex flex-wrap gap-2 items-center text-xs">
                <Badge variant="outline" className={getFileBadgeColor(file)}>
                  {getFileType(file) === 'image' ? 'صورة' : 
                   getFileType(file) === 'pdf' ? 'PDF' : 
                   getFileType(file) === 'video' ? 'فيديو' : 
                   getFileType(file) === 'audio' ? 'صوت' : 'ملف'}
                </Badge>
                <span className="text-gray-500">{formatFileSize(file.size)}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">{formatDate(file.uploaded_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <Eye size={16} className="ml-1" />
                  عرض
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{file.name}</DialogTitle>
                  <DialogDescription>
                    <div className="flex flex-wrap justify-between items-center">
                      <div>
                        <span>{formatFileSize(file.size)}</span>
                        <span className="mx-2 text-gray-400">•</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(file.file_url, '_blank')}
                        className="mt-2 sm:mt-0"
                      >
                        <ExternalLink size={16} className="ml-2" />
                        فتح في نافذة جديدة
                      </Button>
                    </div>
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 overflow-auto">
                  {renderFilePreview(file)}
                </div>
                <DialogFooter className="flex justify-between sm:justify-end mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => onDownload(file)}
                  >
                    <Download size={16} className="ml-2" />
                    تنزيل
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600"
              onClick={() => onDownload(file)}
            >
              <Download size={16} className="ml-1" />
              تنزيل
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={16} className="ml-1" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من حذف هذا الملف؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف الملف "{file.name}" نهائياً ولن تتمكن من استعادته. هل تريد المتابعة؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(file)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    نعم، حذف الملف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectFilesList;
