
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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

interface ProjectHeaderProps {
  project: Project;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
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
    <>
      <div className="mb-6">
        <Link to="/project-management" className="text-construction-primary hover:underline flex items-center">
          <ArrowRight className="ml-2" size={16} />
          العودة إلى إدارة المشاريع
        </Link>
      </div>

      {/* Project Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="md:w-1/3">
          <div className="rounded-lg overflow-hidden border border-gray-200 h-[250px]">
            <img 
              src={project.image || '/placeholder.svg'} 
              alt={project.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="md:w-2/3">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold text-construction-primary">{project.name}</h1>
            <span className={`text-white px-3 py-1 rounded-full text-sm ${getStatusColor(project.status)}`}>
              {project.status || 'جديد'}
            </span>
          </div>
          
          {(project.progress !== undefined && project.progress > 0) && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">نسبة الإنجاز</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
          )}
          
          <div className="flex flex-wrap gap-4 mb-4">
            {project.category && (
              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                <span className="font-bold ml-1">الفئة:</span> {project.category}
              </div>
            )}
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              <span className="font-bold ml-1">الموقع:</span> {project.location}
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
              <span className="font-bold ml-1">تاريخ الإنشاء:</span> {new Date(project.created_at).toLocaleDateString('ar-EG')}
            </div>
          </div>
          <p className="text-gray-700">{project.description}</p>
        </div>
      </div>
    </>
  );
};

export default ProjectHeader;
