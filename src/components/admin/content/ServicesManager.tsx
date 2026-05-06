import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ServiceRow {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string | null;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  hero_image_url: string | null;
  content_ar: string | null;
  content_en: string | null;
  features: string[] | null;
  gallery: string[] | null;
  is_published: boolean;
  sort_order: number;
}

const empty: Partial<ServiceRow> = {
  slug: '', title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '',
  hero_image_url: '', content_ar: '', content_en: '', features: [], gallery: [],
  is_published: true, sort_order: 0
};

const ServicesManager: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ServiceRow>>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('service_pages').select('*').order('sort_order');
    if (error) toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    setRows((data as unknown as ServiceRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const save = async () => {
    if (!editing.slug || !editing.title_ar) {
      toast({ variant: 'destructive', title: 'Slug والعنوان مطلوبان' });
      return;
    }
    setSaving(true);
    const payload = {
      slug: editing.slug,
      title_ar: editing.title_ar,
      title_en: editing.title_en || null,
      subtitle_ar: editing.subtitle_ar || null,
      subtitle_en: editing.subtitle_en || null,
      hero_image_url: editing.hero_image_url || null,
      content_ar: editing.content_ar || null,
      content_en: editing.content_en || null,
      features: editing.features || [],
      gallery: editing.gallery || [],
      is_published: editing.is_published ?? true,
      sort_order: editing.sort_order ?? 0,
    };
    const res = editing.id
      ? await supabase.from('service_pages').update(payload).eq('id', editing.id)
      : await supabase.from('service_pages').insert(payload);
    if (res.error) toast({ variant: 'destructive', title: 'فشل', description: res.error.message });
    else { toast({ title: 'تم الحفظ' }); setOpen(false); load(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('service_pages').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'فشل', description: error.message });
    else { toast({ title: 'تم الحذف' }); load(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base sm:text-xl">صفحات الخدمات ({rows.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(empty); setOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> صفحة خدمة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing.id ? 'تعديل خدمة' : 'خدمة جديدة'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Slug *</Label>
                <Input value={editing.slug || ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value }))} placeholder="luxury-finishing" />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>العنوان (عربي) *</Label>
                <Input value={editing.title_ar || ''} onChange={e => setEditing(p => ({ ...p, title_ar: e.target.value }))} />
              </div>
              <div>
                <Label>Title (English)</Label>
                <Input value={editing.title_en || ''} onChange={e => setEditing(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>وصف مختصر (عربي)</Label>
                <Input value={editing.subtitle_ar || ''} onChange={e => setEditing(p => ({ ...p, subtitle_ar: e.target.value }))} />
              </div>
              <div>
                <Label>Subtitle (English)</Label>
                <Input value={editing.subtitle_en || ''} onChange={e => setEditing(p => ({ ...p, subtitle_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>صورة Hero (URL)</Label>
                <Input value={editing.hero_image_url || ''} onChange={e => setEditing(p => ({ ...p, hero_image_url: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>المحتوى (عربي)</Label>
                <Textarea rows={6} value={editing.content_ar || ''} onChange={e => setEditing(p => ({ ...p, content_ar: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Content (English)</Label>
                <Textarea rows={6} value={editing.content_en || ''} onChange={e => setEditing(p => ({ ...p, content_en: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>المميزات (سطر لكل ميزة)</Label>
                <Textarea rows={3} value={(editing.features || []).join('\n')}
                  onChange={e => setEditing(p => ({ ...p, features: e.target.value.split('\n').filter(Boolean) }))} />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Switch checked={editing.is_published ?? true} onCheckedChange={v => setEditing(p => ({ ...p, is_published: v }))} />
                <Label>منشور</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">لا توجد صفحات خدمات. أضف واحدة لتبدأ.</p>
        ) : (
          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{r.title_ar}</h3>
                    <Badge variant={r.is_published ? 'default' : 'secondary'}>
                      {r.is_published ? 'منشور' : 'مخفي'}
                    </Badge>
                    <code className="text-xs text-muted-foreground">/{r.slug}</code>
                  </div>
                  {r.subtitle_ar && <p className="text-sm text-muted-foreground">{r.subtitle_ar}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditing({ ...r }); setOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف "{r.title_ar}"؟</AlertDialogTitle>
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
        )}
      </CardContent>
    </Card>
  );
};

export default ServicesManager;
