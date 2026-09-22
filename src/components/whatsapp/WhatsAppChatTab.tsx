import React, { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, ArrowLeft, Paperclip, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type WhatsAppRow = Tables<'whatsapp_messages'>;

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
  media_url?: string;
  message_type?: string;
}

interface WhatsAppChatTabProps {
  customerName: string;
  customerPhone: string;
  onBack: () => void;
}

const normalizePhone = (value: string): string => {
  let phone = value.replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) phone = `20${phone.slice(1)}`;
  return phone;
};

const toChatMessage = (row: WhatsAppRow): ChatMessage => ({
  id: String(row.id),
  content: row.content || (row.message_type === 'text' ? '' : `[${row.message_type}]`),
  sender: row.direction === 'outbound' ? 'user' : 'bot',
  timestamp: new Date(row.created_at),
  status: row.status === 'failed' ? 'failed' : 'sent',
  media_url: row.media_url || undefined,
  message_type: row.message_type,
});

const WhatsAppChatTab: React.FC<WhatsAppChatTabProps> = ({ customerName, customerPhone, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const cleanPhone = normalizePhone(customerPhone);
    let active = true;

    const loadHistory = async (): Promise<void> => {
      setLoadingHistory(true);
      const candidates = [...new Set([cleanPhone, `+${cleanPhone}`, customerPhone])];
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .in('phone_number', candidates)
        .order('created_at', { ascending: true })
        .limit(300);

      if (!active) return;
      if (error) {
        console.error('[whatsapp-chat] history load failed', error);
        toast({ title: 'تعذر تحميل سجل المحادثة', description: error.message, variant: 'destructive' });
        setMessages([]);
      } else {
        setMessages((data || []).map(toChatMessage));
      }
      setLoadingHistory(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    void loadHistory();

    const channel = supabase
      .channel(`whatsapp-replies-${cleanPhone}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload) => {
        const row = payload.new as WhatsAppRow;
        if (normalizePhone(row.phone_number) !== cleanPhone) return;
        setMessages((current) => current.some((message) => message.id === String(row.id))
          ? current
          : [...current, toChatMessage(row)]);
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [customerPhone, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast({ title: 'الملف كبير جداً', description: 'الحد الأقصى 16 ميجابايت', variant: 'destructive' });
      return;
    }
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachFile(file);
    setAttachPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const removeAttachment = () => {
    if (attachPreview) URL.revokeObjectURL(attachPreview);
    setAttachFile(null);
    setAttachPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getMediaType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/whatsapp');
    const { data, error } = await supabase.functions.invoke('upload-to-seafile', { body: formData });
    if (error) throw new Error('فشل رفع الملف');
    if (!data?.public_url) throw new Error('لم يتم إرجاع رابط للملف');
    return data.public_url as string;
  };

  const handleSendMessage = async (): Promise<void> => {
    const trimmed = inputMessage.trim();
    if ((!trimmed && !attachFile) || sending) return;

    const tempId = `msg-${crypto.randomUUID()}`;
    const newMessage: ChatMessage = {
      id: tempId,
      content: attachFile ? (trimmed || attachFile.name) : trimmed,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      message_type: attachFile ? getMediaType(attachFile) : 'text',
    };

    setMessages((current) => [...current, newMessage]);
    setInputMessage('');
    setSending(true);

    try {
      if (attachFile) {
        const publicUrl = await uploadFileToStorage(attachFile);
        const { error } = await supabase.functions.invoke('send-whatsapp-media', {
          body: {
            phone: customerPhone,
            media_url: publicUrl,
            media_type: getMediaType(attachFile),
            caption: trimmed || undefined,
            customer_name: customerName,
          },
        });
        if (error) throw error;
        removeAttachment();
      } else {
        const { error } = await supabase.functions.invoke('send-whatsapp-message', {
          body: { phone: customerPhone, message: trimmed, customer_name: customerName },
        });
        if (error) throw error;
      }
      setMessages((current) => current.map((message) => message.id === tempId ? { ...message, status: 'sent' } : message));
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === tempId ? { ...message, status: 'failed' } : message));
      toast({ title: 'فشل الإرسال', description: error instanceof Error ? error.message : 'خطأ غير معروف', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center gap-3 bg-[#075E54] p-4 text-white">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-white hover:bg-white/20"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Bot className="h-5 w-5" /></div>
        <div className="flex-1"><h3 className="text-sm font-bold">{customerName}</h3><p className="text-xs text-white/70">{customerPhone}</p></div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">لا توجد رسائل سابقة. ابدأ المحادثة من الأسفل.</div>
        ) : messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${message.sender === 'user' ? 'rounded-tl-sm bg-[#DCF8C6] text-gray-900' : 'rounded-tr-sm border bg-white text-gray-900 shadow-sm'}`}>
              {message.media_url && message.message_type === 'image' && <img src={message.media_url} alt="مرفق" className="mb-2 max-h-48 max-w-full rounded-lg object-cover" />}
              {message.media_url && message.message_type === 'document' && <a href={message.media_url} target="_blank" rel="noopener noreferrer" className="mb-2 flex items-center gap-2 text-primary hover:underline"><FileText className="h-4 w-4" />مستند مرفق</a>}
              {message.content}
              <div className={`mt-1 flex items-center gap-1 ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <span className="text-[10px] text-gray-500">{message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                {message.sender === 'user' && message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                {message.sender === 'user' && message.status === 'sent' && <span className="text-[10px] text-blue-500">✓✓</span>}
                {message.sender === 'user' && message.status === 'failed' && <span className="text-[10px] text-red-500">✗</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {attachFile && <div className="flex items-center gap-2 bg-muted/50 px-3 pt-2">
        {attachPreview ? <img src={attachPreview} alt="معاينة" className="h-12 w-12 rounded object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded bg-muted"><FileText className="h-5 w-5" /></div>}
        <span className="flex-1 truncate text-sm text-muted-foreground">{attachFile.name}</span>
        <Button variant="ghost" size="icon" onClick={removeAttachment} className="h-7 w-7"><X className="h-4 w-4" /></Button>
      </div>}

      <div className="flex items-center gap-2 border-t bg-muted/50 p-3">
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending}><Paperclip className="h-5 w-5" /></Button>
        <Input ref={inputRef} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSendMessage(); } }} placeholder="اكتب رسالتك..." className="flex-1 rounded-full bg-background" maxLength={1000} disabled={sending} />
        <Button onClick={() => void handleSendMessage()} disabled={(!inputMessage.trim() && !attachFile) || sending} size="icon" className="rounded-full bg-[#075E54] hover:bg-[#064E46]">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppChatTab;
