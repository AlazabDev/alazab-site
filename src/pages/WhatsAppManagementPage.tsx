import React, { useState } from 'react';
import { MessageCircle, GitBranch, MessageSquareText, User, Phone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppTemplatesTab from '@/components/whatsapp/WhatsAppTemplatesTab';
import WhatsAppFlowsTab from '@/components/whatsapp/WhatsAppFlowsTab';
import WhatsAppChatTab from '@/components/whatsapp/WhatsAppChatTab';
import { z } from 'zod';

const phoneSchema = z.string().min(10).max(15).regex(/^[\d\s\-+()]+$/);
const nameSchema = z.string().min(2).max(100);

const WhatsAppManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatStarted, setChatStarted] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const handleStartChat = () => {
    const nameResult = nameSchema.safeParse(customerName);
    const phoneResult = phoneSchema.safeParse(customerPhone);
    const newErrors: { name?: string; phone?: string } = {};
    if (!nameResult.success) newErrors.name = 'الاسم مطلوب (حرفين على الأقل)';
    if (!phoneResult.success) newErrors.phone = 'رقم هاتف غير صالح';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setChatStarted(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">إدارة واتساب للأعمال</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة القوالب والتدفقات والدردشة المباشرة</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              الدردشة
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              القوالب
            </TabsTrigger>
            <TabsTrigger value="flows" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              التدفقات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat">
            {!chatStarted ? (
              <div className="max-w-lg mx-auto">
                <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
                  <div className="bg-[#075E54] p-6 text-white text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold">بدء محادثة جديدة</h2>
                    <p className="text-white/80 mt-1 text-sm">أدخل بيانات العميل للتواصل عبر واتساب</p>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">الاسم</label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={customerName} onChange={e => { setCustomerName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }} placeholder="اسم العميل" className="pr-10" maxLength={100} />
                      </div>
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">رقم الهاتف</label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={customerPhone} onChange={e => { setCustomerPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }} placeholder="01xxxxxxxxx" className="pr-10" type="tel" dir="ltr" maxLength={15} />
                      </div>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>
                    <Button onClick={handleStartChat} className="w-full h-12 text-lg font-bold bg-[#25D366] hover:bg-[#1DA851] text-white">
                      <MessageCircle className="h-5 w-5 ml-2" />
                      بدء المحادثة
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-lg mx-auto">
                <WhatsAppChatTab
                  customerName={customerName}
                  customerPhone={customerPhone}
                  onBack={() => setChatStarted(false)}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates">
            <WhatsAppTemplatesTab />
          </TabsContent>

          <TabsContent value="flows">
            <WhatsAppFlowsTab />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default WhatsAppManagementPage;
