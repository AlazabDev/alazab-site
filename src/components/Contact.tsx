
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import CompanyLocations from "./CompanyLocations";
import CompanyLinks from "./CompanyLinks";

const Contact: React.FC = () => {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real application, you would send the form data to your backend
    toast({
      title: "تم إرسال الرسالة",
      description: "سنقوم بالرد عليك في أقرب وقت ممكن.",
      duration: 5000,
    });
  };
  
  return (
    <div className="bg-white">
      <section id="contact" className="section bg-white">
        <div className="container mx-auto">
          <h2 className="section-title">تواصل معنا</h2>
          <p className="section-subtitle">نسعد بالرد على استفساراتك وتقديم المساعدة</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-construction-primary">معلومات الاتصال</h3>
              
              <div className="space-y-6">
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-construction-primary/10 rounded-full flex items-center justify-center shrink-0 text-construction-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">ساعات العمل</h4>
                    <p className="text-gray-600">الأحد - الخميس: 9:00 ص - 5:00 م</p>
                    <p className="text-gray-600">الجمعة - السبت: مغلق</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-construction-primary">أرسل رسالة</h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                    <Input id="name" placeholder="أدخل اسمك" className="w-full" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <Input id="email" type="email" placeholder="أدخل بريدك الإلكتروني" className="w-full" />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <Input id="phone" placeholder="أدخل رقم هاتفك" className="w-full" />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                  <Input id="subject" placeholder="موضوع الرسالة" className="w-full" />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                  <Textarea id="message" placeholder="اكتب رسالتك هنا" className="w-full min-h-[120px]" />
                </div>
                
                <Button type="submit" className="w-full bg-construction-primary hover:bg-construction-dark text-white">
                  إرسال الرسالة
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Company Locations */}
      <CompanyLocations />
      
      {/* Company Links */}
      <CompanyLinks />
    </div>
  );
};

export default Contact;
