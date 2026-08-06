export type ProjectNoteStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type ProjectNotePriority = 'low' | 'normal' | 'high' | 'urgent';
export type ProjectNoteMemberRole = 'viewer' | 'commenter' | 'editor' | 'owner';

export interface ProjectNoteSection {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  position: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  section_id: string;
  title: string;
  description: string | null;
  status: ProjectNoteStatus;
  priority: ProjectNotePriority;
  assigned_to: string | null;
  due_date: string | null;
  position: number;
  source_reference: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  attachment_count: number;
}

export interface ProjectNoteComment {
  id: string;
  project_id: string;
  note_id: string;
  parent_comment_id: string | null;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectNoteAttachment {
  id: string;
  project_id: string;
  note_id: string;
  comment_id: string | null;
  bucket_id: 'project-notes';
  object_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
  signed_url: string | null;
}

export interface ProjectNoteMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: ProjectNoteMemberRole;
  created_at?: string;
}

export interface ProjectNotesBoard {
  sections: ProjectNoteSection[];
  notes: ProjectNote[];
}

export interface ProjectNoteThread {
  comments: ProjectNoteComment[];
  attachments: ProjectNoteAttachment[];
}

export const projectNoteStatusLabels: Record<ProjectNoteStatus, string> = {
  open: 'مفتوحة',
  in_progress: 'قيد التنفيذ',
  blocked: 'متوقفة',
  done: 'مكتملة',
  cancelled: 'ملغاة',
};

export const projectNotePriorityLabels: Record<ProjectNotePriority, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const projectNoteRoleLabels: Record<ProjectNoteMemberRole, string> = {
  viewer: 'مشاهدة',
  commenter: 'تعليق ورفع ملفات',
  editor: 'تحرير الملاحظات',
  owner: 'إدارة كاملة',
};
