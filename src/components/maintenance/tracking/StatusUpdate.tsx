
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface StatusUpdateProps {
  currentStatus: string;
  isUpdatingStatus: boolean;
  onStatusChange: (newStatus: string) => void;
}

const StatusUpdate: React.FC<StatusUpdateProps> = ({ 
  currentStatus, 
  isUpdatingStatus, 
  onStatusChange 
}) => {
  return (
    <div>
      <h3 className="font-semibold mb-3">تحديث الحالة</h3>
      <div className="flex gap-4">
        <Select
          value={currentStatus}
          onValueChange={onStatusChange}
          disabled={isUpdatingStatus}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="تحديث الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">قيد الانتظار</SelectItem>
            <SelectItem value="in-progress">قيد التنفيذ</SelectItem>
            <SelectItem value="completed">مكتمل</SelectItem>
            <SelectItem value="cancelled">ملغي</SelectItem>
          </SelectContent>
        </Select>
        
        {isUpdatingStatus && (
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-construction-primary self-center"></div>
        )}
      </div>
    </div>
  );
};

export default StatusUpdate;
