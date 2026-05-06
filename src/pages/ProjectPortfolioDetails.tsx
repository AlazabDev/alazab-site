
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Breadcrumb } from '../components/ui/breadcrumb';
import ProjectImageGallery from '../components/project/ProjectImageGallery';
import TechStackBadges from '../components/project/TechStackBadges';
import ProjectAccordion from '../components/project/ProjectAccordion';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, User, Tag, ArrowLeft, ArrowRight } from 'lucide-react';

const ProjectPortfolioDetails: React.FC = () => {
  const { projectId } = useParams();

  // بيانات تجريبية للمشروع
  const project = {
    id: projectId || '1',
    title: 'نظام إدارة المشاريع الذكي',
    category: 'UX/UI Design',
    client: 'DigitalCraft Solutions',
    date: 'سبتمبر 2024',
    url: 'https://example.com',
    shortDescription: 'نظام شامل لإدارة المشاريع يوفر تتبعاً فورياً للمهام والتقارير التفاعلية مع واجهة مستخدم حديثة ومتجاوبة.',
    images: [
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    technologies: ['React', 'TypeScript', 'Supabase', 'Tailwind', 'Express.js', 'PostgreSQL'],
    features: [
      'التصور البياني الفوري للبيانات',
      'إدارة الصلاحيات المتقدمة',
      'المصادقة الآمنة',
      'تصميم متجاوب',
      'تقارير تفاعلية',
      'إشعارات فورية'
    ],
    accordionItems: [
      {
        title: 'نظرة عامة على المشروع',
        content: 'تم تطوير هذا النظام لتلبية احتياجات الشركات الحديثة في إدارة المشاريع بكفاءة عالية. يوفر النظام واجهة بديهية وأدوات متقدمة لتتبع التقدم وإدارة الفرق والموارد.'
      },
      {
        title: 'التحدي الذي تم حله',
        content: 'كانت الشركة تواجه صعوبات في تتبع المشاريع المتعددة وتنسيق العمل بين الفرق المختلفة. كما كانت هناك حاجة إلى نظام موحد للتقارير والتحليلات.'
      },
      {
        title: 'الحل الذي تم تقديمه',
        content: 'تم تطوير نظام شامل يجمع بين إدارة المهام والمشاريع مع أدوات التعاون والتواصل. النظام يوفر لوحات تحكم تفاعلية وتقارير مفصلة في الوقت الفعلي.'
      }
    ]
  };

  const breadcrumbItems = [
    { label: 'المشاريع', href: '/projects' },
    { label: project.title }
  ];

  return (
    <div className="bg-white min-h-screen">
      <Header />
      
      <main className="pt-24">
        {/* Page Title Section */}
        <section className="bg-gradient-to-r from-construction-primary to-construction-secondary py-16 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">تفاصيل المشروع</h1>
              <p className="text-xl text-construction-light mb-6">
                استكشف تفاصيل هذا المشروع المميز وتقنياته المتطورة
              </p>
              <Breadcrumb items={breadcrumbItems} className="justify-center text-construction-light" />
            </div>
          </div>
        </section>

        {/* Project Details Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Side - Media */}
              <div className="animate-fade-in-up">
                <ProjectImageGallery images={project.images} projectName={project.title} />
                
                <div className="mt-8">
                  <TechStackBadges technologies={project.technologies} />
                </div>
              </div>

              {/* Right Side - Content */}
              <div className="animate-slide-in-right">
                {/* Project Meta */}
                <div className="mb-6">
                  <span className="inline-block bg-construction-accent text-construction-dark px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {project.category}
                  </span>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">{project.title}</h2>
                  
                  <div className="space-y-3 text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-construction-primary" />
                      <span>العميل: {project.client}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-construction-primary" />
                      <span>تاريخ الإنجاز: {project.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink size={18} className="text-construction-primary" />
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-construction-primary hover:text-construction-secondary transition-colors"
                      >
                        زيارة الموقع المباشر
                      </a>
                    </div>
                  </div>
                </div>

                {/* Short Description */}
                <div className="mb-8">
                  <p className="text-gray-600 leading-relaxed text-lg">{project.shortDescription}</p>
                </div>

                {/* Key Features */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Tag size={20} className="text-construction-primary" />
                    المزايا الرئيسية
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {project.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 bg-construction-accent rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accordion */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل إضافية</h3>
                  <ProjectAccordion items={project.accordionItems} />
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    asChild
                    className="bg-construction-primary hover:bg-construction-secondary text-white"
                  >
                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink size={18} className="ml-2" />
                      زيارة المشروع الحي
                    </a>
                  </Button>
                  <Button 
                    variant="outline"
                    asChild
                    className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white"
                  >
                    <Link to="/projects">
                      <ArrowRight size={18} className="ml-2" />
                      العودة للمشاريع
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Navigation Section */}
        <section className="bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <Button variant="ghost" className="text-construction-primary hover:text-construction-secondary">
                <ArrowRight size={18} className="ml-2" />
                المشروع السابق
              </Button>
              <Button variant="ghost" className="text-construction-primary hover:text-construction-secondary">
                المشروع التالي
                <ArrowLeft size={18} className="mr-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectPortfolioDetails;
