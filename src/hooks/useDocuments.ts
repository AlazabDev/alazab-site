import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Document {
  id: string;
  daftra_id: string | null;
  type: string;
  number: string;
  title: string | null;
  description: string | null;
  client_name: string;
  client_email: string | null;
  sender_name: string | null;
  project_id: string | null;
  total: number;
  currency: string;
  date: string;
  status: string;
  payment_status: string;
  pdf_url: string | null;
  html_url: string | null;
  file_bucket: string | null;
  file_path: string | null;
  file_url: string | null;
  ai_summary: string | null;
  ai_extracted_data: Record<string, unknown> | null;
  raw_json: Record<string, unknown> | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentStats {
  inReview: number;
  needsFix: number;
  readyToApprove: number;
  approvedToday: number;
  totalDocuments: number;
  pendingSignatures: number;
}

const sanitizeSearch = (value: string) =>
  value.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim();

async function withSignedDocumentUrl(document: Document): Promise<Document> {
  if (!document.file_bucket || !document.file_path) return document;

  const { data, error } = await supabase.storage
    .from(document.file_bucket)
    .createSignedUrl(document.file_path, 15 * 60);

  if (error) {
    console.error('[approvals] signed document URL failed', error);
    return { ...document, file_url: null };
  }

  return { ...document, file_url: data.signedUrl };
}

export async function invokeDocumentAction(payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('document-actions', { body: payload });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || 'تعذر تنفيذ الإجراء');
  return data;
}

export function useDocuments(status?: string, search?: string) {
  return useQuery({
    queryKey: ['documents', status, search],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (status && status !== 'all') query = query.eq('status', status);

      const term = search ? sanitizeSearch(search) : '';
      if (term) query = query.or(`number.ilike.%${term}%,client_name.ilike.%${term}%,title.ilike.%${term}%`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Document[];
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return withSignedDocumentUrl(data as Document);
    },
    enabled: !!id,
  });
}

export function useDocumentStats() {
  return useQuery({
    queryKey: ['documentStats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: inReview, error: inReviewError },
        { count: needsFix, error: needsFixError },
        { count: readyToApprove, error: readyError },
        { count: approvedToday, error: approvedError },
        { count: totalDocuments, error: totalError },
        { count: pendingSignatures, error: signatureError },
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'in_review'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'needs_fix'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'ready_to_approve'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'approved').gte('updated_at', today),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      ]);

      const firstError = inReviewError || needsFixError || readyError || approvedError || totalError || signatureError;
      if (firstError) throw firstError;

      return {
        inReview: inReview || 0,
        needsFix: needsFix || 0,
        readyToApprove: readyToApprove || 0,
        approvedToday: approvedToday || 0,
        totalDocuments: totalDocuments || 0,
        pendingSignatures: pendingSignatures || 0,
      } satisfies DocumentStats;
    },
  });
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: string; comment?: string }) => {
      const actionByStatus: Record<string, string> = {
        in_review: 'submit_review',
        needs_fix: 'request_fix',
        approved: 'approve',
        archived: 'archive',
      };
      const action = actionByStatus[status];
      if (!action) throw new Error('هذا التغيير يتطلب مسار اعتماد متخصص');
      return invokeDocumentAction({ action, documentId: id, comment });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['documentStats'] });
      queryClient.invalidateQueries({ queryKey: ['documentAuditLogs', variables.id] });
      toast.success('تم تحديث حالة المستند');
    },
    onError: (error) => {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'فشل تحديث حالة المستند');
    },
  });
}

export function useDocumentComments(documentId: string) {
  return useQuery({
    queryKey: ['documentComments', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!documentId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: {
      document_id: string;
      text: string;
      user_name?: string;
      page?: number;
    }) => {
      return invokeDocumentAction({
        action: 'add_comment',
        documentId: comment.document_id,
        comment: comment.text,
        page: comment.page,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentComments', variables.document_id] });
      queryClient.invalidateQueries({ queryKey: ['documentAuditLogs', variables.document_id] });
      toast.success('تمت إضافة التعليق');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'تعذر إضافة التعليق');
    },
  });
}

export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      return Promise.all((data || []).map(async (version) => {
        if (!version.file_bucket || !version.file_path) return version;
        const { data: signed, error: signedError } = await supabase.storage
          .from(version.file_bucket)
          .createSignedUrl(version.file_path, 15 * 60);
        return {
          ...version,
          file_url: signedError ? version.file_url : signed.signedUrl,
        };
      }));
    },
    enabled: !!documentId,
  });
}

export function useDocumentAuditLogs(documentId?: string) {
  return useQuery({
    queryKey: ['documentAuditLogs', documentId],
    queryFn: async () => {
      let query = supabase
        .from('document_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (documentId) query = query.eq('document_id', documentId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
