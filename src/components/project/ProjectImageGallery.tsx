
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface ProjectImageGalleryProps {
  images: string[];
  projectName: string;
}

const ProjectImageGallery: React.FC<ProjectImageGalleryProps> = ({ images, projectName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-96">
        <p className="text-gray-500">لا توجد صور متاحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative group overflow-hidden rounded-lg">
        <img
          src={images[currentIndex]}
          alt={`${projectName} - صورة ${currentIndex + 1}`}
          className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={() => openLightbox(currentIndex)}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-3 rounded-full shadow-lg hover:bg-gray-50"
          >
            <ZoomIn size={20} className="text-construction-primary" />
          </button>
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200"
            >
              <ChevronLeft size={20} className="text-construction-primary" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all duration-200"
            >
              <ChevronRight size={20} className="text-construction-primary" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative overflow-hidden rounded-lg aspect-square ${
                index === currentIndex
                  ? 'ring-2 ring-construction-accent'
                  : 'hover:opacity-80'
              } transition-all duration-200`}
            >
              <img
                src={image}
                alt={`${projectName} - مصغرة ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all duration-200"
            >
              <X size={20} className="text-white" />
            </button>
            <img
              src={images[currentIndex]}
              alt={`${projectName} - صورة كبيرة ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition-all duration-200"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition-all duration-200"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectImageGallery;
