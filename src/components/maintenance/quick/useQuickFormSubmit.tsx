
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceRequest } from '@/types/maintenance';
import { sendEmail } from '@/lib/emailjs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

export const useQuickFormSubmit = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitForm = async (formData: MaintenanceRequest, resetForm: () => void) => {
    console.log('useQuickFormSubmit: بدء عملية الإرسال', formData);
    
    if (!formData.branch || !formData.serviceType || !formData.title || !formData.description) {
      console.log('useQuickFormSubmit: بيانات مفقودة', { 
        branch: formData.branch, 
        serviceType: formData.serviceType, 
        title: formData.title, 
        description: formData.description 
      });
      
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('useQuickFormSubmit: بدء الحفظ في قاعدة البيانات');

      // Get a default branch_id and company_id from the database
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id, company_id')
        .limit(1)
        .single();

      if (!defaultBranch) {
        throw new Error('لا يوجد فرع افتراضي');
      }

      const estimatedCost = formData.estimatedCost
        ? parseFloat(formData.estimatedCost)
        : null;
      
      // إنشاء كائن البيانات المتوافق مع schema الحالي
      const requestData = {
        title: formData.title,
        client_name: 'عميل سريع',
        service_type: formData.serviceType,
        description: formData.description,
        location: formData.branch,
        priority: formData.priority,
        estimated_cost: estimatedCost,
        status: 'Open' as const,
        branch_id: defaultBranch.id,
        company_id: defaultBranch.company_id
      };

      console.log('useQuickFormSubmit: بيانات الطلب المرسل', requestData);
        
      const { data: insertedRequest, error: dbError } = await supabase
        .from('maintenance_requests')
        .insert(requestData)
        .select();
        
      if (dbError) {
        console.error('useQuickFormSubmit: خطأ في حفظ بيانات الطلب:', dbError);
        throw new Error('فشل في حفظ الطلب');
      }
      
      console.log('useQuickFormSubmit: تم حفظ الطلب بنجاح', insertedRequest);
      
      const requestId = insertedRequest && insertedRequest[0] ? insertedRequest[0].id : '';
      
      // Note: Attachments functionality is not available as the table doesn't exist
      if (formData.attachments.length > 0) {
        console.log('useQuickFormSubmit: المرفقات غير مدعومة حالياً');
      }
      
      // إرسال البريد الإلكتروني
      const emailParams = {
        request_number: requestId,
        branch: formData.branch,
        service_type: formData.serviceType,
        title: formData.title,
        description: formData.description,
        priority: formData.priority === 'low' ? 'منخفضة' : 
                  formData.priority === 'medium' ? 'متوسطة' : 
                  formData.priority === 'high' ? 'عالية' : 'حرجة',
        requested_date: new Date(formData.requestedDate).toLocaleDateString('ar-SA'),
        estimated_cost: formData.estimatedCost || 'غير محدد',
        attachments_count: formData.attachments.length
      };
      
      try {
        console.log('useQuickFormSubmit: بدء إرسال البريد الإلكتروني');
        await sendEmail(emailParams);
        console.log('useQuickFormSubmit: تم إرسال البريد الإلكتروني بنجاح');
      } catch (emailError) {
        console.error('useQuickFormSubmit: خطأ في إرسال البريد الإلكتروني:', emailError);
      }
      
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: `تم إنشاء طلب الصيانة برقم ${requestId}`,
        variant: "default",
      });
      
      console.log('useQuickFormSubmit: تم إرسال الطلب بنجاح، رقم الطلب:', requestId);
      
      resetForm();
      navigate(`/maintenance-tracking?requestNumber=${requestId}`);
      
    } catch (error) {
      console.error('useQuickFormSubmit: خطأ في إرسال الطلب:', error);
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من إرسال طلبك. الرجاء المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, submitForm };
};
