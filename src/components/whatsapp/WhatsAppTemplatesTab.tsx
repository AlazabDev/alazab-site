import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  wa_template_name: string;
  wa_template_code: string;
  status: string;
  category: string;
  language: string;
  preview_text: string | null;
  variables_count: number | null;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  APPROVED: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'معتمد', className: 'text-green-600 bg-green-50' },
  PENDING: { icon: <Clock className="h-4 w-4" />, label: 'قيد المراجعة', className: 'text-yellow-600 bg-yellow-50' },
  REJECTED: { icon: <XCircle className="h-4 w-4" />, label: 'مرفوض', className: 'text-red-600 bg-red-50' },
};

const WhatsAppTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (!error && data) setTemplates(data as Template[]);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-whatsapp-templates');
      if (error) throw error;
      toast({ title: 'تم المزامنة', description: `تم مزامنة ${data?.synced || 0} قالب من Meta` });
      await fetchTemplates();
    } catch (err: unknown) {
      toast({ title: 'فشل المزامنة', description: err instanceof Error ? err.message : 'خطأ غير معروف', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">قوالب الرسائل</h3>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          مزامنة مع Meta
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>لا توجد قوالب. اضغط "مزامنة مع Meta" لجلب القوالب.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم القالب</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">اللغة</TableHead>
                <TableHead className="text-right">المتغيرات</TableHead>
                <TableHead className="text-right">النص</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((tpl) => {
                const st = statusConfig[tpl.status] || statusConfig.PENDING;
                return (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.wa_template_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.className}`}>
                        {st.icon} {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{tpl.category}</TableCell>
                    <TableCell className="text-sm">{tpl.language}</TableCell>
                    <TableCell className="text-sm">{tpl.variables_count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tpl.preview_text || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default WhatsAppTemplatesTab;
