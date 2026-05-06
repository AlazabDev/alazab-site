
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { MaintenanceStep } from '@/types/maintenance';

interface StepIndicatorProps {
  currentStep: MaintenanceStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const stepProgress = ((currentStep - 1) / 4) * 100; // 5 خطوات
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === MaintenanceStep.BASIC_INFO ? 'bg-black text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <span className="text-sm mr-2">المعلومات الأساسية</span>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === MaintenanceStep.REQUEST_DETAILS ? 'bg-black text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <span className="text-sm mr-2">تفاصيل الطلب</span>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === MaintenanceStep.ATTACHMENTS ? 'bg-black text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <span className="text-sm mr-2">المرفقات</span>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === MaintenanceStep.REVIEW ? 'bg-black text-white' : 'bg-gray-200'}`}>
            4
          </div>
          <span className="text-sm mr-2">المراجعة</span>
        </div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === MaintenanceStep.SUBMISSION ? 'bg-black text-white' : 'bg-gray-200'}`}>
            5
          </div>
          <span className="text-sm mr-2">الإرسال</span>
        </div>
      </div>
      <Progress value={stepProgress} className="h-2" />
    </div>
  );
};

export default StepIndicator;
