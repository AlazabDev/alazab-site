import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, X, MessageSquare, Trash2, Mic, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceConversation from './VoiceConversation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;

const ELEVENLABS_AGENT_ID = 'agent_9701knm87j4mernbr61m7yedwysn';
const VOICES = [
  { id: 'LXrTqFIgiubkrMkwvOUr', name: 'مصري', accent: 'مصري', gender: 'ذكر', age: 'شاب' },
  { id: 'amSNjVC0vWYiE8iGimVb', name: 'مجدي', accent: 'عربي', gender: 'ذكر', age: 'متوسط' },
  { id: 'yrPIy5b3iLnVLIBfUSw8', name: 'عمرو', accent: 'عربي', gender: 'ذكر', age: 'شاب' },
  { id: 'ihycSANIrpHfhWoaq1g3', name: 'عزب', accent: 'عربي', gender: 'ذكر', age: 'متوسط' },
];

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const renderMarkdown = (text: string) => {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-sm font-bold mt-2 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-base font-bold mt-3 mb-1">$1</h2>')
    .replace(/^- (.*$)/gm, '<li class="mr-3">• $1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="mr-3">$1. $2</li>')
    .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/\n/g, '<br/>');
};

type TabMode = 'chat' | 'voice';

const FloatingChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabMode>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && activeTab === 'chat') setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, activeTab]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: 'user', content: msg };
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
      const message = e instanceof Error ? e.message : 'حدث خطأ';
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

  const quickQuestions = [
    'ما هي خدمات الشركة؟',
    'أريد عرض سعر تشطيب',
    'ما هي أسعار التشطيب؟',
    'ما هي فروع الشركة؟',
  ];

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-4 right-4 sm:left-6 sm:right-auto sm:w-[380px] z-50 rounded-2xl shadow-2xl border border-border bg-background overflow-hidden flex flex-col"
            style={{ maxHeight: 'min(520px, calc(100vh - 140px))' }}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-gradient-to-l from-construction-primary to-construction-dark p-3 flex items-center gap-3 text-white flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-construction-accent flex items-center justify-center">
                <Bot className="w-5 h-5 text-construction-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">عزبوت (AzaBot)</h3>
                <p className="text-[10px] text-white/70">المساعد الذكي - متصل الآن</p>
              </div>
              <div className="flex items-center gap-1">
                {activeTab === 'chat' && messages.length > 0 && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const lines = messages.map(m => `${m.role === 'user' ? 'أنت' : 'عزبوت'}: ${m.content}`).join('\n');
                      const header = `محادثة نصية مع عزبوت - ${new Date().toLocaleString('ar-EG')}\n${'─'.repeat(40)}\n\n`;
                      const blob = new Blob([header + lines], { type: 'text/plain;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `azabot-chat-${Date.now()}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }} className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10" title="تحميل المحادثة">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setMessages([])} className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-border flex-shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'text-construction-primary border-b-2 border-construction-accent bg-construction-accent/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                محادثة نصية
              </button>
              <button
                onClick={() => setActiveTab('voice')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'voice'
                    ? 'text-construction-primary border-b-2 border-construction-accent bg-construction-accent/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                محادثة صوتية
              </button>
            </div>

            {/* Content */}
            {activeTab === 'chat' ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 rounded-full bg-construction-accent/10 flex items-center justify-center mx-auto mb-3">
                        <MessageSquare className="w-7 h-7 text-construction-accent" />
                      </div>
                      <p className="text-sm font-bold text-foreground mb-1">مرحباً! أنا عزبوت 👋</p>
                      <p className="text-xs text-muted-foreground mb-3">كيف يمكنني مساعدتك؟</p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {quickQuestions.map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="text-[11px] px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors text-foreground"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === 'user'
                          ? 'bg-construction-primary text-white'
                          : 'bg-construction-accent text-construction-primary'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                        msg.role === 'user'
                          ? 'bg-construction-primary text-white rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div
                            className="text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                        ) : (
                          <p className="text-xs leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-construction-accent flex items-center justify-center">
                        <Bot className="w-3 h-3 text-construction-primary" />
                      </div>
                      <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-2.5 border-t border-border flex-shrink-0">
                  <div className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-muted rounded-full px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-construction-accent"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => sendMessage()}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      className="h-8 w-8 rounded-full bg-construction-accent hover:bg-construction-accent/90 text-construction-primary flex-shrink-0"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center mt-1.5">
                    مدعوم بالذكاء الاصطناعي · قد يخطئ أحياناً
                  </p>
                </div>
              </>
            ) : (
              <VoiceConversation
                agentId={ELEVENLABS_AGENT_ID}
                voices={VOICES}
                onClose={() => setActiveTab('chat')}
                onSwitchToChat={() => setActiveTab('chat')}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="fixed bottom-6 left-6 z-50 group"
        aria-label="تحدث مع عزبوت"
      >
        <div className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />}
        </div>
        {!isOpen && (
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            تحدث مع عزبوت
          </span>
        )}
      </button>
    </>
  );
};

export default FloatingChatBot;
