import React from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Calendar, Clipboard, Clock, Share2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/useProject';
import PageLayout from '@/components/layout/PageLayout';
import Project3DModelTab from '@/components/project/Project3DModelTab';
import ProjectDetailsTab from '@/components/project/ProjectDetailsTab';
import ProjectFilesTab from '@/components/project/ProjectFilesTab';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectStatusTab from '@/components/project/ProjectStatusTab';

type ProjectTab = 'details' | 'files' | '3d' | 'status';

const validProjectTabs = new Set<ProjectTab>(['details', 'files', '3d', 'status']);

interface ProjectDetailsContentProps {
  projectId: string;
}

const ProjectDetailsContent: React.FC<ProjectDetailsContentProps> = ({ projectId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    project,
    loading,
    files,
    loadingFiles,
    fetchProjectDetails,
    fetchProjectFiles,
    handleDownloadFile,
    handleDeleteFile,
  } = useProject(projectId);

  const requestedTab = searchParams.get('tab');
  const activeTab: ProjectTab = requestedTab && validProjectTabs.has(requestedTab as ProjectTab)
    ? (requestedTab as ProjectTab)
    : 'details';

  const handleTabChange = (value: string): void => {
    if (!validProjectTabs.has(value as ProjectTab)) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (value === 'details') {
      nextSearchParams.delete('tab');
    } else {
      nextSearchParams.set('tab', value);
    }
    setSearchParams(nextSearchParams, { replace: true });
  };

  const handleShareProject = async (): Promise<void> => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `مشروع: ${project?.name || ''}`,
          text: `تفاصيل مشروع ${project?.name || ''} من شركة العزب للمقاولات`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط المشروع إلى الحافظة',
        duration: 3000,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast({
        variant: 'destructive',
        title: 'تعذرت مشاركة المشروع',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      });
    }
  };

  if (loading) {
    return (
      <PageLayout title="تفاصيل المشروع">
        <div className="py-10 text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-construction-primary" />
          <p>جارٍ تحميل بيانات المشروع...</p>
        </div>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout title="تفاصيل المشروع">
        <div className="flex flex-col items-center space-y-4 py-10 text-center">
          <div className="mb-4 rounded-full bg-red-50 p-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-700">لم يتم العثور على المشروع</h2>
          <p className="text-gray-500">لا يمكن العثور على المشروع المطلوب</p>
          <Button className="mt-4" asChild>
            <Link to="/project-management">
              <ArrowRight className="ml-2" size={16} />
              العودة إلى إدارة المشاريع
            </Link>
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={`مشروع: ${project.name}`}>
      <ProjectHeader project={project} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void handleShareProject()}>
          <Share2 size={16} className="ml-2" />
          مشاركة
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/project-management">
            <Clipboard size={16} className="ml-2" />
            إدارة المشاريع
          </Link>
        </Button>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-2 bg-gray-50 py-1.5 text-gray-700">
          <Calendar size={14} className="text-construction-primary" />
          تاريخ الإنشاء: {new Date(project.created_at).toLocaleDateString('ar-EG')}
        </Badge>
        {project.status && (
          <Badge
            className={`gap-2 py-1.5 ${
              project.status === 'مكتمل'
                ? 'bg-green-100 text-green-800'
                : project.status === 'قيد التنفيذ'
                  ? 'bg-yellow-100 text-yellow-800'
                  : project.status === 'متوقف'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
            }`}
          >
            <Clock size={14} />
            {project.status}
          </Badge>
        )}
        {project.client_name && (
          <Badge variant="outline" className="gap-2 bg-gray-50 py-1.5 text-gray-700">
            <User size={14} className="text-construction-primary" />
            العميل: {project.client_name}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap justify-start bg-gray-100 p-1">
          <TabsTrigger value="details" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
            تفاصيل المشروع
          </TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
            ملفات المشروع
            {files?.length > 0 && (
              <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-construction-accent text-xs text-white">
                {files.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="3d" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
            عرض ثلاثي الأبعاد
          </TabsTrigger>
          <TabsTrigger value="status" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
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

const ProjectDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <Navigate to="/project-management" replace />;
  }

  return <ProjectDetailsContent projectId={projectId} />;
};

export default ProjectDetails;
