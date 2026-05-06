import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, GitBranch, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Flow {
  id: string;
  wa_flow_id: string | null;
  name: string;
  status: string | null;
  categories: string[] | null;
  json_version: string | null;
  preview_url: string | null;
  updated_at: string | null;
}

const flowStatusConfig: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
  PUBLISHED: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'منشور', className: 'text-green-600 bg-green-50' },
  DRAFT: { icon: <Clock className="h-4 w-4" />, label: 'مسودة', className: 'text-yellow-600 bg-yellow-50' },
  DEPRECATED: { icon: <XCircle className="h-4 w-4" />, label: 'متوقف', className: 'text-red-600 bg-red-50' },
};

const WhatsAppFlowsTab: React.FC = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const fetchFlows = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('whatsapp_flows').select('*').order('created_at', { ascending: false });
    if (!error && data) setFlows(data as unknown as Flow[]);
    setLoading(false);
  };

  useEffect(() => { fetchFlows(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-whatsapp-flows');
      if (error) throw error;
      toast({ title: 'تم المزامنة', description: `تم مزامنة ${data?.synced || 0} تدفق من Meta` });
      await fetchFlows();
    } catch (err: unknown) {
      toast({ title: 'فشل المزامنة', description: err instanceof Error ? err.message : 'خطأ غير معروف', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">نماذج التدفقات</h3>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <RefreshCw className="h-4 w-4 ml-2" />}
          مزامنة مع Meta
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : flows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>لا توجد تدفقات. اضغط "مزامنة مع Meta" لجلب التدفقات.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الفئات</TableHead>
                <TableHead className="text-right">إصدار JSON</TableHead>
                <TableHead className="text-right">معاينة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((flow) => {
                const st = flowStatusConfig[flow.status || 'DRAFT'] || flowStatusConfig.DRAFT;
                return (
                  <TableRow key={flow.id}>
                    <TableCell className="font-medium">{flow.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.className}`}>
                        {st.icon} {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{flow.categories?.join(', ') || '—'}</TableCell>
                    <TableCell className="text-sm">{flow.json_version || '—'}</TableCell>
                    <TableCell>
                      {flow.preview_url ? (
                        <a href={flow.preview_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">
                          عرض
                        </a>
                      ) : '—'}
                    </TableCell>
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

export default WhatsAppFlowsTab;
