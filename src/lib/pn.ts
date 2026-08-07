import { supabase } from '@/integrations/supabase/client';

// Keep the untyped boundary inside this module until generated Supabase types are refreshed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type PNStatus = 'open' | 'in_progress' | 'blocked' | 'done';

export interface PNProject {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PNSection {
  id: string;
  project_id: string;
  title: string;
  position: number;
}

export interface PNNote {
  id: string;
  project_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  status: PNStatus;
  position: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  comment_count?: number;
  attachment_count?: number;
}

export interface PNComment {
  id: string;
  project_id: string;
  note_id: string;
  body: string;
  created_at: string;
}

export interface PNAttachment {
  id: string;
  project_id: string;
  note_id: string;
  bucket_id: 'pn-files' | 'project-notes';
  object_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
  signed_url?: string | null;
}

export interface PNBoard {
  projects: PNProject[];
  sections: PNSection[];
  notes: PNNote[];
}

const throwIfError = (error: { message?: string } | null): void => {
  if (error) throw new Error(error.message || 'حدث خطأ غير متوقع');
};

const requireAuthenticatedUser = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  throwIfError(error);
  if (!data.user) throw new Error('AUTH_REQUIRED');
  return data.user.id;
};

const removePNFiles = async (column: 'project_id' | 'note_id', value: string): Promise<void> => {
  const { data, error } = await db
    .from('pn_attachments')
    .select('bucket_id,object_path')
    .eq(column, value)
    .eq('bucket_id', 'pn-files');
  throwIfError(error);

  const paths = (data || [])
    .map((row: { object_path: string }) => row.object_path)
    .filter(Boolean);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from('pn-files').remove(paths);
    throwIfError(removeError);
  }
};

export const fetchPNBoard = async (): Promise<PNBoard> => {
  const [projectsResult, sectionsResult, notesResult, commentsResult, attachmentsResult] = await Promise.all([
    db.from('pn_projects').select('*').order('created_at', { ascending: true }),
    db.from('pn_sections').select('*').order('position', { ascending: true }),
    db.from('pn_notes').select('*').order('position', { ascending: true }),
    db.from('pn_comments').select('note_id'),
    db.from('pn_attachments').select('note_id'),
  ]);

  throwIfError(projectsResult.error);
  throwIfError(sectionsResult.error);
  throwIfError(notesResult.error);
  throwIfError(commentsResult.error);
  throwIfError(attachmentsResult.error);

  const commentCounts = new Map<string, number>();
  const attachmentCounts = new Map<string, number>();
  (commentsResult.data || []).forEach(({ note_id }: { note_id: string }) => {
    commentCounts.set(note_id, (commentCounts.get(note_id) || 0) + 1);
  });
  (attachmentsResult.data || []).forEach(({ note_id }: { note_id: string }) => {
    attachmentCounts.set(note_id, (attachmentCounts.get(note_id) || 0) + 1);
  });

  return {
    projects: (projectsResult.data || []) as PNProject[],
    sections: (sectionsResult.data || []) as PNSection[],
    notes: ((notesResult.data || []) as PNNote[]).map((note) => ({
      ...note,
      comment_count: commentCounts.get(note.id) || 0,
      attachment_count: attachmentCounts.get(note.id) || 0,
    })),
  };
};

export const fetchPNThread = async (noteId: string): Promise<{ comments: PNComment[]; attachments: PNAttachment[] }> => {
  const [commentsResult, attachmentsResult] = await Promise.all([
    db.from('pn_comments').select('*').eq('note_id', noteId).order('created_at', { ascending: true }),
    db.from('pn_attachments').select('*').eq('note_id', noteId).order('created_at', { ascending: true }),
  ]);
  throwIfError(commentsResult.error);
  throwIfError(attachmentsResult.error);

  const attachments = (attachmentsResult.data || []) as PNAttachment[];
  const resolved = await Promise.all(attachments.map(async (attachment) => {
    const { data } = await supabase.storage
      .from(attachment.bucket_id)
      .createSignedUrl(attachment.object_path, 60 * 60);
    return { ...attachment, signed_url: data?.signedUrl || null };
  }));

  return {
    comments: (commentsResult.data || []) as PNComment[],
    attachments: resolved,
  };
};

export const createPNProject = async (name: string, description?: string): Promise<PNProject> => {
  const userId = await requireAuthenticatedUser();
  const { data, error } = await db.from('pn_projects').insert({
    name: name.trim(),
    description: description?.trim() || null,
    created_by: userId,
  }).select('*').single();
  throwIfError(error);

  const project = data as PNProject;
  const { error: sectionError } = await db.from('pn_sections').insert({
    project_id: project.id,
    title: 'ملاحظات عامة',
    position: 0,
    created_by: userId,
  });

  if (sectionError) {
    await db.from('pn_projects').delete().eq('id', project.id);
    throwIfError(sectionError);
  }

  return project;
};

export const deletePNProject = async (projectId: string): Promise<void> => {
  await requireAuthenticatedUser();
  await removePNFiles('project_id', projectId);
  const { error } = await db.from('pn_projects').delete().eq('id', projectId);
  throwIfError(error);
};

export const createPNNote = async (
  projectId: string,
  sectionId: string | null,
  title: string,
  description?: string,
  position = 0,
): Promise<PNNote> => {
  const userId = await requireAuthenticatedUser();
  const { data, error } = await db.from('pn_notes').insert({
    project_id: projectId,
    section_id: sectionId,
    title: title.trim(),
    description: description?.trim() || null,
    position,
    created_by: userId,
  }).select('*').single();
  throwIfError(error);
  return data as PNNote;
};

export const deletePNNote = async (noteId: string): Promise<void> => {
  await requireAuthenticatedUser();
  await removePNFiles('note_id', noteId);
  const { error } = await db.from('pn_notes').delete().eq('id', noteId);
  throwIfError(error);
};

export const setPNNoteStatus = async (
  noteId: string,
  status: PNStatus,
  comment?: string,
): Promise<PNNote> => {
  const { data, error } = await db.rpc('pn_set_note_status', {
    target_note_id: noteId,
    next_status: status,
    status_comment: comment?.trim() || null,
  });
  throwIfError(error);
  return data as PNNote;
};

export const addPNComment = async (projectId: string, noteId: string, body: string): Promise<PNComment> => {
  const { data, error } = await db.from('pn_comments').insert({
    project_id: projectId,
    note_id: noteId,
    body: body.trim(),
  }).select('*').single();
  throwIfError(error);
  return data as PNComment;
};

const extension = (name: string): string => {
  const part = name.split('.').pop();
  if (!part || part === name) return '';
  return `.${part.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
};

export const uploadPNAttachment = async (projectId: string, noteId: string, file: File): Promise<PNAttachment> => {
  if (file.size > 50 * 1024 * 1024) throw new Error('الحد الأقصى لحجم الملف 50 ميجابايت');
  const objectPath = `${projectId}/${noteId}/${crypto.randomUUID()}${extension(file.name)}`;

  const { error: uploadError } = await supabase.storage.from('pn-files').upload(objectPath, file, {
    upsert: false,
    contentType: file.type || undefined,
    cacheControl: '3600',
  });
  throwIfError(uploadError);

  const { data, error } = await db.from('pn_attachments').insert({
    project_id: projectId,
    note_id: noteId,
    bucket_id: 'pn-files',
    object_path: objectPath,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
  }).select('*').single();

  if (error) {
    await supabase.storage.from('pn-files').remove([objectPath]);
    throwIfError(error);
  }

  const { data: signedData } = await supabase.storage.from('pn-files').createSignedUrl(objectPath, 60 * 60);
  return { ...(data as PNAttachment), signed_url: signedData?.signedUrl || null };
};
