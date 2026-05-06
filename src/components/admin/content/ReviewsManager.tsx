import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, Trash2, Loader2, Star, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface ReviewRow {
  id: string;
  project_id: string;
  reviewer_name: string;
  reviewer_email: string | null;
  reviewer_phone: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  projects?: { name: string } | null;
}

const ReviewsManager: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_reviews')
      .select('*, projects(name)')
      .order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    setRows((data as unknown as ReviewRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const setApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase.from('project_reviews').update({ is_approved: approved }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'فشل', description: error.message });
    else { toast({ title: approved ? 'تم الاعتماد' : 'تم الإلغاء' }); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('project_reviews').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'فشل', description: error.message });
    else { toast({ title: 'تم الحذف' }); load(); }
  };

  const pending = rows.filter(r => !r.is_approved);
  const approved = rows.filter(r => r.is_approved);

  const renderList = (list: ReviewRow[]) => (
    list.length === 0 ? <p className="text-muted-foreground text-center py-8">لا توجد تقييمات</p> :
    <div className="space-y-3">
      {list.map(r => (
        <div key={r.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold">{r.reviewer_name}</h4>
                <Badge variant={r.is_approved ? 'default' : 'secondary'}>
                  {r.is_approved ? 'معتمد' : 'بانتظار المراجعة'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {r.projects?.name || '—'} • {new Date(r.created_at).toLocaleDateString('ar-EG')}
                {r.reviewer_phone && ` • ${r.reviewer_phone}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
              ))}
            </div>
          </div>
          <p className="text-sm">{r.comment}</p>
          <div className="flex gap-2 pt-2">
            {!r.is_approved ? (
              <Button size="sm" onClick={() => setApproval(r.id, true)}>
                <Check className="w-4 h-4 ml-1" /> اعتماد
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setApproval(r.id, false)}>
                <X className="w-4 h-4 ml-1" /> إلغاء الاعتماد
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>حذف التقييم؟</AlertDialogTitle>
                  <AlertDialogDescription>لا يمكن التراجع.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove(r.id)}>حذف</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>تقييمات العملاء</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="pending" className="flex-1">بانتظار ({pending.length})</TabsTrigger>
              <TabsTrigger value="approved" className="flex-1">معتمد ({approved.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">{renderList(pending)}</TabsContent>
            <TabsContent value="approved" className="mt-4">{renderList(approved)}</TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsManager;
