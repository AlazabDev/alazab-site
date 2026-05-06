
import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import QuickFormHeader from './quick/QuickFormHeader';
import QuickFormFields from './quick/QuickFormFields';
import { useQuickFormData } from './quick/useQuickFormData';
import { useQuickFormSubmit } from './quick/useQuickFormSubmit';

const QuickRequestForm: React.FC = () => {
  const {
    isLoading,
    branches,
    serviceTypes,
    formData,
    handleChange,
    handleSelectChange,
    handleFileChange,
    resetForm
  } = useQuickFormData();

  const { isSubmitting, submitForm } = useQuickFormSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('QuickRequestForm: بدء إرسال النموذج', formData);
    await submitForm(formData, resetForm);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="h-8 w-8 animate-spin text-construction-primary" />
        <span className="mr-2">جاري تحميل البيانات...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <QuickFormHeader />
      
      <QuickFormFields
        formData={formData}
        branches={branches}
        serviceTypes={serviceTypes}
        onFormChange={handleChange}
        onSelectChange={handleSelectChange}
        onFileChange={handleFileChange}
      />

      <div className="pt-4">
        <Button 
          type="submit" 
          className="w-full bg-construction-primary hover:bg-construction-primary/90"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            "إرسال الطلب السريع"
          )}
        </Button>
      </div>
    </form>
  );
};

export default QuickRequestForm;
