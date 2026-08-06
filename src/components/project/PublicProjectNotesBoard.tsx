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
  RefreshCw,
  Search,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchProjectNotesBoard, fetchProjectNoteThread, projectNoteStatusOptions } from '@/lib/projectNotes';
import type {
  ProjectNotePriority,
  ProjectNotesBoard,
  ProjectNoteStatus,
  ProjectNoteThread,
} from '@/types/projectNotes';
import {
  projectNotePriorityLabels,
  projectNoteStatusLabels,
} from '@/types/projectNotes';

interface PublicProjectNotesBoardProps {
  projectId: string;
}

const emptyBoard: ProjectNotesBoard = { sections: [], notes: [] };

const statusClasses: Record<ProjectNoteStatus, string> = {
  open: 'border-slate-200 bg-slate-100 text-slate-700',
  in_progress: 'border-blue-200 bg-blue-100 text-blue-800',
  blocked: 'border-red-200 bg-red-100 text-red-800',
  done: 'border-green-200 bg-green-100 text-green-800',
  cancelled: 'border-gray-200 bg-gray-100 text-gray-500',
};

const priorityClasses: Record<ProjectNotePriority, string> = {
  low: 'border-slate-200 bg-slate-50 text-slate-600',
  normal: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-orange-200 bg-orange-100 text-orange-800',
  urgent: 'border-red-200 bg-red-100 text-red-800',
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleString('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatFileSize = (size: number | null): string => {
  if (size === null) return '';
  if (size < 1024) return `${size} بايت`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} كيلوبايت`;
  return `${(size / (1024 * 1024)).toFixed(1)} ميجابايت`;
};

const PublicProjectNotesBoard: React.FC<PublicProjectNotesBoardProps> = ({ projectId }) => {
  const [board, setBoard] = useState<ProjectNotesBoard>(emptyBoard);
  const [threads, setThreads] = useState<Record<string, ProjectNoteThread>>({});
  const [threadLoading, setThreadLoading] = useState<Record<string, boolean>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectNoteStatus>('all');

  const loadBoard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      setBoard(await fetchProjectNotesBoard(projectId));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'تعذر تحميل ملاحظات المشروع',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const filteredNotes = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('ar');

    return board.notes.filter((note) => {
      const section = board.sections.find((item) => item.id === note.section_id);
      const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
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

  const toggleThread = async (noteId: string): Promise<void> => {
    if (expandedNoteId === noteId) {
      setExpandedNoteId(null);
      return;
    }

    setExpandedNoteId(noteId);
    if (threads[noteId]) return;

    setThreadLoading((current) => ({ ...current, [noteId]: true }));
    try {
      const thread = await fetchProjectNoteThread(noteId);
      setThreads((current) => ({ ...current, [noteId]: thread }));
    } catch {
      setThreads((current) => ({
        ...current,
        [noteId]: { comments: [], attachments: [] },
      }));
    } finally {
      setThreadLoading((current) => ({ ...current, [noteId]: false }));
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

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">تعذر تحميل ملاحظات المشروع</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void loadBoard()}>
            <RefreshCw className="ml-2 h-4 w-4" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">إجمالي الملاحظات</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">قيد التنفيذ</p><p className="mt-1 text-2xl font-bold text-blue-700">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">متوقفة</p><p className="mt-1 text-2xl font-bold text-red-700">{stats.blocked}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">مكتملة</p><p className="mt-1 text-2xl font-bold text-green-700">{stats.done}</p></CardContent></Card>
        <Card className="col-span-2 lg:col-span-1"><CardContent className="p-4"><p className="text-xs text-muted-foreground">نسبة الإغلاق</p><p className="mt-1 text-2xl font-bold text-construction-primary">{stats.progress}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-construction-primary" />
            ملاحظات تنفيذ المشروع
          </CardTitle>
          <CardDescription>عرض عام للمتابعة دون تسجيل دخول. التعديل متاح فقط لفريق المشروع.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
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
              onChange={(event) => setStatusFilter(event.target.value as 'all' | ProjectNoteStatus)}
            >
              <option value="all">كل الحالات</option>
              {projectNoteStatusOptions.map((status) => (
                <option key={status} value={status}>{projectNoteStatusLabels[status]}</option>
              ))}
            </select>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              لا توجد ملاحظات مطابقة للبحث أو التصفية.
            </div>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={board.sections.map((section) => section.id)}
              className="space-y-3"
            >
              {board.sections.map((section) => {
                const sectionNotes = filteredNotes.filter((note) => note.section_id === section.id);
                if (sectionNotes.length === 0) return null;
                const completed = sectionNotes.filter((note) => note.status === 'done').length;

                return (
                  <AccordionItem key={section.id} value={section.id} className="rounded-lg border px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center justify-between gap-3 pl-3 text-right">
                        <div>
                          <p className="font-bold">{section.title}</p>
                          {section.description && <p className="text-xs font-normal text-muted-foreground">{section.description}</p>}
                        </div>
                        <Badge variant="outline">{completed}/{sectionNotes.length} مكتمل</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      {sectionNotes.map((note) => {
                        const isExpanded = expandedNoteId === note.id;
                        const thread = threads[note.id];
                        const hasThread = note.comment_count > 0 || note.attachment_count > 0;

                        return (
                          <article
                            key={note.id}
                            className={`rounded-lg border p-4 ${note.status === 'done' ? 'bg-green-50/50' : 'bg-white'}`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold ${note.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>{note.title}</p>
                                {note.description && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{note.description}</p>}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={statusClasses[note.status]}>
                                  {note.status === 'done' ? <CheckCircle2 className="ml-1 h-3 w-3" /> : note.status === 'blocked' ? <AlertTriangle className="ml-1 h-3 w-3" /> : note.status === 'in_progress' ? <Clock3 className="ml-1 h-3 w-3" /> : <Circle className="ml-1 h-3 w-3" />}
                                  {projectNoteStatusLabels[note.status]}
                                </Badge>
                                <Badge variant="outline" className={priorityClasses[note.priority]}>{projectNotePriorityLabels[note.priority]}</Badge>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {note.due_date && <span>الاستحقاق: {note.due_date}</span>}
                              {note.source_reference && <span>المرجع: {note.source_reference}</span>}
                              {hasThread && (
                                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => void toggleThread(note.id)}>
                                  <MessageSquare className="ml-1 h-3.5 w-3.5" />{note.comment_count}
                                  <Paperclip className="mr-2 ml-1 h-3.5 w-3.5" />{note.attachment_count}
                                  <ChevronDown className={`mr-2 h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </Button>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 border-t pt-4">
                                {threadLoading[note.id] ? (
                                  <div className="flex items-center justify-center gap-2 py-6"><Loader2 className="h-4 w-4 animate-spin" />تحميل التفاصيل...</div>
                                ) : (
                                  <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="space-y-2">
                                      <p className="font-semibold">التحديثات</p>
                                      {(thread?.comments || []).length === 0 ? (
                                        <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">لا توجد تعليقات منشورة.</p>
                                      ) : thread.comments.map((comment) => (
                                        <div key={comment.id} className="rounded-md border bg-slate-50 p-3">
                                          <div className="mb-1 text-xs text-muted-foreground">{formatDate(comment.created_at)}</div>
                                          <p className="whitespace-pre-wrap text-sm">{comment.body}</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="space-y-2">
                                      <p className="font-semibold">المرفقات</p>
                                      {(thread?.attachments || []).length === 0 ? (
                                        <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">لا توجد مرفقات منشورة.</p>
                                      ) : thread.attachments.map((attachment) => (
                                        <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                                          <div className="min-w-0"><p className="truncate text-sm font-medium">{attachment.file_name}</p><p className="text-xs text-muted-foreground">{formatFileSize(attachment.file_size)}</p></div>
                                          {attachment.signed_url && (
                                            <Button variant="ghost" size="icon" asChild>
                                              <a href={attachment.signed_url} target="_blank" rel="noreferrer" aria-label="فتح الملف"><ExternalLink className="h-4 w-4" /></a>
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </article>
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

export default PublicProjectNotesBoard;
