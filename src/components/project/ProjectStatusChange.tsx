
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectStatusChangeProps {
  projectId: string;
  currentStatus: string;
  currentProgress: number;
  onStatusChanged: () => void;
}

const ProjectStatusChange: React.FC<ProjectStatusChangeProps> = ({ 
  projectId, 
  currentStatus, 
  currentProgress,
  onStatusChanged 
}) => {
  const [status, setStatus] = useState(currentStatus);
  const [progress, setProgress] = useState(currentProgress);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
  };

  const saveChanges = async () => {
    if (status === currentStatus && progress === currentProgress) {
      toast({
        title: "لم يتم إجراء أي تغييرات",
        description: "الرجاء تغيير الحالة أو نسبة الإنجاز لحفظ التغييرات"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: status,
          progress: progress
        })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "تم تحديث حالة المشروع",
        description: "تم تحديث حالة المشروع ونسبة الإنجاز بنجاح"
      });
      
      onStatusChanged();
    } catch (error) {
      console.error("Error updating project status:", error);
      toast({
        variant: "destructive",
        title: "خطأ في تحديث حالة المشروع",
        description: "حدث خطأ أثناء محاولة تحديث حالة المشروع"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-md border border-gray-200">
      <h3 className="text-lg font-bold mb-4">تحديث حالة المشروع</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">حالة المشروع</label>
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر حالة المشروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="جديد">جديد</SelectItem>
              <SelectItem value="قيد التنفيذ">قيد التنفيذ</SelectItem>
              <SelectItem value="مكتمل">مكتمل</SelectItem>
              <SelectItem value="متوقف">متوقف</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-1 block">نسبة الإنجاز ({progress}%)</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={handleProgressChange}
            disabled={isUpdating}
            className="w-full"
          />
          <Progress value={progress} className="h-2 mt-1" />
        </div>
        
        <Button
          onClick={saveChanges}
          disabled={isUpdating || (status === currentStatus && progress === currentProgress)}
          className="w-full bg-construction-primary hover:bg-construction-dark"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جارٍ التحديث...
            </>
          ) : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
};

export default ProjectStatusChange;
