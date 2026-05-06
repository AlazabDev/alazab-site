import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationProvider } from '@elevenlabs/react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Keyboard, Search, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Voice {
  id: string;
  name: string;
  accent?: string;
  gender?: string;
  age?: string;
}

interface VoiceConversationProps {
  agentId: string;
  voices: Voice[];
  onClose: () => void;
  onSwitchToChat?: () => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const VoiceConversationInner: React.FC<VoiceConversationProps> = ({ agentId, voices, onClose, onSwitchToChat }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(voices[0]?.id || '');
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [transcripts, setTranscripts] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [volume, setVolume] = useState(0.8);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => console.log('ElevenLabs connected'),
    onDisconnect: () => console.log('ElevenLabs disconnected'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage: (message: any) => {
      if (message.type === 'user_transcript') {
        setTranscripts(prev => [...prev, { role: 'user', text: message.user_transcription_event?.user_transcript || '' }]);
      } else if (message.type === 'agent_response') {
        setTranscripts(prev => [...prev, { role: 'agent', text: message.agent_response_event?.agent_response || '' }]);
      } else if (message.type === 'agent_response_correction') {
        setTranscripts(prev => {
          const updated = [...prev];
          let lastAgent = -1;
          for (let j = updated.length - 1; j >= 0; j--) {
            if (updated[j].role === 'agent') { lastAgent = j; break; }
          }
          if (lastAgent !== -1) {
            updated[lastAgent] = { role: 'agent', text: message.agent_response_correction_event?.corrected_agent_response || '' };
          }
          return updated;
        });
      }
    },
    onError: (message: string) => console.error('ElevenLabs error:', message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [transcripts]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ agentId }),
      });

      if (!resp.ok) {
        throw new Error((await resp.json().catch(() => ({}))).error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      if (!data.signed_url) throw new Error('No signed URL received');

      const overrides: Record<string, unknown> = {};
      if (selectedVoice) {
        (overrides as Record<string, unknown>).tts = { voiceId: selectedVoice };
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
        connectionType: 'websocket',
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
      });
      await conversation.setVolume({ volume });
    } catch (error: unknown) {
      console.error('Failed to start voice conversation:', error);
      alert(error instanceof Error ? error.message : 'فشل في بدء المحادثة الصوتية');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, selectedVoice, volume]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    setTranscripts([]);
  }, [conversation]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    conversation.setVolume({ volume: newMuted ? 0 : volume });
  }, [isMuted, conversation, volume]);

  const downloadTranscript = useCallback(() => {
    if (transcripts.length === 0) return;
    const lines = transcripts.map(t => `${t.role === 'user' ? 'أنت' : 'عزبوت'}: ${t.text}`).join('\n');
    const header = `محادثة صوتية مع عزبوت - ${new Date().toLocaleString('ar-EG')}\n${'─'.repeat(40)}\n\n`;
    const blob = new Blob([header + lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `azabot-voice-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [transcripts]);

  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  const filteredVoices = voices.filter(v =>
    v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
    v.accent?.toLowerCase().includes(voiceSearch.toLowerCase()) ||
    v.gender?.toLowerCase().includes(voiceSearch.toLowerCase())
  );

  const selectedVoiceObj = voices.find(v => v.id === selectedVoice);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Voice Picker Dropdown */}
      {!isConnected && (
        <div className="p-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setShowVoicePicker(!showVoicePicker)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-muted rounded-xl text-xs border border-border hover:border-construction-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-construction-accent/20 flex items-center justify-center">
                  <Volume2 className="w-3 h-3 text-construction-primary" />
                </div>
                <div className="text-right">
                  <span className="font-medium">{selectedVoiceObj?.name || 'اختر الصوت'}</span>
                  {selectedVoiceObj?.accent && (
                    <span className="text-muted-foreground mr-1">• {selectedVoiceObj.accent}</span>
                  )}
                </div>
              </div>
              <svg className={`w-4 h-4 text-muted-foreground transition-transform ${showVoicePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            <AnimatePresence>
              {showVoicePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-10 overflow-hidden"
                >
                  {/* Search */}
                  <div className="p-2 border-b border-border">
                    <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5">
                      <Search className="w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={voiceSearch}
                        onChange={e => setVoiceSearch(e.target.value)}
                        placeholder="ابحث عن صوت..."
                        className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        autoFocus
                      />
                    </div>
                  </div>
                  {/* Voice List */}
                  <div className="max-h-40 overflow-y-auto">
                    {filteredVoices.map(voice => (
                      <button
                        key={voice.id}
                        onClick={() => { setSelectedVoice(voice.id); setShowVoicePicker(false); setVoiceSearch(''); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-muted transition-colors ${
                          selectedVoice === voice.id ? 'bg-construction-accent/5' : ''
                        }`}
                      >
                        <div className="w-7 h-7 rounded-full bg-construction-accent/15 flex items-center justify-center flex-shrink-0">
                          <Volume2 className="w-3.5 h-3.5 text-construction-primary" />
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-medium">{voice.name}</p>
                          {(voice.accent || voice.gender || voice.age) && (
                            <p className="text-[10px] text-muted-foreground">
                              {[voice.accent, voice.gender, voice.age].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                        {selectedVoice === voice.id && (
                          <Check className="w-4 h-4 text-construction-primary flex-shrink-0" />
                        )}
                      </button>
                    ))}
                    {filteredVoices.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">لا توجد نتائج</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Transcripts */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {transcripts.length === 0 && !isConnected && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-construction-accent/10 flex items-center justify-center mx-auto mb-3">
              <Mic className="w-8 h-8 text-construction-accent" />
            </div>
            <p className="text-sm font-bold text-foreground mb-1">محادثة صوتية مع عزبوت</p>
            <p className="text-xs text-muted-foreground">اضغط على زر الاتصال لبدء المحادثة</p>
          </div>
        )}
        {transcripts.length === 0 && isConnected && (
          <div className="text-center py-8">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 rounded-full bg-construction-accent/20 flex items-center justify-center mx-auto mb-3"
            >
              <Mic className="w-8 h-8 text-construction-accent" />
            </motion.div>
            <p className="text-sm font-bold text-foreground mb-1">
              {isSpeaking ? 'عزبوت يتحدث...' : 'جاهز للاستماع...'}
            </p>
            <p className="text-xs text-muted-foreground">تحدث الآن</p>
          </div>
        )}
        {transcripts.map((t, i) => (
          <div key={i} className={`flex gap-2 ${t.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
              t.role === 'user'
                ? 'bg-construction-primary text-white rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            }`}>
              {t.text}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Conversation Bar - matching reference design */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between bg-background rounded-full px-1.5 py-1.5 border border-border shadow-sm">
          {/* Label */}
          <div className="px-4 py-1.5 bg-muted rounded-full">
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">خدمة العملاء</span>
          </div>
          
          {/* Icons group */}
          <div className="flex items-center gap-0.5">
            {/* Mute/Volume */}
            {isConnected && (
              <button onClick={toggleMute} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}>
                {isMuted ? <VolumeX className="w-[18px] h-[18px] text-muted-foreground" /> : <Volume2 className="w-[18px] h-[18px] text-muted-foreground" />}
              </button>
            )}

            {/* Download */}
            {transcripts.length > 0 && (
              <button onClick={downloadTranscript} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" title="تحميل المحادثة">
                <Download className="w-[18px] h-[18px] text-muted-foreground" />
              </button>
            )}

            {/* Mic indicator */}
            <button className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" title="ميكروفون">
              <Mic className={`w-[18px] h-[18px] ${isConnected && !isSpeaking ? 'text-construction-accent' : 'text-muted-foreground'}`} />
            </button>

            {/* Switch to keyboard/text */}
            {onSwitchToChat && (
              <button onClick={onSwitchToChat} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors" title="محادثة نصية">
                <Keyboard className="w-[18px] h-[18px] text-muted-foreground" />
              </button>
            )}

            {/* Call / End call */}
            {!isConnected ? (
              <button
                onClick={startConversation}
                disabled={isConnecting}
                className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-50"
                title="بدء المكالمة"
              >
                {isConnecting ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Phone className="w-[18px] h-[18px] text-foreground" />
                  </motion.div>
                ) : (
                  <Phone className="w-[18px] h-[18px] text-foreground" />
                )}
              </button>
            ) : (
              <button
                onClick={stopConversation}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
                title="إنهاء المكالمة"
              >
                <PhoneOff className="w-[18px] h-[18px] text-destructive" />
              </button>
            )}
          </div>
        </div>

        {isConnected && (
          <p className="text-[9px] text-muted-foreground text-center mt-2">
            {isSpeaking ? '🔊 عزبوت يتحدث...' : '🎤 يستمع إليك...'}
          </p>
        )}
      </div>
    </div>
  );
};

const VoiceConversation: React.FC<VoiceConversationProps> = (props) => (
  <ConversationProvider>
    <VoiceConversationInner {...props} />
  </ConversationProvider>
);

export default VoiceConversation;
