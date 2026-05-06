
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProjectStatusChange from './ProjectStatusChange';

interface ProjectStatusTabProps {
  projectId: string;
  currentStatus: string;
  currentProgress: number;
  onStatusChanged: () => void;
}

const ProjectStatusTab: React.FC<ProjectStatusTabProps> = ({ 
  projectId, 
  currentStatus, 
  currentProgress, 
  onStatusChanged 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تحديث حالة المشروع</CardTitle>
        <CardDescription>قم بتحديث حالة المشروع ونسبة الإنجاز</CardDescription>
      </CardHeader>
      <CardContent>
        <ProjectStatusChange 
          projectId={projectId}
          currentStatus={currentStatus}
          currentProgress={currentProgress}
          onStatusChanged={onStatusChanged}
        />
      </CardContent>
    </Card>
  );
};

export default ProjectStatusTab;
