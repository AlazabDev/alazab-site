
import React, { useState } from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";

interface ProjectViewer3DProps {
  embedUrl: string;
}

const ProjectViewer3D: React.FC<ProjectViewer3DProps> = ({ embedUrl }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // وظيفة للتبديل إلى وضع ملء الشاشة
  const toggleFullscreen = () => {
    if (!embedUrl) return;
    
    const elem = document.getElementById('model-viewer');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`خطأ في محاولة عرض النموذج في وضع ملء الشاشة: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  // الاستماع لحدث الخروج من وضع ملء الشاشة
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
      {embedUrl ? (
        <div className="w-full relative">
          <AspectRatio ratio={16 / 9} className="overflow-hidden">
            <iframe
              id="model-viewer"
              src={embedUrl}
              className="w-full h-full"
              allowFullScreen={true}
              style={{ border: 0 }}
              title="عرض ثلاثي الأبعاد للمشروع"
              loading="lazy"
            ></iframe>
          </AspectRatio>
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-2 left-2 bg-white/80 hover:bg-white z-10 shadow-sm"
            onClick={toggleFullscreen}
            title="عرض في وضع ملء الشاشة"
          >
            <Maximize size={18} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-center aspect-video bg-gray-100 text-gray-500">
          <div className="text-center p-4 md:p-8">
            <div className="mb-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-8 w-8 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base md:text-lg font-medium animate-pulse">لا يوجد عرض ثلاثي الأبعاد متاح لهذا المشروع</p>
            <p className="text-xs md:text-sm text-gray-400 mt-2">يمكنك إضافة رابط العرض ثلاثي الأبعاد من خلال تعديل بيانات المشروع</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectViewer3D;
