import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, ArrowLeft, Paperclip, Image, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const WhatsAppChatTab: React.FC<WhatsAppChatTabProps> = ({ customerName, customerPhone, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  // Welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      content: `مرحباً ${customerName}! 👋\nكيف يمكنني مساعدتك اليوم?`,
      sender: 'bot',
      timestamp: new Date(),
    }]);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [customerName]);

  // Realtime listener for inbound messages
  useEffect(() => {
    if (!customerPhone) return;
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
            id: String(msg.id),
            content: msg.content || `[${msg.message_type}]`,
            sender: 'bot',
            timestamp: new Date(msg.created_at),
            media_url: msg.media_url,
            message_type: msg.message_type,
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [customerPhone]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast({ title: 'الملف كبير جداً', description: 'الحد الأقصى 16 ميجابايت', variant: 'destructive' });
      return;
    }
    setAttachFile(file);
    if (file.type.startsWith('image/')) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
  };

  const removeAttachment = () => {
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
    // Upload to Seafile via edge function
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/whatsapp');

    const { data, error } = await supabase.functions.invoke('upload-to-seafile', {
      body: formData,
    });
    if (error) throw new Error('فشل رفع الملف');
    return data.public_url;
  };

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed && !attachFile) return;
    if (sending) return;

    const tempId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      content: attachFile ? (trimmed || attachFile.name) : trimmed,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      message_type: attachFile ? getMediaType(attachFile) : 'text',
    };

    setMessages(prev => [...prev, newMsg]);
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
          body: {
            phone: customerPhone,
            message: `[${customerName}]: ${trimmed}`,
            customer_name: customerName,
          },
        });
        if (error) throw error;
      }

      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'sent' as const } : m
      ));
    } catch (err: unknown) {
      setMessages(prev => prev.map(m =>
        m.id === tempId ? { ...m, status: 'failed' as const } : m
      ));
      toast({ title: 'فشل الإرسال', description: err instanceof Error ? err.message : 'خطأ غير معروف', variant: 'destructive' });
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
    <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border flex flex-col h-[600px]">
      {/* Header */}
      <div className="bg-[#075E54] p-4 text-white flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20 h-8 w-8">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">{customerName}</h3>
          <p className="text-xs text-white/70">{customerPhone}</p>
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
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'bg-[#DCF8C6] text-gray-900 rounded-tl-sm'
                : 'bg-white text-gray-900 rounded-tr-sm shadow-sm border border-gray-100'
            }`}>
              {msg.media_url && msg.message_type === 'image' && (
                <img src={msg.media_url} alt="media" className="rounded-lg mb-2 max-w-full max-h-48 object-cover" />
              )}
              {msg.media_url && msg.message_type === 'document' && (
                <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mb-2 text-primary hover:underline">
                  <FileText className="h-4 w-4" /> مستند مرفق
                </a>
              )}
              {msg.content}
              <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                <span className="text-[10px] text-gray-500">
                  {msg.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.sender === 'user' && msg.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                {msg.sender === 'user' && msg.status === 'sent' && <span className="text-[10px] text-blue-500">✓✓</span>}
                {msg.sender === 'user' && msg.status === 'failed' && <span className="text-[10px] text-red-500">✗</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview */}
      {attachFile && (
        <div className="px-3 pt-2 flex items-center gap-2 bg-muted/50">
          {attachPreview ? (
            <img src={attachPreview} alt="preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="text-sm text-muted-foreground flex-1 truncate">{attachFile.name}</span>
          <Button variant="ghost" size="icon" onClick={removeAttachment} className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-muted/50 border-t border-border flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          className="h-10 w-10 flex-shrink-0"
          disabled={sending}
        >
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </Button>
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
          disabled={(!inputMessage.trim() && !attachFile) || sending}
          size="icon"
          className="rounded-full bg-[#075E54] hover:bg-[#064E46] h-10 w-10 flex-shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppChatTab;
