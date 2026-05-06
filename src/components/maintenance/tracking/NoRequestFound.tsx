
import React from 'react';

interface NoRequestFoundProps {
  requestNumber: string;
}

const NoRequestFound: React.FC<NoRequestFoundProps> = ({ requestNumber }) => {
  return (
    <div className="py-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">لم يتم العثور على الطلب</h3>
      <p className="text-gray-600 mb-4">
        لم نتمكن من العثور على طلب بالرقم <span className="font-semibold">{requestNumber}</span>
      </p>
      <p className="text-gray-500 text-sm">يرجى التأكد من رقم الطلب والمحاولة مرة أخرى</p>
    </div>
  );
};

export default NoRequestFound;
