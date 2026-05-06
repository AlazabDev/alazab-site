
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceRequestSummary } from '@/types/maintenance';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/components/ui/use-toast";
import { Database } from '@/integrations/supabase/types';

type MrStatus = Database['public']['Enums']['mr_status'];

interface MaintenanceRequestsListProps {
  requests: MaintenanceRequestSummary[];
  isLoading: boolean;
  onStatusChange?: (requestId: string, newStatus: string) => void;
  refreshRequests?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'open':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'inprogress':
    case 'in progress':
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'assigned':
      return 'bg-purple-100 text-purple-800';
    case 'waiting':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
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

const formatDate = (dateString: string) => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('ar-SA');
};

const MaintenanceRequestsList: React.FC<MaintenanceRequestsListProps> = ({ 
  requests, 
  isLoading, 
  onStatusChange, 
  refreshRequests 
}) => {
  const navigate = useNavigate();
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  const viewRequestDetails = (requestId: string) => {
    navigate(`/maintenance-tracking?requestNumber=${requestId}`);
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [requestId]: true }));
    
    try {
      // Map display status to database enum
      const statusMap: Record<string, MrStatus> = {
        'pending': 'Open',
        'in-progress': 'InProgress',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
      };
      
      const dbStatus = statusMap[newStatus] || 'Open';
      
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ status: dbStatus })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "تم تحديث الحالة",
        description: `تم تحديث حالة الطلب إلى ${getStatusText(newStatus)}`,
      });
      
      if (onStatusChange) {
        onStatusChange(requestId, newStatus);
      }
      
      if (refreshRequests) {
        refreshRequests();
      }
      
    } catch (error) {
      console.error('خطأ في تحديث الحالة:', error);
      toast({
        title: "خطأ في تحديث الحالة",
        description: "حدث خطأ أثناء محاولة تحديث حالة الطلب",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-construction-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">جاري تحميل الطلبات...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4">
          <rect x="2" y="4" width="20" height="16" rx="2"></rect>
          <path d="M7 8h10"></path>
          <path d="M7 12h10"></path>
          <path d="M7 16h10"></path>
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">لا توجد طلبات صيانة</h3>
        <p className="text-gray-600">لم يتم العثور على أي طلبات صيانة</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">العنوان</TableHead>
            <TableHead className="text-right">نوع الخدمة</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الأولوية</TableHead>
            <TableHead className="text-right">تاريخ الإنشاء</TableHead>
            <TableHead className="text-right">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.title}</TableCell>
              <TableCell>{request.service_type || 'غير محدد'}</TableCell>
              <TableCell>
                {updatingStatus[request.id] ? (
                  <div className="animate-pulse flex space-x-4">
                    <div className="h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                )}
              </TableCell>
              <TableCell>{request.priority || 'غير محدد'}</TableCell>
              <TableCell>{formatDate(request.created_at)}</TableCell>
              <TableCell className="space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Button
                    variant="outline"
                    onClick={() => viewRequestDetails(request.id)}
                    className="text-construction-primary hover:text-white hover:bg-construction-primary"
                    size="sm"
                  >
                    عرض
                  </Button>
                  
                  <Select
                    value={request.status?.toLowerCase()}
                    onValueChange={(value) => handleStatusChange(request.id, value)}
                    disabled={updatingStatus[request.id]}
                  >
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue placeholder="تغيير الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceRequestsList;
