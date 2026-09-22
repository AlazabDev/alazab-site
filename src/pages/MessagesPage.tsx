import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WhatsAppChatTab from '@/components/whatsapp/WhatsAppChatTab';
import { supabase } from '@/integrations/supabase/client';

interface MessageRow {
  id: string;
  phone_number: string;
  customer_name: string | null;
  content: string | null;
  created_at: string;
  direction: string;
}

const MessagesPage: React.FC = () => {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('id,phone_number,customer_name,content,created_at,direction')
      .order('created_at', { ascending: false })
      .limit(250);
    if (error) console.error('[messages] load failed', error);
    setRows((data || []) as MessageRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const channel = supabase
      .channel('dashboard-message-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_messages' }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const conversations = useMemo(() => {
    const byPhone = new Map<string, MessageRow>();
    for (const row of rows) if (!byPhone.has(row.phone_number)) byPhone.set(row.phone_number, row);
    return [...byPhone.values()];
  }, [rows]);

  const selected = conversations.find((item) => item.phone_number === selectedPhone);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div><h2 className="text-2xl font-bold">الرسائل</h2><p className="text-muted-foreground">محادثات واتساب المسجلة في النظام.</p></div>
        {selected ? (
          <WhatsAppChatTab customerName={selected.customer_name || selected.phone_number} customerPhone={selected.phone_number} onBack={() => setSelectedPhone(null)} />
        ) : loading ? (
          <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : (
          <div className="grid gap-3">
            {conversations.map((item) => (
              <Card key={item.phone_number} className="cursor-pointer hover:border-construction-primary" onClick={() => setSelectedPhone(item.phone_number)}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10"><MessageCircle className="h-5 w-5 text-green-600" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2"><p className="truncate font-semibold">{item.customer_name || item.phone_number}</p><span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('ar-EG')}</span></div>
                    <p className="truncate text-sm text-muted-foreground">{item.content || 'رسالة مرفقة'}</p>
                  </div>
                  <Button variant="ghost" size="sm">فتح</Button>
                </CardContent>
              </Card>
            ))}
            {conversations.length === 0 && <p className="py-10 text-center text-muted-foreground">لا توجد محادثات مسجلة.</p>}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
