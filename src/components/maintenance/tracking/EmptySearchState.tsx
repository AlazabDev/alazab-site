
import React from 'react';

const EmptySearchState: React.FC = () => {
  return (
    <div className="py-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">ابحث عن طلبك</h3>
      <p className="text-gray-600">أدخل رقم الطلب في الحقل أعلاه للبحث عنه</p>
    </div>
  );
};

export default EmptySearchState;
