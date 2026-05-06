import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Upload, Trash2, FileText, Save, Search, ToggleLeft, ToggleRight,
  Bot, BookOpen, Database, Loader2, X, Edit2, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source_type: string;
  file_name: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = ['عام', 'خدمات', 'مشاريع', 'أسعار', 'صيانة', 'معلومات الشركة', 'سياسات', 'أسئلة شائعة'];

const ChatbotTrainingPage: React.FC = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  // New entry form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('عام');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chatbot_knowledge')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'خطأ', description: 'فشل في تحميل البيانات', variant: 'destructive' });
    } else {
      setEntries((data as KnowledgeEntry[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى ملء العنوان والمحتوى', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('chatbot_knowledge').insert({
      title: newTitle,
      content: newContent,
      category: newCategory,
      source_type: 'manual',
    });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تمت إضافة المعرفة بنجاح' });
      setNewTitle(''); setNewContent(''); setShowAddDialog(false);
      fetchEntries();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('chatbot_knowledge').update({ is_active: !current }).eq('id', id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, is_active: !current } : e));
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    await supabase.from('chatbot_knowledge').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    toast({ title: 'تم', description: 'تم حذف العنصر' });
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('chatbot_knowledge').update({ title: editTitle, content: editContent }).eq('id', editingId);
    setEntries(prev => prev.map(e => e.id === editingId ? { ...e, title: editTitle, content: editContent } : e));
    setEditingId(null);
    toast({ title: 'تم', description: 'تم تحديث المعرفة' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.txt', '.csv', '.md', '.json'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      toast({ title: 'خطأ', description: 'أنواع الملفات المدعومة: TXT, CSV, MD, JSON', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', newCategory);

      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-training-file`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error);

      toast({ title: 'تم رفع الملف', description: `تم استخراج ${result.entries_count} عنصر من الملف` });
      fetchEntries();
    } catch (err: unknown) {
      toast({ title: 'خطأ', description: err instanceof Error ? err.message : 'خطأ', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = !searchQuery || e.title.includes(searchQuery) || e.content.includes(searchQuery);
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: entries.length,
    active: entries.filter(e => e.is_active).length,
    manual: entries.filter(e => e.source_type === 'manual').length,
    file: entries.filter(e => e.source_type === 'file').length,
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <div className="bg-gradient-to-br from-construction-primary to-construction-dark text-white py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-construction-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-construction-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">تدريب عزبوت</h1>
                <p className="text-white/70 text-sm">إدارة قاعدة معرفة المساعد الذكي</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'الإجمالي', value: stats.total, icon: Database },
                { label: 'نشط', value: stats.active, icon: ToggleRight },
                { label: 'يدوي', value: stats.manual, icon: FileText },
                { label: 'من ملفات', value: stats.file, icon: Upload },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 text-center">
                  <s.icon className="w-5 h-5 mx-auto mb-1 text-construction-accent" />
                  <div className="text-2xl font-bold text-construction-accent">{s.value}</div>
                  <div className="text-xs text-white/50">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-6">
          {/* Actions Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="بحث في قاعدة المعرفة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-construction-accent hover:bg-construction-accent/90 text-construction-primary">
                  <Plus className="w-4 h-4 ml-2" /> إضافة معرفة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>إضافة معرفة جديدة</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="manual" className="mt-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="manual" className="flex-1">نص يدوي</TabsTrigger>
                    <TabsTrigger value="file" className="flex-1">رفع ملف</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <Input placeholder="العنوان" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    <Textarea placeholder="المحتوى - اكتب المعلومات التي تريد أن يتعلمها البوت" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={6} />
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={addEntry} className="w-full bg-construction-accent text-construction-primary">
                      <Save className="w-4 h-4 ml-2" /> حفظ
                    </Button>
                  </TabsContent>

                  <TabsContent value="file" className="space-y-4 mt-4">
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="border-2 border-dashed rounded-xl p-8 text-center">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">اسحب الملف هنا أو اضغط للاختيار</p>
                      <p className="text-xs text-muted-foreground mb-4">الأنواع المدعومة: TXT, CSV, MD, JSON</p>
                      <input
                        type="file"
                        accept=".txt,.csv,.md,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload">
                        <Button asChild variant="outline" disabled={isUploading}>
                          <span>
                            {isUploading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                            {isUploading ? 'جاري الرفع...' : 'اختر ملف'}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>

          {/* Entries List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-construction-accent" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">لا توجد بيانات تدريب بعد</p>
              <p className="text-muted-foreground text-sm">ابدأ بإضافة معلومات ليتعلمها عزبوت</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <motion.div key={entry.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className={`transition-all ${!entry.is_active ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      {editingId === entry.id ? (
                        <div className="space-y-3">
                          <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} className="bg-construction-accent text-construction-primary">
                              <Check className="w-4 h-4 ml-1" /> حفظ
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4 ml-1" /> إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm truncate">{entry.title}</h3>
                              <Badge variant="secondary" className="text-[10px]">{entry.category}</Badge>
                              <Badge variant={entry.source_type === 'file' ? 'outline' : 'default'} className="text-[10px]">
                                {entry.source_type === 'file' ? `📄 ${entry.file_name}` : '✏️ يدوي'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{entry.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(entry.id, entry.is_active)} title={entry.is_active ? 'تعطيل' : 'تفعيل'}>
                              {entry.is_active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(entry)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry(entry.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChatbotTrainingPage;
