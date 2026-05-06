
import React from 'react';
import { MaintenanceRequest, Priority } from '@/types/maintenance';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DetailsStepProps {
  formData: MaintenanceRequest;
  updateFormData: (key: string, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const priorities = Object.values(Priority);

const DetailsStep: React.FC<DetailsStepProps> = ({ formData, updateFormData, nextStep, prevStep }) => {
  const [date, setDate] = React.useState<Date | undefined>(
    formData.requestedDate ? new Date(formData.requestedDate) : undefined
  );

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      updateFormData('requestedDate', selectedDate.toISOString());
    }
  };

  const isFormValid = () => {
    return formData.description && formData.priority && formData.requestedDate;
  };
  
  return (
    <div className="space-y-6">
      <div className="border-r-4 border-construction-primary pr-3">
        <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">
          وصف المشكلة <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="اشرح المشكلة بالتفصيل"
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={6}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="priority">
            الأولوية <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => updateFormData('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر أولوية الطلب" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>
            التاريخ المطلوب <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between text-right font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP", { locale: ar }) : <span>اختر التاريخ</span>}
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                locale={ar}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedCost">
          التكلفة المتوقعة (اختياري)
        </Label>
        <Input
          id="estimatedCost"
          type="number"
          placeholder="أدخل التكلفة المتوقعة"
          value={formData.estimatedCost}
          onChange={(e) => updateFormData('estimatedCost', e.target.value)}
        />
      </div>

      <div className="flex justify-between mt-6">
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="m9 18 6-6-6-6"></path></svg>
          السابق
        </Button>
        
        <Button
          onClick={nextStep}
          disabled={!isFormValid()}
          className="bg-construction-primary text-white flex items-center"
        >
          التالي
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="m15 18-6-6 6-6"></path></svg>
        </Button>
      </div>
    </div>
  );
};

export default DetailsStep;
