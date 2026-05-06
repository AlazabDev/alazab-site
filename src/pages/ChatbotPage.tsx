import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

const ChatbotPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'خطأ غير معروف' }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContent }];
              });
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'حدث خطأ، يرجى المحاولة مرة أخرى.';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Escape HTML to prevent XSS, then apply markdown formatting
  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

  const renderMarkdown = (text: string) => {
    const safe = escapeHtml(text);
    return safe
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^- (.*$)/gm, '<li class="mr-4">• $1</li>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="mr-4">$1. $2</li>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      <Helmet>
        <title>عزبوت - المساعد الذكي | شركة العزب للمقاولات</title>
        <meta name="description" content="تحدث مع عزبوت المساعد الذكي لشركة العزب للمقاولات - استفسر عن الخدمات والمشاريع والأسعار" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Header />

        <main className="flex-1 pt-16 md:pt-20 flex flex-col">
          {/* Hero */}
          <div className="bg-gradient-to-br from-construction-primary to-construction-dark text-white py-6 px-4">
            <div className="container mx-auto max-w-3xl flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-construction-accent flex items-center justify-center flex-shrink-0">
                <Bot className="w-7 h-7 text-construction-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">عزبوت (AzaBot)</h1>
                <p className="text-white/70 text-sm">المساعد الذكي لشركة العزب - اسألني أي شيء عن خدماتنا ومشاريعنا</p>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto max-w-3xl px-4 py-6 space-y-4">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-construction-accent/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-construction-accent" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">مرحباً! أنا عزبوت 👋</h2>
                  <p className="text-muted-foreground mb-6">كيف يمكنني مساعدتك اليوم؟</p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    {[
                      'ما هي خدمات الشركة؟',
                      'كيف أقدم طلب صيانة؟',
                      'أريد معرفة المزيد عن مشاريعكم',
                      'ما هي فروع الشركة؟',
                    ].map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs"
                        onClick={() => { setInput(q); setTimeout(sendMessage, 100); }}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-construction-primary text-white'
                        : 'bg-construction-accent text-construction-primary'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-construction-primary text-white rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div
                          className="text-sm leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-construction-accent flex items-center justify-center">
                    <Bot className="w-4 h-4 text-construction-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t bg-background/95 backdrop-blur-md">
            <div className="container mx-auto max-w-3xl px-4 py-3">
              <div className="flex gap-2 items-end">
                {messages.length > 0 && (
                  <Button variant="ghost" size="icon" onClick={clearChat} className="flex-shrink-0 text-muted-foreground hover:text-destructive" title="مسح المحادثة">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك هنا..."
                  className="resize-none min-h-[44px] max-h-32 rounded-xl"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="flex-shrink-0 bg-construction-accent hover:bg-construction-accent/90 text-construction-primary rounded-xl min-h-[44px]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                عزبوت مدعوم بالذكاء الاصطناعي وقد يخطئ أحياناً. تحقق من المعلومات المهمة.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ChatbotPage;
