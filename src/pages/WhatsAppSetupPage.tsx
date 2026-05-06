import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, User, Phone, ArrowLeft, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'رقم الهاتف قصير جداً')
  .max(15, 'رقم الهاتف طويل جداً')
  .regex(/^[\d\s\-+()]+$/, 'رقم هاتف غير صالح');

const nameSchema = z.string()
  .min(2, 'الاسم قصير جداً')
  .max(100, 'الاسم طويل جداً')
  .regex(/^[^<>"';]+$/, 'الاسم يحتوي على أحرف غير مسموحة');

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
}

const WhatsAppSetupPage: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'chat'>('intro');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Poll for incoming messages
  useEffect(() => {
    if (step !== 'chat' || !customerPhone) return;

    let cleanPhone = customerPhone.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '20' + cleanPhone.substring(1);

    const channel = supabase
      .channel('whatsapp-replies')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `phone_number=eq.${cleanPhone}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, (payload: any) => {
        const msg = payload.new;
        if (msg.direction === 'inbound') {
          setMessages(prev => [...prev, {
            id: msg.id,
            content: msg.content,
            sender: 'bot',
            timestamp: new Date(msg.created_at),
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [step, customerPhone]);

  const handleStartChat = () => {
    const nameResult = nameSchema.safeParse(customerName);
    const phoneResult = phoneSchema.safeParse(customerPhone);
    const newErrors: { name?: string; phone?: string } = {};

    if (!nameResult.success) newErrors.name = nameResult.error.errors[0].message;
    if (!phoneResult.success) newErrors.phone = phoneResult.error.errors[0].message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep('chat');
    setMessages([{
      id: 'welcome',
      content: `مرحباً ${customerName}! 👋\nأنا مساعد شركة العزب للمقاولات العامة. كيف يمكنني مساعدتك اليوم?\n\nيمكنك الاستفسار عن:\n• المشروعات والأعمال\n• خدمات الصيانة\n• طلب عرض سعر\n• أي استفسار آخر`,
      sender: 'bot',
      timestamp: new Date(),
    }]);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || sending) return;
    if (trimmed.length > 1000) {
      toast({ title: 'الرسالة طويلة جداً', description: 'الحد الأقصى 1000 حرف', variant: 'destructive' });
      return;
    }

    const tempId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      content: trimmed,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
    };

    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phone: customerPhone,
          message: `[${customerName}]: ${trimmed}`,
          customer_name: customerName,
        },
      });

      if (error) throw error;

      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'sent' as const } : m
      ));
    } catch (err: unknown) {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'failed' as const } : m
      ));
      toast({
        title: 'فشل الإرسال',
        description: err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الرسالة',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 flex items-center justify-center">
        <div className="w-full max-w-lg">
          {step === 'intro' ? (
            /* ─── Intro Screen ─── */
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
              {/* Header */}
              <div className="bg-[#075E54] p-6 text-white text-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-10 w-10" />
                </div>
                <h1 className="text-2xl font-bold">تواصل معنا عبر واتساب</h1>
                <p className="text-white/80 mt-2 text-sm">
                  شركة العزب للمقاولات العامة
                </p>
              </div>

              {/* Form */}
              <div className="p-6 space-y-5">
                <p className="text-muted-foreground text-center text-sm">
                  أدخل بياناتك لبدء محادثة مباشرة مع فريقنا
                </p>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">الاسم الكامل</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={customerName}
                      onChange={e => { setCustomerName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                      placeholder="أدخل اسمك"
                      className="pr-10"
                      maxLength={100}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">رقم الهاتف</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={customerPhone}
                      onChange={e => { setCustomerPhone(e.target.value); setErrors(p => ({ ...p, phone: undefined })); }}
                      placeholder="01xxxxxxxxx"
                      className="pr-10"
                      type="tel"
                      dir="ltr"
                      maxLength={15}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <Button
                  onClick={handleStartChat}
                  className="w-full h-12 text-lg font-bold bg-[#25D366] hover:bg-[#1DA851] text-white"
                >
                  <MessageCircle className="h-5 w-5 ml-2" />
                  بدء المحادثة
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  سيتم إرسال رسائلك مباشرة إلى فريق الدعم عبر واتساب للأعمال
                </p>
              </div>
            </div>
          ) : (
            /* ─── Chat Screen ─── */
            <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="bg-[#075E54] p-4 text-white flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep('intro')}
                  className="text-white hover:bg-white/20 h-8 w-8"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">شركة العزب للمقاولات</h3>
                  <p className="text-xs text-white/70">متصل الآن • يرد عادة خلال دقائق</p>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto p-4 space-y-3"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        msg.sender === 'user'
                          ? 'bg-[#DCF8C6] text-gray-900 rounded-tl-sm'
                          : 'bg-white text-gray-900 rounded-tr-sm shadow-sm border border-gray-100'
                      }`}
                    >
                      {msg.content}
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                        <span className="text-[10px] text-gray-500">
                          {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'user' && msg.status === 'sending' && (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        )}
                        {msg.sender === 'user' && msg.status === 'sent' && (
                          <span className="text-[10px] text-blue-500">✓✓</span>
                        )}
                        {msg.sender === 'user' && msg.status === 'failed' && (
                          <span className="text-[10px] text-destructive">✗</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-muted/50 border-t border-border flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  className="flex-1 rounded-full bg-background border-0 focus-visible:ring-1"
                  maxLength={1000}
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                  size="icon"
                  className="rounded-full bg-[#075E54] hover:bg-[#064E46] h-10 w-10 flex-shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default WhatsAppSetupPage;
