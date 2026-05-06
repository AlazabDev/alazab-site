
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, FileType, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectFileUpload from './ProjectFileUpload';
import ProjectFilesList from './ProjectFilesList';
import { Button } from '@/components/ui/button';

interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file_url: string;
  uploaded_at: string;
}

interface ProjectFilesTabProps {
  projectId: string;
  files: ProjectFile[];
  loadingFiles: boolean;
  onFileUploaded: () => void;
  onDownload: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
}

// وظيفة لتحويل أنواع الملفات إلى مجموعات
const categorizeFiles = (files: ProjectFile[]) => {
  const categories = {
    documents: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'],
    spreadsheets: ['xls', 'xlsx', 'csv'],
    presentations: ['ppt', 'pptx'],
    other: []
  };
  
  const categorized = {
    documents: [] as ProjectFile[],
    images: [] as ProjectFile[],
    spreadsheets: [] as ProjectFile[],
    presentations: [] as ProjectFile[],
    other: [] as ProjectFile[]
  };
  
  files.forEach(file => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (categories.documents.includes(ext)) {
      categorized.documents.push(file);
    } else if (categories.images.includes(ext)) {
      categorized.images.push(file);
    } else if (categories.spreadsheets.includes(ext)) {
      categorized.spreadsheets.push(file);
    } else if (categories.presentations.includes(ext)) {
      categorized.presentations.push(file);
    } else {
      categorized.other.push(file);
    }
  });
  
  return categorized;
};

const ProjectFilesTab: React.FC<ProjectFilesTabProps> = ({ 
  projectId, 
  files, 
  loadingFiles,
  onFileUploaded,
  onDownload,
  onDelete
}) => {
  // التحقق من التنفيذ على جانب العميل
  const isClient = typeof window !== 'undefined';
  const categorizedFiles = categorizeFiles(files || []);
  
  const getFileCountBadge = (count: number) => {
    if (count === 0) return null;
    return <span className="mr-1 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{count}</span>;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="md:px-6">
        <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
          <FileText className="text-construction-primary" />
          ملفات المشروع
        </CardTitle>
        <CardDescription className="text-sm md:text-base">يمكنك تحميل وإدارة ملفات المشروع من هنا</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 overflow-x-auto md:px-6">
        {/* قسم تحميل الملفات */}
        {isClient && !loadingFiles && (
          <div className="w-full bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
            <div className="text-center mb-4">
              <Upload className="mx-auto mb-2 text-construction-primary" size={24} />
              <h3 className="font-semibold text-gray-700">رفع ملفات المشروع</h3>
              <p className="text-sm text-gray-500">يمكنك رفع ملفات المستندات والصور والجداول وغيرها</p>
            </div>
            <ProjectFileUpload 
              projectId={projectId} 
              onFileUploaded={onFileUploaded} 
            />
          </div>
        )}
        
        {/* عرض قائمة الملفات */}
        <div className="w-full">
          {loadingFiles ? (
            <div className="text-center py-6 md:py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-construction-primary"></div>
              <p className="mt-2">جاري تحميل الملفات...</p>
            </div>
          ) : files && files.length > 0 ? (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4 bg-gray-100">
                <TabsTrigger value="all" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
                  جميع الملفات {getFileCountBadge(files.length)}
                </TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
                  مستندات {getFileCountBadge(categorizedFiles.documents.length)}
                </TabsTrigger>
                <TabsTrigger value="images" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
                  صور {getFileCountBadge(categorizedFiles.images.length)}
                </TabsTrigger>
                <TabsTrigger value="spreadsheets" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
                  جداول {getFileCountBadge(categorizedFiles.spreadsheets.length)}
                </TabsTrigger>
                <TabsTrigger value="other" className="data-[state=active]:bg-construction-primary data-[state=active]:text-white">
                  أخرى {getFileCountBadge(categorizedFiles.other.length)}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="overflow-x-auto">
                  <ProjectFilesList 
                    files={files} 
                    onDownload={onDownload} 
                    onDelete={onDelete} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="overflow-x-auto">
                  {categorizedFiles.documents.length > 0 ? (
                    <ProjectFilesList 
                      files={categorizedFiles.documents} 
                      onDownload={onDownload} 
                      onDelete={onDelete} 
                    />
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileType className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-500">لا توجد مستندات مرفوعة</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="images">
                <div className="overflow-x-auto">
                  {categorizedFiles.images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {categorizedFiles.images.map(file => (
                        <Card key={file.id} className="overflow-hidden group border-gray-200 hover:shadow-md transition-shadow">
                          <div className="h-40 w-full overflow-hidden bg-gray-100">
                            <img 
                              src={file.file_url} 
                              alt={file.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => onDownload(file)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon" 
                                  className="h-7 w-7" 
                                  onClick={() => onDelete(file)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileType className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-500">لا توجد صور مرفوعة</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="spreadsheets">
                <div className="overflow-x-auto">
                  {categorizedFiles.spreadsheets.length > 0 ? (
                    <ProjectFilesList 
                      files={categorizedFiles.spreadsheets} 
                      onDownload={onDownload} 
                      onDelete={onDelete} 
                    />
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileType className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-500">لا توجد جداول مرفوعة</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="other">
                <div className="overflow-x-auto">
                  {categorizedFiles.other.length > 0 ? (
                    <ProjectFilesList 
                      files={categorizedFiles.other} 
                      onDownload={onDownload} 
                      onDelete={onDelete} 
                    />
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <FileType className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-500">لا توجد ملفات أخرى مرفوعة</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <FileType className="mx-auto mb-4 text-gray-400" size={40} />
              <h3 className="text-lg font-medium mb-1">لا توجد ملفات حالياً</h3>
              <p className="text-sm text-gray-500 mb-4">قم بتحميل ملفات المشروع لعرضها هنا</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFilesTab;
