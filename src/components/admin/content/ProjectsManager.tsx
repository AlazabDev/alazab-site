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
import { Plus, Edit, Trash2, Image as ImageIcon, Box, Loader2, X } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface ProjectRow {
  id: string;
  name: string;
  title_en: string | null;
  slug: string | null;
  client_name: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  status: string | null;
  area_sqm: number | null;
  year: number | null;
  is_published: boolean;
  sort_order: number;
  model_3d_embeds: string[] | null;
  gallery: string[] | null;
  stats: Record<string, string | number> | null;
  content_ar: string | null;
  content_en: string | null;
}

const empty: Partial<ProjectRow> = {
  name: '', title_en: '', slug: '', client_name: '', category: '', location: '',
  description: '', cover_image_url: '', status: 'مكتمل', area_sqm: null, year: new Date().getFullYear(),
  is_published: true, sort_order: 0, model_3d_embeds: [], gallery: [], stats: {},
  content_ar: '', content_en: ''
};

const ProjectsManager: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ProjectRow>>(empty);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    setRows((data as unknown as ProjectRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const openNew = () => { setEditing(empty); setOpen(true); };
  const openEdit = (r: ProjectRow) => { setEditing({ ...r }); setOpen(true); };

  const save = async () => {
    if (!editing.name) {
      toast({ variant: 'destructive', title: 'الاسم مطلوب' });
      return;
    }
    setSaving(true);
    const payload = {
      name: editing.name,
      title_en: editing.title_en || null,
      slug: editing.slug || null,
      client_name: editing.client_name || null,
      category: editing.category || null,
      location: editing.location || null,
      description: editing.description || null,
      cover_image_url: editing.cover_image_url || null,
      status: editing.status || null,
      area_sqm: editing.area_sqm ?? null,
      year: editing.year ?? null,
      is_published: editing.is_published ?? true,
      sort_order: editing.sort_order ?? 0,
      model_3d_embeds: editing.model_3d_embeds || [],
      gallery: editing.gallery || [],
      stats: editing.stats || {},
      content_ar: editing.content_ar || null,
      content_en: editing.content_en || null,
    };
    const res = editing.id
      ? await supabase.from('projects').update(payload).eq('id', editing.id)
      : await supabase.from('projects').insert(payload);
    if (res.error) {
      toast({ variant: 'destructive', title: 'فشل الحفظ', description: res.error.message });
    } else {
      toast({ title: editing.id ? 'تم التحديث' : 'تمت الإضافة' });
      setOpen(false);
      load();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'فشل الحذف', description: error.message });
    else { toast({ title: 'تم الحذف' }); load(); }
  };

  const uploadImage = async (file: File, target: 'cover' | 'gallery') => {
    setUploading(true);
    const path = `projects/${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    const { error } = await supabase.storage.from('projects-media').upload(path, file, { upsert: false });
    if (error) {
      toast({ variant: 'destructive', title: 'فشل الرفع', description: error.message });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('projects-media').getPublicUrl(path);
    if (target === 'cover') {
      setEditing(p => ({ ...p, cover_image_url: data.publicUrl }));
    } else {
      setEditing(p => ({ ...p, gallery: [...(p.gallery || []), data.publicUrl] }));
    }
    setUploading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base sm:text-xl">المشروعات ({rows.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2">
              <Plus className="w-4 h-4" /> مشروع جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editing.id ? 'تعديل مشروع' : 'مشروع جديد'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الاسم بالعربية *</Label>
                <Input value={editing.name || ''} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>الاسم بالإنجليزية</Label>
                <Input value={editing.title_en || ''} onChange={e => setEditing(p => ({ ...p, title_en: e.target.value }))} />
              </div>
              <div>
                <Label>Slug (للرابط)</Label>
                <Input value={editing.slug || ''} onChange={e => setEditing(p => ({ ...p, slug: e.target.value }))} placeholder="abu-auf-banha" />
              </div>
              <div>
                <Label>اسم العميل</Label>
                <Input value={editing.client_name || ''} onChange={e => setEditing(p => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div>
                <Label>التصنيف</Label>
                <Input value={editing.category || ''} onChange={e => setEditing(p => ({ ...p, category: e.target.value }))} placeholder="commercial / residential / luxury" />
              </div>
              <div>
                <Label>الموقع</Label>
                <Input value={editing.location || ''} onChange={e => setEditing(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div>
                <Label>المساحة (م²)</Label>
                <Input type="number" value={editing.area_sqm ?? ''} onChange={e => setEditing(p => ({ ...p, area_sqm: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label>السنة</Label>
                <Input type="number" value={editing.year ?? ''} onChange={e => setEditing(p => ({ ...p, year: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <Label>الحالة</Label>
                <Input value={editing.status || ''} onChange={e => setEditing(p => ({ ...p, status: e.target.value }))} placeholder="مكتمل / قيد التنفيذ / جديد" />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={editing.sort_order ?? 0} onChange={e => setEditing(p => ({ ...p, sort_order: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-2">
                <Label>وصف مختصر</Label>
                <Textarea rows={2} value={editing.description || ''} onChange={e => setEditing(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>المحتوى الكامل (عربي)</Label>
                <Textarea rows={4} value={editing.content_ar || ''} onChange={e => setEditing(p => ({ ...p, content_ar: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label>Full Content (English)</Label>
                <Textarea rows={4} value={editing.content_en || ''} onChange={e => setEditing(p => ({ ...p, content_en: e.target.value }))} />
              </div>

              {/* Cover */}
              <div className="md:col-span-2 border rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> الصورة الرئيسية</Label>
                {editing.cover_image_url && (
                  <img src={editing.cover_image_url} alt="cover" className="w-full max-h-48 object-cover rounded" />
                )}
                <Input type="file" accept="image/*" disabled={uploading} onChange={e => {
                  const f = e.target.files?.[0]; if (f) uploadImage(f, 'cover');
                }} />
                <Input value={editing.cover_image_url || ''} onChange={e => setEditing(p => ({ ...p, cover_image_url: e.target.value }))} placeholder="أو الصق رابط مباشر" />
              </div>

              {/* Gallery */}
              <div className="md:col-span-2 border rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> معرض الصور</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(editing.gallery || []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-24 object-cover rounded" />
                      <button type="button" onClick={() => setEditing(p => ({ ...p, gallery: (p.gallery || []).filter((_, idx) => idx !== i) }))}
                        className="absolute top-1 left-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Input type="file" accept="image/*" disabled={uploading} onChange={e => {
                  const f = e.target.files?.[0]; if (f) uploadImage(f, 'gallery');
                }} />
              </div>

              {/* 3D Embeds */}
              <div className="md:col-span-2 border rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-2"><Box className="w-4 h-4" /> روابط النماذج ثلاثية الأبعاد (Magicplan)</Label>
                {(editing.model_3d_embeds || []).map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={url} onChange={e => {
                      const arr = [...(editing.model_3d_embeds || [])];
                      arr[i] = e.target.value;
                      setEditing(p => ({ ...p, model_3d_embeds: arr }));
                    }} />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(p => ({
                      ...p, model_3d_embeds: (p.model_3d_embeds || []).filter((_, idx) => idx !== i)
                    }))}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setEditing(p => ({
                  ...p, model_3d_embeds: [...(p.model_3d_embeds || []), '']
                }))}>+ إضافة رابط 3D</Button>
              </div>

              {/* Stats */}
              <div className="md:col-span-2 border rounded-lg p-3 space-y-2">
                <Label>الإحصائيات (JSON)</Label>
                <Textarea rows={3} value={JSON.stringify(editing.stats || {}, null, 2)}
                  onChange={e => {
                    try { setEditing(p => ({ ...p, stats: JSON.parse(e.target.value) })); } catch { /* ignore */ }
                  }}
                  placeholder='{"surfaceWithoutWalls":"60.1 m²","floorArea":"41.2 m²","volume":"205 m³","rooms":2,"doors":2}'
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <Switch checked={editing.is_published ?? true} onCheckedChange={v => setEditing(p => ({ ...p, is_published: v }))} />
                <Label>منشور (مرئي للعامة)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(r => (
              <div key={r.id} className="border rounded-lg overflow-hidden bg-card">
                {r.cover_image_url && (
                  <img src={r.cover_image_url} alt={r.name} className="w-full h-32 object-cover" />
                )}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm">{r.name}</h3>
                    <Badge variant={r.is_published ? 'default' : 'secondary'}>
                      {r.is_published ? 'منشور' : 'مخفي'}
                    </Badge>
                  </div>
                  {r.location && <p className="text-xs text-muted-foreground">{r.location}</p>}
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    {(r.gallery?.length || 0) > 0 && <span>🖼️ {r.gallery!.length}</span>}
                    {(r.model_3d_embeds?.length || 0) > 0 && <span>📐 {r.model_3d_embeds!.length}</span>}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(r)} className="flex-1">
                      <Edit className="w-3 h-3 ml-1" /> تعديل
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف "{r.name}"؟</AlertDialogTitle>
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectsManager;
