import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, Plus, Send, Trash2, Upload, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { invokeDocumentAction } from '@/hooks/useDocuments';

interface Reviewer {
  id: string;
  name: string;
  email: string;
  department: 'engineering' | 'procurement' | 'accounting' | 'management' | 'other';
}

interface UploadedFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ProjectOption {
  id: string;
  name: string;
  status: string | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const departmentLabels: Record<Reviewer['department'], string> = {
  engineering: 'الهندسة',
  procurement: 'المشتريات',
  accounting: 'الحسابات',
  management: 'الإدارة',
  other: 'أخرى',
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function UploadDocument() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('none');
  const [dragActive, setDragActive] = useState(false);
  const [reviewers, setReviewers] = useState<Reviewer[]>([
    { id: crypto.randomUUID(), name: '', email: '', department: 'engineering' },
  ]);

  useEffect(() => {
    let active = true;
    void supabase
      .from('projects')
      .select('id,name,status')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.error('[approvals] projects load failed', error);
          toast({ title: 'تعذر تحميل المشاريع', description: error.message, variant: 'destructive' });
        }
        setProjects((data || []) as ProjectOption[]);
        setProjectsLoading(false);
      });
    return () => { active = false; };
  }, [toast]);

  const handleFiles = useCallback((selectedFiles: FileList | File[]) => {
    const accepted: UploadedFile[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(selectedFiles)) {
      if (file.type !== 'application/pdf') {
        rejected.push(`${file.name}: يجب أن يكون PDF`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: أكبر من 50MB`);
      } else {
        accepted.push({ file, progress: 0, status: 'pending' });
      }
    }

    if (accepted.length) setFiles((current) => [...current, ...accepted]);
    if (rejected.length) {
      toast({
        title: 'تم استبعاد بعض الملفات',
        description: rejected.slice(0, 3).join(' — '),
        variant: 'destructive',
      });
    }
  }, [toast]);

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const addReviewer = () => {
    setReviewers((current) => [
      ...current,
      { id: crypto.randomUUID(), name: '', email: '', department: 'engineering' },
    ]);
  };

  const removeReviewer = (id: string) => {
    setReviewers((current) => current.length > 1 ? current.filter((reviewer) => reviewer.id !== id) : current);
  };

  const updateReviewer = (id: string, field: keyof Reviewer, value: string) => {
    setReviewers((current) =>
      current.map((reviewer) => reviewer.id === id ? { ...reviewer, [field]: value } as Reviewer : reviewer),
    );
  };

  const setFileState = (index: number, patch: Partial<UploadedFile>) => {
    setFiles((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'غير مصرح', description: 'تعذر تحديد المستخدم الحالي.', variant: 'destructive' });
      return;
    }
    if (!files.length) {
      toast({ title: 'اختر ملفًا', description: 'يجب اختيار ملف PDF واحد على الأقل.', variant: 'destructive' });
      return;
    }
    if (!title.trim()) {
      toast({ title: 'العنوان مطلوب', variant: 'destructive' });
      return;
    }

    const validReviewers = reviewers
      .map((reviewer) => ({ ...reviewer, name: reviewer.name.trim(), email: reviewer.email.trim().toLowerCase() }))
      .filter((reviewer) => reviewer.name && reviewer.email);

    if (!validReviewers.length || validReviewers.some((reviewer) => !isEmail(reviewer.email))) {
      toast({ title: 'بيانات المراجعين غير مكتملة', description: 'أدخل اسمًا وبريدًا صحيحًا لكل مراجع مستخدم.', variant: 'destructive' });
      return;
    }

    const uniqueEmails = new Set(validReviewers.map((reviewer) => reviewer.email));
    if (uniqueEmails.size !== validReviewers.length) {
      toast({ title: 'بريد مكرر', description: 'لا يمكن إضافة نفس البريد كمراجع أكثر من مرة للمستند.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    let successCount = 0;
    let invitationCount = 0;
    let emailedCount = 0;
    let lastDocumentId = '';

    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      setFileState(index, { status: 'uploading', progress: 10, error: undefined });

      const safeName = item.file.name.replace(/[^\p{L}\p{N}._-]+/gu, '-');
      const objectPath = `${user.id}/${crypto.randomUUID()}/${safeName}`;
      let storageUploaded = false;

      try {
        const { error: uploadError } = await supabase.storage
          .from('approval-documents')
          .upload(objectPath, item.file, {
            cacheControl: '3600',
            upsert: false,
            contentType: item.file.type,
          });
        if (uploadError) throw uploadError;
        storageUploaded = true;
        setFileState(index, { progress: 35 });

        const docTitle = files.length > 1 ? `${title.trim()} (${index + 1}/${files.length})` : title.trim();
        const number = `DOC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

        const { data: documentRow, error: documentError } = await supabase
          .from('documents')
          .insert({
            number,
            type: 'document',
            title: docTitle,
            description: description.trim() || null,
            sender_name: profile?.fullName || user.email || user.phone || 'مستخدم',
            project_id: projectId === 'none' ? null : projectId,
            file_bucket: 'approval-documents',
            file_path: objectPath,
            file_url: null,
            total: 0,
            currency: 'EGP',
            date: new Date().toISOString().slice(0, 10),
          })
          .select('id')
          .single();
        if (documentError) throw documentError;
        lastDocumentId = documentRow.id;

        setFileState(index, { progress: 55 });

        const { error: versionError } = await supabase.from('document_versions').insert({
          document_id: documentRow.id,
          version_number: 1,
          source: 'upload',
          file_bucket: 'approval-documents',
          file_path: objectPath,
          file_url: null,
          created_by: user.id,
          notes: 'النسخة الأصلية',
        });
        if (versionError) throw versionError;

        const { data: reviewerRows, error: reviewerError } = await supabase
          .from('document_reviewers')
          .insert(validReviewers.map((reviewer) => ({
            document_id: documentRow.id,
            reviewer_name: reviewer.name,
            reviewer_email: reviewer.email,
            department: reviewer.department,
            created_by: user.id,
          })))
          .select('id');
        if (reviewerError) throw reviewerError;

        setFileState(index, { progress: 70 });

        for (const reviewerRow of reviewerRows || []) {
          try {
            const { data: inviteData, error: inviteError } = await supabase.functions.invoke('send-review-email', {
              body: { reviewerId: reviewerRow.id },
            });
            if (inviteError) throw inviteError;
            if (inviteData?.success) {
              invitationCount += 1;
              if (inviteData.emailSent) emailedCount += 1;
            }
          } catch (inviteError) {
            console.error('[approvals] invitation creation failed', reviewerRow.id, inviteError);
          }
        }

        await invokeDocumentAction({ action: 'submit_review', documentId: documentRow.id });

        setFileState(index, { status: 'success', progress: 100 });
        successCount += 1;
      } catch (error) {
        console.error('[approvals] document creation failed', error);
        if (storageUploaded) {
          const { error: cleanupError } = await supabase.storage.from('approval-documents').remove([objectPath]);
          if (cleanupError) console.error('[approvals] orphan cleanup failed', cleanupError);
        }
        setFileState(index, {
          status: 'error',
          error: error instanceof Error ? error.message : 'فشل إنشاء المستند',
        });
      }
    }

    setUploading(false);

    if (!successCount) {
      toast({ title: 'فشل رفع المستندات', description: 'لم يتم إنشاء أي مستند.', variant: 'destructive' });
      return;
    }

    toast({
      title: 'تم إنشاء المستندات',
      description: `تم إنشاء ${successCount} مستند، وإنشاء ${invitationCount} رابط مراجعة، وإرسال ${emailedCount} بريد.`,
    });

    navigate(successCount === 1 && lastDocumentId ? `/approvals/documents/${lastDocumentId}` : '/approvals/documents');
  };

  return (
    <MainLayout title="رفع مستند جديد" subtitle="رفع PDF وربطه بمشروع وإرساله للمراجعين">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/approvals/documents')}>
          <ArrowRight className="me-2 h-4 w-4" />العودة
        </Button>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />مستند جديد</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>ملفات PDF</Label>
              <div
                onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => { event.preventDefault(); setDragActive(false); void handleFiles(event.dataTransfer.files); }}
                onClick={() => document.getElementById('approval-file-input')?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : files.length ? 'border-primary/50' : 'border-border'}`}
              >
                <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">اسحب الملفات هنا أو اضغط للاختيار</p>
                <p className="mt-2 text-xs text-muted-foreground">PDF فقط — حتى 50MB لكل ملف</p>
                <input
                  id="approval-file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={(event) => event.target.files && handleFiles(event.target.files)}
                  disabled={uploading}
                />
              </div>

              {files.length ? (
                <div className="space-y-2 pt-2">
                  {files.map((item, index) => (
                    <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        {item.status === 'pending' ? (
                          <Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); removeFile(index); }} disabled={uploading}>
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      {item.status !== 'pending' ? <Progress value={item.progress} className="mt-2 h-1" /> : null}
                      {item.status === 'error' ? <p className="mt-2 text-xs text-destructive">{item.error}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>المشروع</Label>
              <Select value={projectId} onValueChange={setProjectId} disabled={projectsLoading || uploading}>
                <SelectTrigger><SelectValue placeholder="اختر المشروع (اختياري)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مشروع</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}{project.status ? ` — ${project.status}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-title">عنوان المستند *</Label>
              <Input id="document-title" value={title} onChange={(event) => setTitle(event.target.value)} disabled={uploading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-description">الوصف</Label>
              <Textarea id="document-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} disabled={uploading} />
            </div>

            <div className="space-y-2">
              <Label>المرسل</Label>
              <Input value={profile?.fullName || user?.email || user?.phone || ''} disabled />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-bold">المراجعون</Label>
                <Button variant="outline" size="sm" onClick={addReviewer} disabled={uploading}>
                  <Plus className="me-2 h-4 w-4" />إضافة مراجع
                </Button>
              </div>

              {reviewers.map((reviewer, index) => (
                <Card key={reviewer.id}>
                  <CardContent className="p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-medium">مراجع {index + 1}</span>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeReviewer(reviewer.id)} disabled={reviewers.length === 1 || uploading}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>الإدارة</Label>
                        <Select value={reviewer.department} onValueChange={(value) => updateReviewer(reviewer.id, 'department', value)} disabled={uploading}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(departmentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>الاسم *</Label>
                        <Input value={reviewer.name} onChange={(event) => updateReviewer(reviewer.id, 'name', event.target.value)} disabled={uploading} />
                      </div>
                      <div className="space-y-2">
                        <Label>البريد *</Label>
                        <Input type="email" dir="ltr" value={reviewer.email} onChange={(event) => updateReviewer(reviewer.id, 'email', event.target.value)} disabled={uploading} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="w-full" size="lg" onClick={() => void handleSubmit()} disabled={uploading}>
              {uploading ? <Loader2 className="me-2 h-5 w-5 animate-spin" /> : <Send className="me-2 h-5 w-5" />}
              {uploading ? 'جارٍ الإنشاء والإرسال...' : 'رفع وإرسال للمراجعة'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
