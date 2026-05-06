
import React from 'react';
import { MaintenanceRequest } from '@/types/maintenance';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReviewStepProps {
  formData: MaintenanceRequest;
  nextStep: () => void;
  prevStep: () => void;
  isSubmitting?: boolean; // Added this property
}

const ReviewStep: React.FC<ReviewStepProps> = ({ formData, nextStep, prevStep, isSubmitting = false }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: ar });
    } catch {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="border-r-4 border-construction-primary pr-3">
        <h2 className="text-2xl font-bold">مراجعة البيانات</h2>
      </div>
      
      <div className="bg-white rounded-lg p-6 border">
        <div className="border-r-4 border-construction-secondary pr-3 mb-4">
          <h3 className="text-xl font-bold">المعلومات الأساسية</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">الفرع:</p>
            <p className="font-medium">{formData.branch}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">نوع الخدمة:</p>
            <p className="font-medium">{formData.serviceType}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">العنوان:</p>
            <p className="font-medium">{formData.title}</p>
          </div>
        </div>
        
        <div className="border-r-4 border-construction-secondary pr-3 mb-4">
          <h3 className="text-xl font-bold">تفاصيل الطلب</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">الوصف:</p>
          <div className="bg-gray-50 p-3 rounded mt-1">
            <p className="whitespace-pre-wrap">{formData.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">الأولوية:</p>
            <p className="font-medium">{formData.priority}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التاريخ المطلوب:</p>
            <p className="font-medium">{formatDate(formData.requestedDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">التكلفة المتوقعة:</p>
            <p className="font-medium">{formData.estimatedCost ? `${formData.estimatedCost} ريال` : 'غير محدد'}</p>
          </div>
        </div>
        
        <div className="border-r-4 border-construction-secondary pr-3 mb-4">
          <h3 className="text-xl font-bold">المرفقات</h3>
        </div>
        
        <div>
          {formData.attachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {formData.attachments.map((file, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md flex items-center">
                  {file.type.includes('image') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} كيلوبايت</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">لا توجد مرفقات</p>
          )}
        </div>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="ml-2">جاري الإرسال...</span>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            </>
          ) : (
            <>
              إرسال الطلب
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
