import { supabase } from '@/integrations/supabase/client';
import type {
  ProjectNote,
  ProjectNoteAttachment,
  ProjectNoteComment,
  ProjectNoteMember,
  ProjectNoteMemberRole,
  ProjectNotePriority,
  ProjectNotesBoard,
  ProjectNoteSection,
  ProjectNoteStatus,
  ProjectNoteThread,
} from '@/types/projectNotes';

// The generated Database type is updated independently from feature delivery.
// Keep the untyped boundary contained in this data-access module only.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const NOTES_BUCKET = 'project-notes';
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const requireUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('يجب تسجيل الدخول لتنفيذ هذه العملية');
  return data.user.id;
};

const throwIfError = (error: { message?: string } | null): void => {
  if (error) throw new Error(error.message || 'حدث خطأ غير متوقع');
};

const countByNote = (rows: Array<{ note_id: string }> | null): Map<string, number> => {
  const counts = new Map<string, number>();
  (rows || []).forEach(({ note_id }) => {
    counts.set(note_id, (counts.get(note_id) || 0) + 1);
  });
  return counts;
};

export const fetchProjectNotesBoard = async (projectId: string): Promise<ProjectNotesBoard> => {
  const [sectionsResult, notesResult, commentsResult, attachmentsResult] = await Promise.all([
    db
      .from('project_note_sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_archived', false)
      .order('position', { ascending: true }),
    db
      .from('project_notes')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true }),
    db
      .from('project_note_comments')
      .select('note_id')
      .eq('project_id', projectId),
    db
      .from('project_note_attachments')
      .select('note_id')
      .eq('project_id', projectId),
  ]);

  throwIfError(sectionsResult.error);
  throwIfError(notesResult.error);
  throwIfError(commentsResult.error);
  throwIfError(attachmentsResult.error);

  const commentCounts = countByNote(commentsResult.data);
  const attachmentCounts = countByNote(attachmentsResult.data);

  const notes: ProjectNote[] = (notesResult.data || []).map((note: ProjectNote) => ({
    ...note,
    comment_count: commentCounts.get(note.id) || 0,
    attachment_count: attachmentCounts.get(note.id) || 0,
  }));

  return {
    sections: (sectionsResult.data || []) as ProjectNoteSection[],
    notes,
  };
};

export const createProjectNoteSection = async (
  projectId: string,
  title: string,
  position: number,
): Promise<ProjectNoteSection> => {
  const userId = await requireUserId();
  const { data, error } = await db
    .from('project_note_sections')
    .insert({
      project_id: projectId,
      title: title.trim(),
      position,
      created_by: userId,
      updated_by: userId,
    })
    .select('*')
    .single();

  throwIfError(error);
  return data as ProjectNoteSection;
};

export interface CreateProjectNoteInput {
  projectId: string;
  sectionId: string;
  title: string;
  description?: string;
  priority?: ProjectNotePriority;
  assignedTo?: string | null;
  dueDate?: string | null;
  position: number;
}

export const createProjectNote = async (input: CreateProjectNoteInput): Promise<ProjectNote> => {
  const userId = await requireUserId();
  const { data, error } = await db
    .from('project_notes')
    .insert({
      project_id: input.projectId,
      section_id: input.sectionId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      status: 'open',
      priority: input.priority || 'normal',
      assigned_to: input.assignedTo || null,
      due_date: input.dueDate || null,
      position: input.position,
      created_by: userId,
      updated_by: userId,
    })
    .select('*')
    .single();

  throwIfError(error);
  return {
    ...(data as ProjectNote),
    comment_count: 0,
    attachment_count: 0,
  };
};

export type UpdateProjectNoteInput = Partial<
  Pick<
    ProjectNote,
    'title' | 'description' | 'status' | 'priority' | 'assigned_to' | 'due_date' | 'section_id' | 'position'
  >
>;

export const updateProjectNote = async (
  noteId: string,
  patch: UpdateProjectNoteInput,
): Promise<ProjectNote> => {
  const userId = await requireUserId();
  const payload: Record<string, unknown> = {
    ...patch,
    updated_by: userId,
  };

  if (patch.status === 'done') {
    payload.completed_at = new Date().toISOString();
    payload.completed_by = userId;
  } else if (patch.status) {
    payload.completed_at = null;
    payload.completed_by = null;
  }

  const { data, error } = await db
    .from('project_notes')
    .update(payload)
    .eq('id', noteId)
    .select('*')
    .single();

  throwIfError(error);
  return data as ProjectNote;
};

export const deleteProjectNote = async (noteId: string): Promise<void> => {
  const { error } = await db.from('project_notes').delete().eq('id', noteId);
  throwIfError(error);
};

export const fetchProjectNoteThread = async (noteId: string): Promise<ProjectNoteThread> => {
  const [commentsResult, attachmentsResult] = await Promise.all([
    db
      .from('project_note_comments')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true }),
    db
      .from('project_note_attachments')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: true }),
  ]);

  throwIfError(commentsResult.error);
  throwIfError(attachmentsResult.error);

  const attachmentRows = (attachmentsResult.data || []) as ProjectNoteAttachment[];
  let signedUrlByPath = new Map<string, string>();

  if (attachmentRows.length > 0) {
    const { data: signedRows, error: signedError } = await supabase.storage
      .from(NOTES_BUCKET)
      .createSignedUrls(
        attachmentRows.map((attachment) => attachment.object_path),
        60 * 60,
      );

    throwIfError(signedError);
    signedUrlByPath = new Map(
      (signedRows || [])
        .filter((row) => row.signedUrl)
        .map((row) => [row.path, row.signedUrl as string]),
    );
  }

  return {
    comments: (commentsResult.data || []) as ProjectNoteComment[],
    attachments: attachmentRows.map((attachment) => ({
      ...attachment,
      signed_url: signedUrlByPath.get(attachment.object_path) || null,
    })),
  };
};

export const addProjectNoteComment = async (
  projectId: string,
  noteId: string,
  body: string,
): Promise<ProjectNoteComment> => {
  const userId = await requireUserId();
  const { data, error } = await db
    .from('project_note_comments')
    .insert({
      project_id: projectId,
      note_id: noteId,
      body: body.trim(),
      created_by: userId,
    })
    .select('*')
    .single();

  throwIfError(error);
  return data as ProjectNoteComment;
};

const fileExtension = (fileName: string): string => {
  const lastPart = fileName.split('.').pop();
  if (!lastPart || lastPart === fileName) return '';
  const sanitized = lastPart.toLowerCase().replace(/[^a-z0-9]/g, '');
  return sanitized ? `.${sanitized}` : '';
};

export const uploadProjectNoteAttachment = async (
  projectId: string,
  noteId: string,
  file: File,
  commentId?: string | null,
): Promise<ProjectNoteAttachment> => {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('الحد الأقصى لحجم الملف هو 50 ميجابايت');
  }

  const userId = await requireUserId();
  const objectPath = `${projectId}/${noteId}/${crypto.randomUUID()}${fileExtension(file.name)}`;

  const { error: uploadError } = await supabase.storage.from(NOTES_BUCKET).upload(objectPath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  throwIfError(uploadError);

  const { data, error: metadataError } = await db
    .from('project_note_attachments')
    .insert({
      project_id: projectId,
      note_id: noteId,
      comment_id: commentId || null,
      bucket_id: NOTES_BUCKET,
      object_path: objectPath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size: file.size,
      uploaded_by: userId,
    })
    .select('*')
    .single();

  if (metadataError) {
    await supabase.storage.from(NOTES_BUCKET).remove([objectPath]);
    throwIfError(metadataError);
  }

  const { data: signedData } = await supabase.storage
    .from(NOTES_BUCKET)
    .createSignedUrl(objectPath, 60 * 60);

  return {
    ...(data as ProjectNoteAttachment),
    signed_url: signedData?.signedUrl || null,
  };
};

export const deleteProjectNoteAttachment = async (
  attachment: ProjectNoteAttachment,
): Promise<void> => {
  const { error: storageError } = await supabase.storage
    .from(NOTES_BUCKET)
    .remove([attachment.object_path]);
  throwIfError(storageError);

  const { error: metadataError } = await db
    .from('project_note_attachments')
    .delete()
    .eq('id', attachment.id);
  throwIfError(metadataError);
};

export const fetchProjectNoteMembers = async (projectId: string): Promise<ProjectNoteMember[]> => {
  const { data, error } = await db.rpc('get_project_note_members', {
    target_project_id: projectId,
  });
  throwIfError(error);
  return (data || []) as ProjectNoteMember[];
};

export const addProjectNoteMemberByEmail = async (
  projectId: string,
  email: string,
  role: ProjectNoteMemberRole,
): Promise<ProjectNoteMember> => {
  const { data, error } = await db.rpc('add_project_note_member_by_email', {
    target_project_id: projectId,
    member_email: email.trim(),
    member_role: role,
  });
  throwIfError(error);
  const member = Array.isArray(data) ? data[0] : data;
  if (!member) throw new Error('لم يتم إرجاع بيانات العضو بعد إضافته');
  return member as ProjectNoteMember;
};

export const removeProjectNoteMember = async (
  projectId: string,
  userId: string,
): Promise<void> => {
  const { error } = await db
    .from('project_note_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  throwIfError(error);
};

export const projectNoteStatusOptions: ProjectNoteStatus[] = [
  'open',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
];
