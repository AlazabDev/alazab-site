
import React from 'react';
import { formatDate } from '../utils/dateUtils';
import { Separator } from "@/components/ui/separator";
import { MaintenanceRequestDetails, AttachmentDetails } from '@/types/maintenance';
import StatusBadge from './StatusBadge';
import StatusUpdate from './StatusUpdate';

interface RequestDetailsCardProps {
  requestDetails: MaintenanceRequestDetails;
  attachments: AttachmentDetails[];
  isUpdatingStatus: boolean;
  handleStatusChange: (newStatus: string) => void;
}

const RequestDetailsCard: React.FC<RequestDetailsCardProps> = ({ 
  requestDetails, 
  attachments,
  isUpdatingStatus,
  handleStatusChange
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-gray-500">رقم الطلب</p>
          <p className="font-bold">{requestDetails.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">تاريخ الإنشاء</p>
          <p>{formatDate(requestDetails.created_at)}</p>
        </div>
        <div>
          <StatusBadge status={requestDetails.status} />
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-xl mb-2">{requestDetails.title}</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{requestDetails.description}</p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">تفاصيل الطلب</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="text-gray-500">الفرع:</span>
              <span>{requestDetails.branch}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">نوع الخدمة:</span>
              <span>{requestDetails.service_type}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">الأولوية:</span>
              <span>{requestDetails.priority}</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">معلومات الجدولة</h3>
          <ul className="space-y-2">
            <li className="flex justify-between">
              <span className="text-gray-500">التاريخ المطلوب:</span>
              <span>{formatDate(requestDetails.scheduled_date)}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">التكلفة التقديرية:</span>
              <span>{requestDetails.estimated_cost ? `${requestDetails.estimated_cost} ريال` : 'غير محدد'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">تاريخ الإكمال:</span>
              <span>{formatDate(requestDetails.completion_date)}</span>
            </li>
          </ul>
        </div>
      </div>

      <Separator />
      
      <StatusUpdate 
        currentStatus={requestDetails.status}
        isUpdatingStatus={isUpdatingStatus}
        onStatusChange={handleStatusChange}
      />
      
      {attachments.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="font-semibold mb-3">المرفقات ({attachments.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 p-3 rounded-md flex items-center gap-3 hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-construction-primary">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12.01" y2="16"></line>
                  </svg>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{attachment.description || 'مرفق'}</p>
                    <p className="text-xs text-gray-500">{formatDate(attachment.uploaded_at)}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RequestDetailsCard;
