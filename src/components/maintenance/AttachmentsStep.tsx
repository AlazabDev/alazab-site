
import React, { useRef, useState } from 'react';
import { MaintenanceRequest } from '@/types/maintenance';
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';

interface AttachmentsStepProps {
  formData: MaintenanceRequest;
  updateAttachments: (files: File[]) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const MAX_FILES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const AttachmentsStep: React.FC<AttachmentsStepProps> = ({ formData, updateAttachments, nextStep, prevStep }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    if (formData.attachments.length + files.length > MAX_FILES) {
      toast({
        title: "خطأ",
        description: `يمكنك رفع ${MAX_FILES} ملفات كحد أقصى`,
        variant: "destructive"
      });
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: "نوع ملف غير مدعوم",
          description: `الملف ${file.name} ليس بصيغة مدعومة. الصيغ المدعومة هي JPG و PNG و PDF`,
          variant: "destructive"
        });
        return false;
      }
      
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "حجم الملف كبير جداً",
          description: `الملف ${file.name} أكبر من 5 ميجابايت`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      updateAttachments([...formData.attachments, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    updateAttachments(newAttachments);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div className="border-r-4 border-construction-primary pr-3">
        <h2 className="text-2xl font-bold">المرفقات</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600">إضافة صور أو ملفات</p>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center ${dragOver ? 'border-construction-primary bg-construction-primary/5' : 'border-gray-300'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p className="text-lg">اسحب الملفات هنا أو انقر للاختيار</p>
            <p className="text-sm text-gray-500 mt-2">
              يمكنك رفع ملفات بصيغة JPG, PNG, PDF (الحد الأقصى 5 ملفات)
            </p>
          </div>
        </div>
        
        {formData.attachments.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold">الملفات المرفقة ({formData.attachments.length}/{MAX_FILES})</h3>
            <ul className="space-y-2">
              {formData.attachments.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center">
                    {file.type.includes('image') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-3">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-3">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    )}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} كيلوبايت</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg>
          السابق
        </Button>
        
        <Button
          onClick={nextStep}
          className="bg-construction-primary text-white flex items-center"
        >
          التالي
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m15 18-6-6 6-6"></path></svg>
        </Button>
      </div>
    </div>
  );
};

export default AttachmentsStep;
