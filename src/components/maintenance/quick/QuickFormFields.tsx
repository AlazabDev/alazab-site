
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaintenanceRequest, BranchData, ServiceTypeData } from '@/types/maintenance';

interface QuickFormFieldsProps {
  formData: MaintenanceRequest;
  branches: BranchData[];
  serviceTypes: ServiceTypeData[];
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (field: string, value: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuickFormFields: React.FC<QuickFormFieldsProps> = ({
  formData,
  branches,
  serviceTypes,
  onFormChange,
  onSelectChange,
  onFileChange
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="branch">اختر الفرع *</Label>
          <Select
            value={formData.branch}
            onValueChange={(value) => onSelectChange('branch', value)}
            required
          >
            <SelectTrigger id="branch">
              <SelectValue placeholder="اختر الفرع" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceType">نوع الخدمة *</Label>
          <Select
            value={formData.serviceType}
            onValueChange={(value) => onSelectChange('serviceType', value)}
            required
          >
            <SelectTrigger id="serviceType">
              <SelectValue placeholder="اختر نوع الخدمة" />
            </SelectTrigger>
            <SelectContent>
              {serviceTypes.map((service) => (
                <SelectItem key={service.id} value={service.name}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">عنوان الطلب *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={onFormChange}
          placeholder="أدخل عنوان الطلب"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">وصف المشكلة *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={onFormChange}
          placeholder="اشرح المشكلة بالتفصيل..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">الأولوية</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => onSelectChange('priority', value)}
          >
            <SelectTrigger id="priority">
              <SelectValue placeholder="اختر الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">منخفضة</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="critical">حرجة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requestedDate">التاريخ المطلوب</Label>
          <Input
            id="requestedDate"
            name="requestedDate"
            type="date"
            value={formData.requestedDate}
            onChange={onFormChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedCost">التكلفة المتوقعة (ريال)</Label>
          <Input
            id="estimatedCost"
            name="estimatedCost"
            type="number"
            value={formData.estimatedCost}
            onChange={onFormChange}
            placeholder="اختياري"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">إرفاق ملفات</Label>
        <Input
          id="attachment"
          type="file"
          onChange={onFileChange}
          multiple
          accept="image/*,application/pdf,.doc,.docx"
          className="cursor-pointer"
        />
        <p className="text-xs text-muted-foreground">
          يمكنك إرفاق صور أو مستندات متعلقة بالطلب (الحد الأقصى: 5 ملفات)
        </p>
        {formData.attachments.length > 0 && (
          <div className="text-sm text-green-600">
            تم اختيار {formData.attachments.length} ملف(ات)
          </div>
        )}
      </div>
    </>
  );
};

export default QuickFormFields;
