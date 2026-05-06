
import { Project } from '../types/project';
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { ArrowRight, Calendar, User, Clipboard, Clock, Share2, Download } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import { useProject } from '../hooks/useProject';
import ProjectHeader from '../components/project/ProjectHeader';
import ProjectDetailsTab from '../components/project/ProjectDetailsTab';
import ProjectFilesTab from '../components/project/ProjectFilesTab';
import Project3DModelTab from '../components/project/Project3DModelTab';
import ProjectStatusTab from '../components/project/ProjectStatusTab';
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import ProtectedRoute from '../components/auth/ProtectedRoute';

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { 
    project,
    loading,
    files,
    loadingFiles,
    fetchProjectDetails,
    fetchProjectFiles,
    handleDownloadFile,
    handleDeleteFile
  } = useProject(projectId);
  
  const [activeTab, setActiveTab] = useState("details");
  
  // مشاركة المشروع
  const handleShareProject = () => {
    if (navigator.share) {
      navigator.share({
        title: `مشروع: ${project?.name}`,
        text: `تفاصيل مشروع ${project?.name} من شركة العزب للمقاولات`,
        url: window.location.href,
      })
      .catch((error) => console.log('حدث خطأ في المشاركة', error));
    } else {
      // نسخ الرابط إلى الحافظة
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط المشروع إلى الحافظة",
        duration: 3000,
      });
    }
  };

  const ProjectDetailsContent = () => {
    if (loading) {
      return (
        <PageLayout title="تفاصيل المشروع">
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-construction-primary mb-4"></div>
            <p>جارٍ تحميل بيانات المشروع...</p>
          </div>
        </PageLayout>
      );
    }

    if (!project) {
      return (
        <PageLayout title="تفاصيل المشروع">
          <div className="text-center py-10 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-red-50 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-700">لم يتم العثور على المشروع</h2>
            <p className="text-gray-500">لا يمكن العثور على المشروع المطلوب</p>
            <Link to="/project-management">
              <Button className="mt-4">
                <ArrowRight className="ml-2" size={16} />
                العودة إلى إدارة المشاريع
              </Button>
            </Link>
          </div>
        </PageLayout>
      );
    }

    return (
      <PageLayout title={`مشروع: ${project.name}`}>
        <ProjectHeader project={project} />

        {/* أزرار سريعة */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShareProject}
            className="text-sm"
          >
            <Share2 size={16} className="ml-2" />
            مشاركة
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm"
            asChild
          >
            <Link to={`/project-management`}>
              <Clipboard size={16} className="ml-2" />
              إدارة المشاريع
            </Link>
          </Button>
        </div>

        {/* شارات معلومات المشروع */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Badge variant="outline" className="bg-gray-50 text-gray-700 gap-2 py-1.5">
            <Calendar size={14} className="text-construction-primary" />
            تاريخ الإنشاء: {new Date(project.created_at).toLocaleDateString('ar-EG')}
          </Badge>
          {project.status && (
            <Badge 
              className={`gap-2 py-1.5 ${
                project.status === 'مكتمل' ? 'bg-green-100 text-green-800' :
                project.status === 'قيد التنفيذ' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'متوقف' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              <Clock size={14} />
              {project.status}
            </Badge>
          )}
          {project.client_name && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700 gap-2 py-1.5">
              <User size={14} className="text-construction-primary" />
              العميل: {project.client_name}
            </Badge>
          )}
        </div>

        {/* علامات تبويب المحتوى */}
        <Tabs 
          defaultValue="details" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-6 bg-gray-100 p-1">
            <TabsTrigger 
              value="details"
              className="data-[state=active]:bg-construction-primary data-[state=active]:text-white"
            >
              تفاصيل المشروع
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="data-[state=active]:bg-construction-primary data-[state=active]:text-white"
            >
              ملفات المشروع
              {files?.length > 0 && <span className="mr-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-construction-accent text-white">{files.length}</span>}
            </TabsTrigger>
            <TabsTrigger 
              value="3d"
              className="data-[state=active]:bg-construction-primary data-[state=active]:text-white"
            >
              عرض ثلاثي الأبعاد
            </TabsTrigger>
            <TabsTrigger 
              value="status"
              className="data-[state=active]:bg-construction-primary data-[state=active]:text-white"
            >
              حالة المشروع
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="animate-fadeIn">
            <ProjectDetailsTab project={project} />
          </TabsContent>

          <TabsContent value="files" className="animate-fadeIn">
            <ProjectFilesTab 
              projectId={project.id}
              files={files}
              loadingFiles={loadingFiles}
              onFileUploaded={fetchProjectFiles}
              onDownload={handleDownloadFile}
              onDelete={handleDeleteFile}
            />
          </TabsContent>

          <TabsContent value="3d" className="animate-fadeIn">
            <Project3DModelTab model3dUrl={project.model3d_url} />
          </TabsContent>

          <TabsContent value="status" className="animate-fadeIn">
            <ProjectStatusTab 
              projectId={project.id}
              currentStatus={project.status || 'جديد'}
              currentProgress={project.progress || 0}
              onStatusChanged={fetchProjectDetails}
            />
          </TabsContent>
        </Tabs>
      </PageLayout>
    );
  };

  return (
    <ProtectedRoute>
      <ProjectDetailsContent />
    </ProtectedRoute>
  );
};

export default ProjectDetails;
