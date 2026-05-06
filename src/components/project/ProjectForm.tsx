import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// تعريف نموذج الإدخال باستخدام Zod
const projectFormSchema = z.object({
  name: z.string().min(2, {
    message: "يجب أن يكون عنوان المشروع بطول حرفين على الأقل",
  }),
  category: z.string({
    required_error: "يرجى اختيار فئة المشروع",
  }).optional(),
  location: z.string().min(2, {
    message: "يرجى إدخال موقع المشروع",
  }).optional(),
  cover_image_url: z.string().url({
    message: "يرجى إدخال رابط صورة صالح"
  }).optional().or(z.literal('')),
  description: z.string().min(10, {
    message: "يجب أن يكون الوصف بطول 10 أحرف على الأقل",
  }).optional(),
  status: z.string().optional(),
  model_3d_url: z.string().url({ 
    message: "يرجى إدخال رابط نموذج ثلاثي الأبعاد صالح" 
  }).optional().or(z.literal('')),
  progress: z.coerce.number().min(0).max(100).optional(),
  company_name: z.string().optional(),
  budget: z.coerce.number().optional(),
});

// تعريف نوع البيانات مع استخراج النوع من مخطط Zod
type ProjectFormValues = z.infer<typeof projectFormSchema>;

// تعريف الواجهة البرمجية للمكون مع تضمين خاصية id
interface ProjectFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: Partial<ProjectFormValues> & { id?: string };
  isEditing?: boolean;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData, 
  isEditing = false 
}) => {
  const { toast } = useToast();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "",
      location: initialData?.location || "",
      cover_image_url: initialData?.cover_image_url || "",
      description: initialData?.description || "",
      status: initialData?.status || "جديد",
      model_3d_url: initialData?.model_3d_url || "",
      progress: initialData?.progress || 0,
      company_name: initialData?.company_name || "",
      budget: initialData?.budget || 0,
    },
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      if (isEditing && initialData?.id) {
        // تحديث مشروع موجود
        const { error } = await supabase
          .from('projects')
          .update({
            description: data.description || null,
            status: data.status || null,
            location: data.location || null,
            cover_image_url: data.cover_image_url || null,
            progress: data.progress || null,
            company_name: data.company_name || null,
            budget: data.budget || null,
          })
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "تم تحديث المشروع بنجاح",
          description: "تم تحديث بيانات المشروع في قاعدة البيانات",
        });
      } else {
        // إضافة مشروع جديد
        const { error } = await supabase
          .from('projects')
          .insert({
            name: data.name,
            description: data.description || null,
            status: data.status || null,
            location: data.location || null,
            cover_image_url: data.cover_image_url || null,
            progress: data.progress || null,
            company_name: data.company_name || null,
            budget: data.budget || null,
          })
          .select();

        if (error) throw error;

        toast({
          title: "تم إضافة المشروع بنجاح",
          description: "تمت إضافة المشروع الجديد إلى قاعدة البيانات",
        });

        form.reset();
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        variant: "destructive",
        title: "خطأ في حفظ المشروع",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء محاولة حفظ المشروع. يرجى المحاولة مرة أخرى.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عنوان المشروع *</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل عنوان المشروع" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>فئة المشروع *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فئة المشروع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="المباني السكنية">المباني السكنية</SelectItem>
                    <SelectItem value="المباني التجارية">المباني التجارية</SelectItem>
                    <SelectItem value="الفلل الخاصة">الفلل الخاصة</SelectItem>
                    <SelectItem value="المجمعات السكنية">المجمعات السكنية</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>موقع المشروع *</FormLabel>
              <FormControl>
                <Input placeholder="أدخل موقع المشروع" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cover_image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رابط صورة المشروع</FormLabel>
                <FormControl>
                  <Input placeholder="أدخل رابط صورة المشروع" {...field} />
                </FormControl>
                <FormDescription>
                  أدخل رابط URL لصورة المشروع (يمكنك استخدام خدمات استضافة الصور مثل Imgur أو Cloudinary)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="model_3d_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رابط النموذج ثلاثي الأبعاد (اختياري)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="أدخل رابط النموذج ثلاثي الأبعاد" 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  يمكنك استخدام رابط من خدمات مثل Matterport أو SketchFab
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>وصف المشروع</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="أدخل وصفاً مختصراً للمشروع" 
                  className="resize-none min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>حالة المشروع</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر حالة المشروع" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="جديد">جديد</SelectItem>
                    <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
                    <SelectItem value="مكتمل">مكتمل</SelectItem>
                    <SelectItem value="متوقف">متوقف</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نسبة إنجاز المشروع ({field.value}%)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="5"
                      className="w-full" 
                      {...field} 
                    />
                    <span className="text-sm font-medium w-12">
                      {field.value}%
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            إلغاء
          </Button>
          <Button 
            type="submit" 
            className="bg-construction-primary hover:bg-construction-dark"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? "جارٍ التحديث..." : "جارٍ الحفظ..."}
              </>
            ) : isEditing ? "حفظ التغييرات" : "حفظ المشروع"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
