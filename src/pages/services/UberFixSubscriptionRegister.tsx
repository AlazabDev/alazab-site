import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, User, Phone, MapPin, Loader2 } from 'lucide-react';

const formSchema = z.object({
  full_name: z.string().min(2, { message: 'يجب أن يحتوي الاسم على حرفين على الأقل' }),
  phone_number: z.string().min(8, { message: 'رقم هاتف غير صالح' }),
  store_name: z.string().min(2, { message: 'يجب إدخال اسم المتجر/الشركة' }),
  store_address: z.string().min(5, { message: 'الرجاء إدخال العنوان بالتفصيل' }),
  package_name: z.string().min(2, { message: 'يجب اختيار الباقة' }),
  notes: z.string().optional(),
});

const UberFixSubscriptionRegister: React.FC = () => {
  const { isRTL } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse package from URL query params
  const queryParams = new URLSearchParams(location.search);
  const initialPackage = queryParams.get('package') || 'أساسية';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: '',
      phone_number: '',
      store_name: '',
      store_address: '',
      package_name: initialPackage,
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('uberfix_subscriptions').insert({
        full_name: values.full_name,
        phone_number: values.phone_number,
        store_name: values.store_name,
        store_address: values.store_address,
        package_name: values.package_name,
        notes: values.notes,
        user_id: user?.id || null, // Link to logged-in user if exists
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: 'تم إرسال الطلب بنجاح',
        description: 'سيتم التواصل معك قريباً لإتمام الاشتراك.',
        duration: 5000,
      });
      
      // Redirect to success page
      navigate('/uberfix-subscriptions/complete');

    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        title: 'حدث خطأ',
        description: 'لم نتمكن من إرسال طلبك. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-24 px-4 pt-32">
        <Card className="w-full max-w-2xl shadow-xl border-t-4 border-t-teal-500">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900">تسجيل اشتراك UberFix</CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              يرجى إكمال البيانات التالية لإتمام طلب الاشتراك في باقات صيانة المحلات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الكامل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                            <Input placeholder="أحمد محمد" className={isRTL ? 'pr-10' : 'pl-10'} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone Number */}
                  <FormField
                    control={form.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم التواصل</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                            <Input placeholder="01xxxxxxxxx" className={isRTL ? 'pr-10 text-right' : 'pl-10 text-left'} dir="ltr" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Name */}
                  <FormField
                    control={form.control}
                    name="store_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم المحل / الشركة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Building2 className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                            <Input placeholder="سوبر ماركت الهدى" className={isRTL ? 'pr-10' : 'pl-10'} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Package Selection */}
                  <FormField
                    control={form.control}
                    name="package_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الباقة المختارة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الباقة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="أساسية">الباقة الأساسية - 2,400 ج.م</SelectItem>
                            <SelectItem value="احترافية">الباقة الاحترافية - 4,800 ج.م</SelectItem>
                            <SelectItem value="مميزة">الباقة المميزة - 8,400 ج.م</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Store Address */}
                <FormField
                  control={form.control}
                  name="store_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المحل التفصيلي</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} text-gray-400 w-5 h-5`} />
                          <Input placeholder="المحافظة، المدينة، الشارع، رقم المبنى" className={isRTL ? 'pr-10' : 'pl-10'} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="أي متطلبات خاصة بالمحل مثل أوقات العمل المفضلة للصيانة..." 
                          className="min-h-[100px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg mt-6 shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري إرسال الطلب...
                    </>
                  ) : (
                    'تأكيد طلب الاشتراك'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default UberFixSubscriptionRegister;
