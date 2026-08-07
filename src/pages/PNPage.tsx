import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Circle,
  FilePlus2,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import {
  addPNComment,
  createPNNote,
  createPNProject,
  deletePNNote,
  deletePNProject,
  fetchPNBoard,
  fetchPNThread,
  setPNNoteStatus,
  uploadPNAttachment,
  type PNAttachment,
  type PNBoard,
  type PNComment,
  type PNNote,
  type PNStatus,
} from '@/lib/pn';

const EMPTY_BOARD: PNBoard = { projects: [], sections: [], notes: [] };

const STATUS_LABELS: Record<PNStatus, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد التنفيذ',
  blocked: 'يوجد عائق',
  done: 'مكتملة',
};

const STATUS_CLASSES: Record<PNStatus, string> = {
  open: 'border-slate-200 bg-slate-50 text-slate-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-800',
  blocked: 'border-red-200 bg-red-50 text-red-800',
  done: 'border-green-200 bg-green-50 text-green-800',
};

interface ThreadState {
  comments: PNComment[];
  attachments: PNAttachment[];
}

const formatSize = (size: number | null): string => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} ك.ب`;
  return `${(size / (1024 * 1024)).toFixed(1)} م.ب`;
};

const PNPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [board, setBoard] = useState<PNBoard>(EMPTY_BOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Record<string, ThreadState>>({});
  const [loadingThread, setLoadingThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PNStatus>('all');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [blockerDrafts, setBlockerDrafts] = useState<Record<string, string>>({});
  const cameraInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadBoard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const nextBoard = await fetchPNBoard();
      setBoard(nextBoard);
      setSelectedProjectId((current) => {
        if (current && nextBoard.projects.some((project) => project.id === current)) return current;
        return nextBoard.projects[0]?.id || null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل PN');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const selectedProject = board.projects.find((project) => project.id === selectedProjectId) || null;
  const projectSections = board.sections.filter((section) => section.project_id === selectedProjectId);
  const projectNotes = board.notes.filter((note) => note.project_id === selectedProjectId);

  const filteredNotes = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('ar');
    return projectNotes.filter((note) => {
      const section = projectSections.find((item) => item.id === note.section_id);
      return (statusFilter === 'all' || note.status === statusFilter)
        && (!normalized
          || note.title.toLocaleLowerCase('ar').includes(normalized)
          || (note.description || '').toLocaleLowerCase('ar').includes(normalized)
          || (section?.title || '').toLocaleLowerCase('ar').includes(normalized));
    });
  }, [projectNotes, projectSections, search, statusFilter]);

  const stats = useMemo(() => {
    const total = projectNotes.length;
    const done = projectNotes.filter((note) => note.status === 'done').length;
    return { total, done, progress: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [projectNotes]);

  const requireWhatsAppIdentity = (): boolean => {
    if (user) return true;
    navigate(`/auth?returnTo=${encodeURIComponent('/pn')}`);
    return false;
  };

  const refreshThread = async (noteId: string): Promise<void> => {
    const thread = await fetchPNThread(noteId);
    setThreads((current) => ({ ...current, [noteId]: thread }));
  };

  const toggleThread = async (noteId: string): Promise<void> => {
    if (expandedNoteId === noteId) {
      setExpandedNoteId(null);
      return;
    }
    setExpandedNoteId(noteId);
    setLoadingThread(noteId);
    try {
      await refreshThread(noteId);
    } finally {
      setLoadingThread(null);
    }
  };

  const handleCreateProject = async (): Promise<void> => {
    if (!requireWhatsAppIdentity() || !newProjectName.trim()) return;
    setWorking('create-project');
    try {
      const project = await createPNProject(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      await loadBoard();
      setSelectedProjectId(project.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر إنشاء المشروع');
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteProject = async (): Promise<void> => {
    if (!selectedProject || !requireWhatsAppIdentity()) return;
    if (!window.confirm(`حذف مشروع ${selectedProject.name} وكل ملاحظاته؟`)) return;
    setWorking('delete-project');
    try {
      await deletePNProject(selectedProject.id);
      await loadBoard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر حذف المشروع');
    } finally {
      setWorking(null);
    }
  };

  const handleCreateNote = async (): Promise<void> => {
    if (!selectedProjectId || !newNoteTitle.trim() || !requireWhatsAppIdentity()) return;
    setWorking('create-note');
    try {
      await createPNNote(
        selectedProjectId,
        projectSections[0]?.id || null,
        newNoteTitle,
        newNoteDescription,
        projectNotes.length,
      );
      setNewNoteTitle('');
      setNewNoteDescription('');
      await loadBoard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر إنشاء الملاحظة');
    } finally {
      setWorking(null);
    }
  };

  const handleDeleteNote = async (note: PNNote): Promise<void> => {
    if (!requireWhatsAppIdentity()) return;
    if (!window.confirm(`حذف الملاحظة: ${note.title}؟`)) return;
    setWorking(`delete-${note.id}`);
    try {
      await deletePNNote(note.id);
      await loadBoard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر حذف الملاحظة');
    } finally {
      setWorking(null);
    }
  };

  const handleStatus = async (note: PNNote, status: PNStatus): Promise<void> => {
    setWorking(`status-${note.id}`);
    try {
      const blocker = status === 'blocked' ? blockerDrafts[note.id] : undefined;
      await setPNNoteStatus(note.id, status, blocker);
      if (status === 'blocked') setBlockerDrafts((current) => ({ ...current, [note.id]: '' }));
      await loadBoard();
      if (expandedNoteId === note.id) await refreshThread(note.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر تحديث الحالة');
    } finally {
      setWorking(null);
    }
  };

  const handleComment = async (note: PNNote): Promise<void> => {
    const body = commentDrafts[note.id]?.trim();
    if (!body) return;
    setWorking(`comment-${note.id}`);
    try {
      await addPNComment(note.project_id, note.id, body);
      setCommentDrafts((current) => ({ ...current, [note.id]: '' }));
      await refreshThread(note.id);
      await loadBoard();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر إضافة التعليق');
    } finally {
      setWorking(null);
    }
  };

  const handleUpload = async (note: PNNote, file: File | undefined): Promise<void> => {
    if (!file) return;
    setWorking(`upload-${note.id}`);
    try {
      await uploadPNAttachment(note.project_id, note.id, file);
      await refreshThread(note.id);
      await loadBoard();
      setExpandedNoteId(note.id);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'تعذر رفع الملف');
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <PageLayout title="PN">
        <div className="flex min-h-[60vh] items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          جارٍ تحميل الملاحظات...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="PN | ملاحظات المشروعات">
      <main className="mx-auto w-full max-w-7xl space-y-4 overflow-x-hidden px-1 pb-24 sm:px-0" dir="rtl">
        <Card>
          <CardHeader className="gap-3 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">PN</CardTitle>
                <CardDescription>ملاحظات المشروعات — القراءة والعمل الميداني متاحان مباشرة من الهاتف.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadBoard()}>
                <RefreshCw className="ml-2 h-4 w-4" /> تحديث
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {board.projects.map((project) => (
                <Button
                  key={project.id}
                  variant={selectedProjectId === project.id ? 'default' : 'outline'}
                  className="shrink-0"
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.name}
                </Button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="اسم مشروع جديد" />
              <Input value={newProjectDescription} onChange={(event) => setNewProjectDescription(event.target.value)} placeholder="وصف مختصر" />
              <Button onClick={() => void handleCreateProject()} disabled={!newProjectName.trim() || working === 'create-project'}>
                {working === 'create-project' ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Plus className="ml-2 h-4 w-4" />}
                إنشاء مشروع
              </Button>
            </div>
            {!user && (
              <p className="text-xs text-muted-foreground">
                عند إنشاء أو حذف مشروع أو ملاحظة سيُطلب تعريفك عبر واتساب ثم تعود إلى PN.
              </p>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-start justify-between gap-3 p-4 text-sm text-red-800">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)}>×</button>
            </CardContent>
          </Card>
        )}

        {!selectedProject ? (
          <Card><CardContent className="py-14 text-center text-muted-foreground">أنشئ أول مشروع للبدء.</CardContent></Card>
        ) : (
          <>
            <Card>
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الملاحظات</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">نسبة الإنجاز</p>
                    <p className="text-3xl font-bold text-green-700">{stats.progress}%</p>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100" aria-label={`نسبة الإنجاز ${stats.progress}%`}>
                  <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${stats.progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{stats.done} مكتملة من {stats.total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{selectedProject.name}</CardTitle>
                    {selectedProject.description && <CardDescription>{selectedProject.description}</CardDescription>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => void handleDeleteProject()} disabled={working === 'delete-project'}>
                    <Trash2 className="ml-2 h-4 w-4" /> حذف المشروع
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input value={newNoteTitle} onChange={(event) => setNewNoteTitle(event.target.value)} placeholder="عنوان الملاحظة" />
                  <Input value={newNoteDescription} onChange={(event) => setNewNoteDescription(event.target.value)} placeholder="وصف الملاحظة" />
                  <Button onClick={() => void handleCreateNote()} disabled={!newNoteTitle.trim() || working === 'create-note'}>
                    <FilePlus2 className="ml-2 h-4 w-4" /> إضافة ملاحظة
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-[1fr_190px]">
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في الملاحظات..." />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | PNStatus)}
                  >
                    <option value="all">كل الحالات</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card>

            <section className="space-y-3">
              {filteredNotes.map((note) => {
                const thread = threads[note.id];
                const isExpanded = expandedNoteId === note.id;
                const isWorking = working?.endsWith(note.id) || working === `status-${note.id}`;
                return (
                  <Card key={note.id} className={note.status === 'done' ? 'border-green-200 bg-green-50/40' : ''}>
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <h2 className={`font-bold ${note.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{note.title}</h2>
                            <Badge variant="outline" className={STATUS_CLASSES[note.status]}>{STATUS_LABELS[note.status]}</Badge>
                          </div>
                          {note.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{note.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => void handleDeleteNote(note)} aria-label="حذف الملاحظة">
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <Button variant="outline" className="h-12" onClick={() => void handleStatus(note, 'in_progress')} disabled={isWorking}>
                          <Circle className="ml-2 h-4 w-4 text-blue-600" /> قيد التنفيذ
                        </Button>
                        <Button variant="outline" className="h-12 border-green-300 bg-green-50 text-green-800" onClick={() => void handleStatus(note, 'done')} disabled={isWorking}>
                          <CheckCircle2 className="ml-2 h-4 w-4" /> مكتملة
                        </Button>
                        <Button variant="outline" className="h-12 border-red-300 bg-red-50 text-red-800" onClick={() => void handleStatus(note, 'blocked')} disabled={isWorking}>
                          <AlertTriangle className="ml-2 h-4 w-4" /> يوجد عائق
                        </Button>
                        <Button variant="outline" className="h-12" onClick={() => void toggleThread(note.id)}>
                          <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /> التفاصيل
                        </Button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <Input
                          value={blockerDrafts[note.id] || ''}
                          onChange={(event) => setBlockerDrafts((current) => ({ ...current, [note.id]: event.target.value }))}
                          placeholder="سبب العائق — يُحفظ عند الضغط على يوجد عائق"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            ref={(element) => { cameraInputRefs.current[note.id] = element; }}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(event) => void handleUpload(note, event.target.files?.[0])}
                          />
                          <Button variant="outline" className="h-11" onClick={() => cameraInputRefs.current[note.id]?.click()} disabled={working === `upload-${note.id}`}>
                            <Camera className="ml-2 h-4 w-4" /> تصوير
                          </Button>
                          <input
                            ref={(element) => { fileInputRefs.current[note.id] = element; }}
                            type="file"
                            className="hidden"
                            onChange={(event) => void handleUpload(note, event.target.files?.[0])}
                          />
                          <Button variant="outline" className="h-11" onClick={() => fileInputRefs.current[note.id]?.click()} disabled={working === `upload-${note.id}`}>
                            <Upload className="ml-2 h-4 w-4" /> ملف
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {note.comment_count || 0}</span>
                        <span className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> {note.attachment_count || 0}</span>
                      </div>

                      {isExpanded && (
                        <div className="space-y-4 border-t pt-4">
                          {loadingThread === note.id ? (
                            <div className="flex justify-center py-5"><Loader2 className="h-5 w-5 animate-spin" /></div>
                          ) : (
                            <>
                              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                                <Input
                                  value={commentDrafts[note.id] || ''}
                                  onChange={(event) => setCommentDrafts((current) => ({ ...current, [note.id]: event.target.value }))}
                                  placeholder="اكتب تعليقًا أو تحديثًا..."
                                />
                                <Button onClick={() => void handleComment(note)} disabled={!commentDrafts[note.id]?.trim() || working === `comment-${note.id}`}>
                                  <MessageSquare className="ml-2 h-4 w-4" /> إرسال
                                </Button>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-2">
                                  <h3 className="font-semibold">التعليقات</h3>
                                  {(thread?.comments || []).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد تعليقات.</p> : thread.comments.map((comment) => (
                                    <div key={comment.id} className="rounded-lg border bg-white p-3 text-sm">
                                      <p className="whitespace-pre-wrap">{comment.body}</p>
                                      <p className="mt-1 text-[11px] text-muted-foreground">{new Date(comment.created_at).toLocaleString('ar-EG')}</p>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <h3 className="font-semibold">الصور والملفات</h3>
                                  {(thread?.attachments || []).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مرفقات.</p> : thread.attachments.map((attachment) => (
                                    <a
                                      key={attachment.id}
                                      href={attachment.signed_url || '#'}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3 text-sm"
                                    >
                                      <span className="min-w-0 truncate">{attachment.file_name}</span>
                                      <span className="shrink-0 text-xs text-muted-foreground">{formatSize(attachment.file_size)}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {filteredNotes.length === 0 && (
                <Card><CardContent className="py-14 text-center text-muted-foreground">لا توجد ملاحظات مطابقة.</CardContent></Card>
              )}
            </section>
          </>
        )}

        {!user && (
          <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
            <Button className="h-12 w-full shadow-lg" asChild>
              <Link to={`/auth?returnTo=${encodeURIComponent('/pn')}`}>
                تعريف المستخدم عبر واتساب لإنشاء أو حذف
              </Link>
            </Button>
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default PNPage;
