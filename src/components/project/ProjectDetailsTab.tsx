
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Project {
  id: string;
  name: string;
  category?: string;
  image?: string;
  location?: string;
  description?: string;
  created_at: string;
  status?: string;
  progress?: number;
  model3d_url?: string;
}

interface ProjectDetailsTabProps {
  project: Project;
}

const ProjectDetailsTab: React.FC<ProjectDetailsTabProps> = ({ project }) => {
  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'جديد': return 'bg-blue-500';
      case 'قيد التنفيذ': return 'bg-yellow-500';
      case 'مكتمل': return 'bg-green-500';
      case 'متوقف': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>تفاصيل المشروع</CardTitle>
        <CardDescription>كافة المعلومات والتفاصيل المتعلقة بالمشروع</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold mb-4">معلومات المشروع</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">اسم المشروع</h4>
                <p>{project.name}</p>
              </div>
              {project.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">الفئة</h4>
                  <p>{project.category}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-500">الموقع</h4>
                <p>{project.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">الحالة</h4>
                <p className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(project.status)}`}></span>
                  {project.status || 'جديد'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">تاريخ الإنشاء</h4>
                <p>{new Date(project.created_at).toLocaleDateString('ar-EG')}</p>
              </div>
              {(project.progress !== undefined) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">نسبة الإنجاز</h4>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2 w-32" />
                    <span>{project.progress}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="font-bold mb-4">الوصف</h3>
            <p className="text-gray-700">{project.description || 'لا يوجد وصف متوفر'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsTab;
