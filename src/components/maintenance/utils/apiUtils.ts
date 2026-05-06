
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceRequestDetails, AttachmentDetails } from '@/types/maintenance';
import type { Database } from '@/integrations/supabase/types';

export const fetchMaintenanceRequest = async (requestNumber: string) => {
  const { data: requestData, error: requestError } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', requestNumber)
    .single();
  
  if (requestError) {
    throw new Error('لم يتم العثور على الطلب');
  }
  
  // تحويل البيانات للصيغة المطلوبة
  const details: MaintenanceRequestDetails = {
    id: requestData.id,
    request_number: requestNumber,
    title: requestData.title,
    description: requestData.description || '',
    branch: requestData.location || 'غير محدد',
    service_type: requestData.service_type || 'غير محدد',
    priority: requestData.priority || 'medium',
    status: requestData.status || 'Open',
    scheduled_date: requestData.sla_due_date || requestData.created_at,
    estimated_cost: requestData.estimated_cost ? String(requestData.estimated_cost) : null,
    actual_cost: requestData.actual_cost ? String(requestData.actual_cost) : null,
    created_at: requestData.created_at,
    completion_date: null
  };
  
  return details;
};

export const fetchAttachments = async (requestNumber: string): Promise<AttachmentDetails[]> => {
  // Since request_attachments table doesn't exist in the schema,
  // return empty array for now
  console.log('Attachments table not available, returning empty array for request:', requestNumber);
  return [];
};

export const updateRequestStatus = async (requestId: string, newStatus: string) => {
  // Map display status to database enum
  const statusMap: Record<string, string> = {
    'pending': 'Open',
    'in-progress': 'InProgress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  const dbStatus = statusMap[newStatus] || newStatus;
  
  const { error } = await supabase
    .from('maintenance_requests')
    .update({ status: dbStatus as Database["public"]["Enums"]["mr_status"] })
    .eq('id', requestId);
  
  if (error) throw error;
};

export const getStatusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'open':
    case 'pending':
      return 'قيد الانتظار';
    case 'inprogress':
    case 'in progress':
    case 'in-progress':
      return 'قيد التنفيذ';
    case 'completed':
      return 'مكتمل';
    case 'cancelled':
      return 'ملغي';
    case 'rejected':
      return 'مرفوض';
    case 'assigned':
      return 'معين';
    case 'waiting':
      return 'في الانتظار';
    default:
      return status || 'غير معروف';
  }
};
