
import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface SubmissionStepProps {
  requestNumber: string;
  onTrackRequest?: () => void;
}

const SubmissionStep: React.FC<SubmissionStepProps> = ({ requestNumber, onTrackRequest }) => {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلب الصيانة بنجاح</h2>
      <p className="text-gray-600 mb-6">
        شكراً لك! تم استلام طلب الصيانة الخاص بك وسيتم التواصل معك قريباً.
      </p>

      <div className="bg-gray-50 p-4 mb-8 max-w-xs mx-auto rounded-lg">
        <p className="text-sm text-gray-500">رقم الطلب</p>
        <p className="text-xl font-bold text-gray-900">{requestNumber}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Button 
          variant="outline" 
          className="flex items-center justify-center" 
          onClick={onTrackRequest}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          متابعة الطلب
        </Button>
        
        <Link to="/">
          <Button className="bg-construction-primary text-white flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SubmissionStep;
