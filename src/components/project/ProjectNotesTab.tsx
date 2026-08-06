import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  addProjectNoteComment,
  addProjectNoteMemberByEmail,
  createProjectNote,
  createProjectNoteSection,
  deleteProjectNote,
  deleteProjectNoteAttachment,
  fetchProjectNoteMembers,
  fetchProjectNotesBoard,
  fetchProjectNoteThread,
  projectNoteStatusOptions,
  removeProjectNoteMember,
  updateProjectNote,
  uploadProjectNoteAttachment,
} from '@/lib/projectNotes';
import type {
  ProjectNote,
  ProjectNoteAttachment,
  ProjectNoteMember,
  ProjectNoteMemberRole,
  ProjectNotePriority,
  ProjectNotesBoard,
  ProjectNoteThread,
  ProjectNoteStatus,
} from '@/types/projectNotes';
import {
  projectNotePriorityLabels,
  projectNoteRoleLabels,
  projectNoteStatusLabels,
} from '@/types/projectNotes';

interface ProjectNotesTabProps {
  projectId: string;
}

interface NewNoteForm {
  title: string;
  description: string;
  sectionId: string;
  newSectionTitle: string;
  priority: ProjectNotePriority;
  assignedTo: string;
  dueDate: string;
}

const emptyBoard: ProjectNotesBoard = { sections: [], notes: [] };
const emptyNewNote: NewNoteForm = {
  title: '',
  description: '',
  sectionId: '',
  newSectionTitle: '',
  priority: 'normal',
  assignedTo: '',
  dueDate: '',
};

const statusClasses: Record<ProjectNoteStatus, string> = {
  open: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  blocked: 'bg-red-100 text-red-800 border-red-200',
  done: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const priorityClasses: Record<ProjectNotePriority, string> = {
  low: 'bg-slate-50 text-slate-600 border-slate-200',
  normal: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'حدث خطأ غير متوقع';

const formatFileSize = (size: number | null): string => {
  if (size === null) return '';
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(1)} ميجابايت`;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const ProjectNotesTab: React.FC<ProjectNotesTabProps> = ({ projectId }) => {
  const [board, setBoard] = useState<ProjectNotesBoard>(emptyBoard);
  const [members, setMembers] = useState<ProjectNoteMember[]>([]);
  const [threads, setThreads] = useState<Record<string, ProjectNoteThread>>({});
  const [threadLoading, setThreadLoading] = useState<Record<string, boolean>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const [uploadingNoteId, setUploadingNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectNoteStatus>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [newNote, setNewNote] = useState<NewNoteForm>(emptyNewNote);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<ProjectNoteMemberRole>('commenter');
  const [savingMember, setSavingMember] = useState(false);
  const { toast } = useToast();

  const loadModule = useCallback(async () => {
    setLoading(true);
    try {
      const [nextBoard, nextMembers] = await Promise.all([
        fetchProjectNotesBoard(projectId),
        fetchProjectNoteMembers(projectId),
      ]);
      setBoard(nextBoard);
      setMembers(nextMembers);
      setNewNote((current) => ({
        ...current,
        sectionId: current.sectionId || nextBoard.sections[0]?.id || '',
      }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر تحميل ملاحظات المشروع',
        description: errorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    void loadModule();
  }, [loadModule]);

  const memberById = useMemo(
    () => new Map(members.map((member) => [member.user_id, member])),
    [members],
  );

  const filteredNotes = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('ar');
    return board.notes.filter((note) => {
      const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
      const section = board.sections.find((item) => item.id === note.section_id);
      const matchesSearch =
        !normalizedSearch ||
        note.title.toLocaleLowerCase('ar').includes(normalizedSearch) ||
        (note.description || '').toLocaleLowerCase('ar').includes(normalizedSearch) ||
        (section?.title || '').toLocaleLowerCase('ar').includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [board.notes, board.sections, search, statusFilter]);

  const stats = useMemo(() => {
    const total = board.notes.length;
    const done = board.notes.filter((note) => note.status === 'done').length;
    const inProgress = board.notes.filter((note) => note.status === 'in_progress').length;
    const blocked = board.notes.filter((note) => note.status === 'blocked').length;
    return {
      total,
      done,
      inProgress,
      blocked,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  }, [board.notes]);

  const patchNoteLocally = (updated: ProjectNote): void => {
    setBoard((current) => ({
      ...current,
      notes: current.notes.map((note) =>
        note.id === updated.id
          ? {
              ...note,
              ...updated,
              comment_count: note.comment_count,
              attachment_count: note.attachment_count,
            }
          : note,
      ),
    }));
  };

  const handleNoteUpdate = async (
    note: ProjectNote,
    patch: Partial<
      Pick<ProjectNote, 'status' | 'priority' | 'assigned_to' | 'due_date'>
    >,
  ): Promise<void> => {
    setBusyNoteId(note.id);
    try {
      const updated = await updateProjectNote(note.id, patch);
      patchNoteLocally(updated);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر تحديث الملاحظة',
        description: errorMessage(error),
      });
    } finally {
      setBusyNoteId(null);
    }
  };

  const handleDeleteNote = async (note: ProjectNote): Promise<void> => {
    if (!window.confirm(`حذف الملاحظة: ${note.title}؟`)) return;
    setBusyNoteId(note.id);
    try {
      await deleteProjectNote(note.id);
      setBoard((current) => ({
        ...current,
        notes: current.notes.filter((item) => item.id !== note.id),
      }));
      setExpandedNoteId((current) => (current === note.id ? null : current));
      toast({ title: 'تم حذف الملاحظة' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الملاحظة',
        description: errorMessage(error),
      });
    } finally {
      setBusyNoteId(null);
    }
  };

  const loadThread = async (noteId: string, force = false): Promise<void> => {
    if (threads[noteId] && !force) return;
    setThreadLoading((current) => ({ ...current, [noteId]: true }));
    try {
      const thread = await fetchProjectNoteThread(noteId);
      setThreads((current) => ({ ...current, [noteId]: thread }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر تحميل المناقشة والمرفقات',
        description: errorMessage(error),
      });
    } finally {
      setThreadLoading((current) => ({ ...current, [noteId]: false }));
    }
  };

  const handleExpandNote = async (noteId: string): Promise<void> => {
    if (expandedNoteId === noteId) {
      setExpandedNoteId(null);
      return;
    }
    setExpandedNoteId(noteId);
    await loadThread(noteId);
  };

  const handleAddComment = async (note: ProjectNote): Promise<void> => {
    const body = commentDrafts[note.id]?.trim();
    if (!body) return;
    setBusyNoteId(note.id);
    try {
      const comment = await addProjectNoteComment(projectId, note.id, body);
      setThreads((current) => ({
        ...current,
        [note.id]: {
          comments: [...(current[note.id]?.comments || []), comment],
          attachments: current[note.id]?.attachments || [],
        },
      }));
      setCommentDrafts((current) => ({ ...current, [note.id]: '' }));
      setBoard((current) => ({
        ...current,
        notes: current.notes.map((item) =>
          item.id === note.id ? { ...item, comment_count: item.comment_count + 1 } : item,
        ),
      }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر إضافة التعليق',
        description: errorMessage(error),
      });
    } finally {
      setBusyNoteId(null);
    }
  };

  const handleUpload = async (note: ProjectNote, file: File): Promise<void> => {
    setUploadingNoteId(note.id);
    try {
      const attachment = await uploadProjectNoteAttachment(projectId, note.id, file);
      setThreads((current) => ({
        ...current,
        [note.id]: {
          comments: current[note.id]?.comments || [],
          attachments: [...(current[note.id]?.attachments || []), attachment],
        },
      }));
      setBoard((current) => ({
        ...current,
        notes: current.notes.map((item) =>
          item.id === note.id ? { ...item, attachment_count: item.attachment_count + 1 } : item,
        ),
      }));
      toast({ title: 'تم رفع الملف بنجاح', description: file.name });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر رفع الملف',
        description: errorMessage(error),
      });
    } finally {
      setUploadingNoteId(null);
    }
  };

  const handleDeleteAttachment = async (
    note: ProjectNote,
    attachment: ProjectNoteAttachment,
  ): Promise<void> => {
    if (!window.confirm(`حذف الملف: ${attachment.file_name}؟`)) return;
    try {
      await deleteProjectNoteAttachment(attachment);
      setThreads((current) => ({
        ...current,
        [note.id]: {
          comments: current[note.id]?.comments || [],
          attachments: (current[note.id]?.attachments || []).filter(
            (item) => item.id !== attachment.id,
          ),
        },
      }));
      setBoard((current) => ({
        ...current,
        notes: current.notes.map((item) =>
          item.id === note.id
            ? { ...item, attachment_count: Math.max(0, item.attachment_count - 1) }
            : item,
        ),
      }));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر حذف الملف',
        description: errorMessage(error),
      });
    }
  };

  const handleCreateNote = async (): Promise<void> => {
    if (!newNote.title.trim()) {
      toast({ variant: 'destructive', title: 'اكتب عنوان الملاحظة أولًا' });
      return;
    }

    try {
      let sectionId = newNote.sectionId;
      let nextSections = board.sections;

      if (newNote.newSectionTitle.trim()) {
        const section = await createProjectNoteSection(
          projectId,
          newNote.newSectionTitle,
          Math.max(0, ...board.sections.map((item) => item.position)) + 10,
        );
        sectionId = section.id;
        nextSections = [...board.sections, section].sort((a, b) => a.position - b.position);
      }

      if (!sectionId) {
        toast({ variant: 'destructive', title: 'اختر قسمًا أو أنشئ قسمًا جديدًا' });
        return;
      }

      const sectionPositions = board.notes
        .filter((note) => note.section_id === sectionId)
        .map((note) => note.position);
      const note = await createProjectNote({
        projectId,
        sectionId,
        title: newNote.title,
        description: newNote.description,
        priority: newNote.priority,
        assignedTo: newNote.assignedTo || null,
        dueDate: newNote.dueDate || null,
        position: Math.max(0, ...sectionPositions) + 10,
      });

      setBoard((current) => ({
        sections: nextSections,
        notes: [...current.notes, note],
      }));
      setNewNote({ ...emptyNewNote, sectionId });
      setShowAddForm(false);
      toast({ title: 'تمت إضافة الملاحظة' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذر إضافة الملاحظة',
        description: errorMessage(error),
      });
    }
  };

  const handleAddMember = async (): Promise<void> => {
    if (!memberEmail.trim()) return;
    setSavingMember(true);
    try {
      const member = await addProjectNoteMemberByEmail(projectId, memberEmail, memberRole);
      setMembers((current) => [
        ...current.filter((item) => item.user_id !== member.user_id),
        member,
      ]);
      setMemberEmail('');
      toast({ title: 'تمت مشاركة ملاحظات المشروع', description: member.email });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذرت إضافة العضو',
        description: errorMessage(error),
      });
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (member: ProjectNoteMember): Promise<void> => {
    if (!window.confirm(`إزالة صلاحية ${member.email} من ملاحظات المشروع؟`)) return;
    try {
      await removeProjectNoteMember(projectId, member.user_id);
      setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'تعذرت إزالة العضو',
        description: errorMessage(error),
      });
    }
  };

  const handleShareLink = async (): Promise<void> => {
    const url = `${window.location.origin}/projects/${projectId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ملاحظات المشروع', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'تم نسخ رابط المشروع' });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({
        variant: 'destructive',
        title: 'تعذرت مشاركة الرابط',
        description: errorMessage(error),
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-64 items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-construction-primary" />
          <span>جارٍ تحميل ملاحظات المشروع...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">إجمالي الملاحظات</p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">متوقفة</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{stats.blocked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">مكتملة</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{stats.done}</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">نسبة الإغلاق</p>
            <p className="mt-1 text-2xl font-bold text-construction-primary">{stats.progress}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-construction-primary" />
              ملاحظات تنفيذ المشروع
            </CardTitle>
            <CardDescription className="mt-1">
              أقسام وبنود قابلة للإسناد والمتابعة والتعليق وإرفاق الملفات.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void handleShareLink()}>
              <Share2 className="ml-2 h-4 w-4" />
              مشاركة الرابط
            </Button>
            <Button variant="outline" onClick={() => setShowSharePanel((value) => !value)}>
              <Users className="ml-2 h-4 w-4" />
              الأعضاء ({members.length})
            </Button>
            <Button onClick={() => setShowAddForm((value) => !value)}>
              {showAddForm ? <X className="ml-2 h-4 w-4" /> : <Plus className="ml-2 h-4 w-4" />}
              {showAddForm ? 'إلغاء' : 'إضافة ملاحظة'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSharePanel && (
            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 font-semibold">
                <UserPlus className="h-5 w-5 text-construction-primary" />
                مشاركة الموديول مع مستخدم مسجل
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="البريد الإلكتروني للمستخدم"
                />
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value as ProjectNoteMemberRole)}
                >
                  {(Object.keys(projectNoteRoleLabels) as ProjectNoteMemberRole[]).map((role) => (
                    <option key={role} value={role}>
                      {projectNoteRoleLabels[role]}
                    </option>
                  ))}
                </select>
                <Button disabled={savingMember || !memberEmail.trim()} onClick={() => void handleAddMember()}>
                  {savingMember && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إضافة
                </Button>
              </div>
              {members.length > 0 && (
                <div className="mt-4 divide-y rounded-md border bg-white">
                  {members.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.full_name || member.email}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{projectNoteRoleLabels[member.role]}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleRemoveMember(member)}
                          aria-label="إزالة العضو"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAddForm && (
            <div className="rounded-lg border border-dashed border-construction-primary/40 bg-construction-primary/5 p-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-sm font-medium">عنوان الملاحظة</label>
                  <Input
                    value={newNote.title}
                    onChange={(event) => setNewNote((current) => ({ ...current, title: event.target.value }))}
                    placeholder="مثال: مراجعة تثبيت قاعدة التواليت"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-sm font-medium">تفاصيل إضافية</label>
                  <Textarea
                    value={newNote.description}
                    onChange={(event) =>
                      setNewNote((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="الوصف، القياسات، المطلوب تنفيذه أو معيار الاستلام"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">القسم الحالي</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={newNote.sectionId}
                    onChange={(event) =>
                      setNewNote((current) => ({ ...current, sectionId: event.target.value }))
                    }
                  >
                    <option value="">اختر القسم</option>
                    {board.sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">أو قسم جديد</label>
                  <Input
                    value={newNote.newSectionTitle}
                    onChange={(event) =>
                      setNewNote((current) => ({ ...current, newSectionTitle: event.target.value }))
                    }
                    placeholder="اسم منطقة أو بند جديد"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">الأولوية</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={newNote.priority}
                    onChange={(event) =>
                      setNewNote((current) => ({
                        ...current,
                        priority: event.target.value as ProjectNotePriority,
                      }))
                    }
                  >
                    {(Object.keys(projectNotePriorityLabels) as ProjectNotePriority[]).map((priority) => (
                      <option key={priority} value={priority}>
                        {projectNotePriorityLabels[priority]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">المسؤول</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={newNote.assignedTo}
                    onChange={(event) =>
                      setNewNote((current) => ({ ...current, assignedTo: event.target.value }))
                    }
                  >
                    <option value="">غير مسند</option>
                    {members.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.full_name || member.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">تاريخ الاستحقاق</label>
                  <Input
                    type="date"
                    value={newNote.dueDate}
                    onChange={(event) =>
                      setNewNote((current) => ({ ...current, dueDate: event.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => void handleCreateNote()}>
                  <Save className="ml-2 h-4 w-4" />
                  حفظ الملاحظة
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="بحث في الأقسام والملاحظات..."
              />
            </div>
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | ProjectNoteStatus)
              }
            >
              <option value="all">كل الحالات</option>
              {projectNoteStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {projectNoteStatusLabels[status]}
                </option>
              ))}
            </select>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              لا توجد ملاحظات مطابقة للبحث أو التصفية.
            </div>
          ) : (
            <Accordion
              key={board.sections.map((section) => section.id).join('-')}
              type="multiple"
              defaultValue={board.sections.map((section) => section.id)}
              className="space-y-3"
            >
              {board.sections.map((section) => {
                const sectionNotes = filteredNotes.filter((note) => note.section_id === section.id);
                if (sectionNotes.length === 0) return null;
                const completed = sectionNotes.filter((note) => note.status === 'done').length;

                return (
                  <AccordionItem
                    key={section.id}
                    value={section.id}
                    className="rounded-lg border px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center justify-between gap-3 pl-3 text-right">
                        <div>
                          <p className="font-bold">{section.title}</p>
                          {section.description && (
                            <p className="text-xs font-normal text-muted-foreground">
                              {section.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline">
                          {completed}/{sectionNotes.length} مكتمل
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      {sectionNotes.map((note) => {
                        const thread = threads[note.id];
                        const isExpanded = expandedNoteId === note.id;
                        const assignee = note.assigned_to
                          ? memberById.get(note.assigned_to)
                          : undefined;

                        return (
                          <div
                            key={note.id}
                            className={`rounded-lg border p-4 transition-colors ${
                              note.status === 'done' ? 'bg-green-50/50' : 'bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                className="mt-1"
                                checked={note.status === 'done'}
                                disabled={busyNoteId === note.id}
                                onCheckedChange={() =>
                                  void handleNoteUpdate(note, {
                                    status: note.status === 'done' ? 'open' : 'done',
                                  })
                                }
                                aria-label="تغيير حالة الإكمال"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div>
                                    <p
                                      className={`font-semibold ${
                                        note.status === 'done'
                                          ? 'text-muted-foreground line-through'
                                          : ''
                                      }`}
                                    >
                                      {note.title}
                                    </p>
                                    {note.description && (
                                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                        {note.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={statusClasses[note.status]}>
                                      {note.status === 'done' ? (
                                        <CheckCircle2 className="ml-1 h-3 w-3" />
                                      ) : note.status === 'blocked' ? (
                                        <AlertTriangle className="ml-1 h-3 w-3" />
                                      ) : note.status === 'in_progress' ? (
                                        <Clock3 className="ml-1 h-3 w-3" />
                                      ) : (
                                        <Circle className="ml-1 h-3 w-3" />
                                      )}
                                      {projectNoteStatusLabels[note.status]}
                                    </Badge>
                                    <Badge variant="outline" className={priorityClasses[note.priority]}>
                                      {projectNotePriorityLabels[note.priority]}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {assignee && <span>المسؤول: {assignee.full_name || assignee.email}</span>}
                                  {note.due_date && <span>الاستحقاق: {note.due_date}</span>}
                                  {note.source_reference && <span>المرجع: {note.source_reference}</span>}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => void handleExpandNote(note.id)}
                                  >
                                    <MessageSquare className="ml-1 h-3.5 w-3.5" />
                                    {note.comment_count}
                                    <Paperclip className="mr-2 ml-1 h-3.5 w-3.5" />
                                    {note.attachment_count}
                                    <ChevronDown
                                      className={`mr-2 h-3.5 w-3.5 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-4 space-y-4 border-t pt-4">
                                <div className="grid gap-3 md:grid-cols-4">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium">الحالة</label>
                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                      value={note.status}
                                      disabled={busyNoteId === note.id}
                                      onChange={(event) =>
                                        void handleNoteUpdate(note, {
                                          status: event.target.value as ProjectNoteStatus,
                                        })
                                      }
                                    >
                                      {projectNoteStatusOptions.map((status) => (
                                        <option key={status} value={status}>
                                          {projectNoteStatusLabels[status]}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium">الأولوية</label>
                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                      value={note.priority}
                                      disabled={busyNoteId === note.id}
                                      onChange={(event) =>
                                        void handleNoteUpdate(note, {
                                          priority: event.target.value as ProjectNotePriority,
                                        })
                                      }
                                    >
                                      {(Object.keys(projectNotePriorityLabels) as ProjectNotePriority[]).map(
                                        (priority) => (
                                          <option key={priority} value={priority}>
                                            {projectNotePriorityLabels[priority]}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium">المسؤول</label>
                                    <select
                                      className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                      value={note.assigned_to || ''}
                                      disabled={busyNoteId === note.id}
                                      onChange={(event) =>
                                        void handleNoteUpdate(note, {
                                          assigned_to: event.target.value || null,
                                        })
                                      }
                                    >
                                      <option value="">غير مسند</option>
                                      {members.map((member) => (
                                        <option key={member.user_id} value={member.user_id}>
                                          {member.full_name || member.email}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-xs font-medium">الاستحقاق</label>
                                    <Input
                                      type="date"
                                      className="h-9 text-xs"
                                      value={note.due_date || ''}
                                      disabled={busyNoteId === note.id}
                                      onChange={(event) =>
                                        void handleNoteUpdate(note, {
                                          due_date: event.target.value || null,
                                        })
                                      }
                                    />
                                  </div>
                                </div>

                                {threadLoading[note.id] ? (
                                  <div className="flex items-center justify-center gap-2 py-6">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    تحميل المناقشة...
                                  </div>
                                ) : (
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-3">
                                      <p className="font-semibold">المناقشة</p>
                                      <div className="max-h-64 space-y-2 overflow-y-auto">
                                        {(thread?.comments || []).length === 0 ? (
                                          <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">
                                            لا توجد تعليقات حتى الآن.
                                          </p>
                                        ) : (
                                          thread.comments.map((comment) => {
                                            const author = comment.created_by
                                              ? memberById.get(comment.created_by)
                                              : undefined;
                                            return (
                                              <div key={comment.id} className="rounded-md border bg-slate-50 p-3">
                                                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                                  <span>{author?.full_name || author?.email || 'مستخدم المشروع'}</span>
                                                  <span>{formatDate(comment.created_at)}</span>
                                                </div>
                                                <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                      <Textarea
                                        value={commentDrafts[note.id] || ''}
                                        onChange={(event) =>
                                          setCommentDrafts((current) => ({
                                            ...current,
                                            [note.id]: event.target.value,
                                          }))
                                        }
                                        placeholder="أضف تحديثًا أو تعليقًا..."
                                      />
                                      <Button
                                        size="sm"
                                        disabled={busyNoteId === note.id || !commentDrafts[note.id]?.trim()}
                                        onClick={() => void handleAddComment(note)}
                                      >
                                        <MessageSquare className="ml-2 h-4 w-4" />
                                        إضافة تعليق
                                      </Button>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold">المرفقات</p>
                                        <label className="inline-flex cursor-pointer items-center rounded-md border bg-background px-3 py-2 text-xs font-medium hover:bg-accent">
                                          {uploadingNoteId === note.id ? (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <Upload className="ml-2 h-4 w-4" />
                                          )}
                                          رفع ملف
                                          <input
                                            type="file"
                                            className="hidden"
                                            disabled={uploadingNoteId === note.id}
                                            onChange={(event) => {
                                              const file = event.currentTarget.files?.[0];
                                              if (file) void handleUpload(note, file);
                                              event.currentTarget.value = '';
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <div className="max-h-72 divide-y overflow-y-auto rounded-md border">
                                        {(thread?.attachments || []).length === 0 ? (
                                          <p className="p-4 text-center text-sm text-muted-foreground">
                                            لا توجد مرفقات.
                                          </p>
                                        ) : (
                                          thread.attachments.map((attachment) => (
                                            <div
                                              key={attachment.id}
                                              className="flex items-center justify-between gap-3 p-3"
                                            >
                                              <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                  {attachment.file_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {formatFileSize(attachment.file_size)}
                                                </p>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                {attachment.signed_url && (
                                                  <Button variant="ghost" size="icon" asChild>
                                                    <a
                                                      href={attachment.signed_url}
                                                      target="_blank"
                                                      rel="noreferrer"
                                                      aria-label="فتح الملف"
                                                    >
                                                      <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                  </Button>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    void handleDeleteAttachment(note, attachment)
                                                  }
                                                  aria-label="حذف الملف"
                                                >
                                                  <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex justify-end border-t pt-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    disabled={busyNoteId === note.id}
                                    onClick={() => void handleDeleteNote(note)}
                                  >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    حذف الملاحظة
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectNotesTab;
