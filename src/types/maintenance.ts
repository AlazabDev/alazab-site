
export interface MaintenanceRequest {
  // المعلومات الأساسية - الخطوة 1
  branch: string;
  serviceType: string;
  title: string;
  location: string; // Add required location field
  
  // تفاصيل الطلب - الخطوة 2
  description: string;
  priority: string;
  requestedDate: string;
  estimatedCost?: string;
  
  // المرفقات - الخطوة 3
  attachments: File[];
}

export enum Priority {
  LOW = "منخفضة",
  MEDIUM = "متوسطة",
  HIGH = "عالية",
  URGENT = "عاجلة"
}

export enum MaintenanceStep {
  BASIC_INFO = 1,
  REQUEST_DETAILS = 2,
  ATTACHMENTS = 3,
  REVIEW = 4,
  SUBMISSION = 5
}

export interface MaintenanceRequestDetails {
  id: string;
  request_number?: string;
  title: string;
  description: string;
  branch?: string;
  service_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  estimated_cost: string | null;
  actual_cost: string | null;
  created_at: string;
  completion_date: string | null;
  requester_name?: string;
  requester_phone?: string;
  requester_email?: string;
  location?: string;
}

// Interface for request details page
export interface RequestDetails {
  id: string;
  request_number?: string;
  title: string;
  description: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_type: string;
  priority: string;
  status: string;
  scheduled_date: string;
  estimated_cost: string | null;
  actual_cost: string | null;
  created_at: string;
  completion_date: string | null;
  location: string;
}

export interface AttachmentDetails {
  id: string;
  file_url: string;
  description: string | null;
  uploaded_at: string;
}

export interface BranchData {
  id: string;
  name: string;
}

export interface ServiceTypeData {
  id: string;
  name: string;
  description?: string;
}

// Database interface for maintenance_requests table
export interface MaintenanceRequestDB {
  id?: string;
  title: string;
  client_name: string;
  service_type: string;
  description: string;
  location: string;
  priority: string;
  preferred_date: string;
  estimated_cost: number | null;
  actual_cost?: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Database interface for attachments table
export interface AttachmentDB {
  id?: string;
  request_id: string;
  file_url: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by?: string | null;
  is_deleted?: boolean;
}

export interface MaintenanceRequestSummary {
  id: string;
  title: string;
  service_type: string;
  status: string;
  priority: string;
  preferred_date: string;
  created_at: string;
}
