
import React, { useState } from 'react';
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { MaintenanceStep, MaintenanceRequest } from '@/types/maintenance';
import { sendEmail } from '@/lib/emailjs';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';

import StepIndicator from '@/components/maintenance/StepIndicator';
import BasicInfoStep from '@/components/maintenance/BasicInfoStep';
import DetailsStep from '@/components/maintenance/DetailsStep';
import AttachmentsStep from '@/components/maintenance/AttachmentsStep';
import ReviewStep from '@/components/maintenance/ReviewStep';
import SubmissionStep from '@/components/maintenance/SubmissionStep';
import QuickRequestForm from '@/components/maintenance/QuickRequestForm';

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<MaintenanceStep>(MaintenanceStep.BASIC_INFO);
  const [formData, setFormData] = useState<MaintenanceRequest>({
    branch: '',
    serviceType: '',
    title: '',
    location: '',
    description: '',
    priority: '',
    requestedDate: '',
    estimatedCost: '',
    attachments: []
  });
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>("standard");

  const updateFormData = (key: string, value: string) => {
    setFormData({
      ...formData,
      [key]: value
    });
  };

  const updateAttachments = (files: File[]) => {
    setFormData({
      ...formData,
      attachments: files
    });
  };

  const nextStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prevStep => prevStep + 1);
  };

  const prevStep = () => {
    window.scrollTo(0, 0);
    setCurrentStep(prevStep => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // إنشاء رقم طلب فريد
      const uniqueId = Date.now().toString().slice(-6);
      const reqNumber = `MR-${uniqueId}`;
      setRequestNumber(reqNumber);

      // Get a default branch_id and company_id from the database
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id, company_id')
        .limit(1)
        .single();

      if (!defaultBranch) {
        throw new Error('لا يوجد فرع افتراضي');
      }

      // تحويل estimatedCost من نص إلى رقم إذا كان موجوداً
      const estimatedCost = formData.estimatedCost
        ? parseFloat(formData.estimatedCost)
        : null;
      
      // حفظ المعلومات في قاعدة البيانات - متوافق مع schema
      const requestData = {
        title: formData.title,
        client_name: 'عميل مجهول',
        service_type: formData.serviceType,
        description: formData.description,
        location: formData.branch,
        priority: formData.priority || 'medium',
        estimated_cost: estimatedCost,
        status: 'Open' as const,
        branch_id: defaultBranch.id,
        company_id: defaultBranch.company_id
      };
        
      const { data: insertedRequest, error: dbError } = await supabase
        .from('maintenance_requests')
        .insert(requestData)
        .select();
        
      if (dbError) {
        console.error('خطأ في حفظ بيانات الطلب:', dbError);
        // في حالة فشل قاعدة البيانات، نستخدم رقم الطلب المولد محلياً
        console.log('استخدام رقم الطلب المحلي:', reqNumber);
      }
      
      const requestId = insertedRequest && insertedRequest[0] ? insertedRequest[0].id : reqNumber;
      
      // رفع المرفقات إلى Supabase Storage (إذا وجدت)
      if (formData.attachments.length > 0) {
        for (const file of formData.attachments) {
          const fileName = `${requestId}-${file.name}`;
          const { error } = await supabase.storage
            .from('maintenance-attachments')
            .upload(fileName, file);
          
          if (error) {
            console.error('خطأ في رفع المرفق:', error);
          }
        }
      }
      
      // إرسال البريد الإلكتروني
      const emailParams = {
        request_number: requestId,
        branch: formData.branch,
        service_type: formData.serviceType,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        requested_date: formData.requestedDate ? new Date(formData.requestedDate).toLocaleDateString('ar-SA') : 'غير محدد',
        estimated_cost: formData.estimatedCost || 'غير محدد',
        attachments_count: formData.attachments.length
      };
      
      try {
        await sendEmail(emailParams);
      } catch (emailError) {
        console.error('خطأ في إرسال البريد الإلكتروني:', emailError);
        // لن نوقف العملية إذا فشل إرسال البريد الإلكتروني
      }
      
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: `تم إنشاء طلب الصيانة برقم ${requestId}`,
        variant: "default",
      });
      
      // انتقال إلى خطوة التأكيد
      setRequestNumber(requestId);
      nextStep();
    } catch (error) {
      console.error('خطأ في إرسال الطلب:', error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إرسال طلبك. الرجاء المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackRequest = () => {
    if (requestNumber) {
      navigate(`/maintenance-tracking?requestNumber=${requestNumber}`);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case MaintenanceStep.BASIC_INFO:
        return (
          <BasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case MaintenanceStep.REQUEST_DETAILS:
        return (
          <DetailsStep
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case MaintenanceStep.ATTACHMENTS:
        return (
          <AttachmentsStep
            formData={formData}
            updateAttachments={updateAttachments}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case MaintenanceStep.REVIEW:
        return (
          <ReviewStep
            formData={formData}
            nextStep={isSubmitting ? () => {} : handleSubmit}
            prevStep={prevStep}
            isSubmitting={isSubmitting}
          />
        );
      case MaintenanceStep.SUBMISSION:
        return (
          <SubmissionStep 
            requestNumber={requestNumber}
            onTrackRequest={handleTrackRequest}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Header />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Wrench size={48} className="text-construction-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">نظام طلبات الصيانة</h1>
              <p className="text-gray-600 mt-2">أدخل بيانات طلب الصيانة الخاص بك</p>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="flex justify-center mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="standard">نموذج تفصيلي</TabsTrigger>
                  <TabsTrigger value="quick">نموذج سريع</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="standard">
                {currentStep !== MaintenanceStep.SUBMISSION && (
                  <StepIndicator currentStep={currentStep} />
                )}
                
                <Card>
                  <CardContent className="pt-6">
                    {renderStep()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="quick">
                <Card>
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-center mb-2">نموذج الطلب السريع</h2>
                      <p className="text-sm text-gray-500 text-center">استخدم هذا النموذج لإرسال طلب صيانة سريع بخطوة واحدة</p>
                    </div>
                    <QuickRequestForm />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MaintenancePage;
