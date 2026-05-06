
import React from 'react';
import { Link } from "react-router-dom";
import { projectsData } from "@/data/projectsData";

const ProjectsShowcase: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pb-16">
      <section className="bg-gradient-to-r from-construction-primary to-construction-secondary py-16 text-white text-center">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">مشاريعنا – حيث يلتقي الإبداع مع الجودة</h1>
          <p className="text-xl text-construction-light mb-6 max-w-2xl mx-auto">
            في قلب كل مشروع من مشاريعنا تكمن قصة من التميز، الإبداع والشغف بالتفاصيل.
            تصفحوا مشاريعنا من الفلل الفاخرة إلى المجمعات التجارية والسكنية — استشعروا التزامنا الراسخ بمعايير الجودة، الإلهام الفني، وتجربة العملاء الفريدة.
            هذه ليست مجرد مبانٍ... بل تحف معمارية تُلبي تطلعاتكم وتبعث فيكم روح الحياة.
          </p>
        </div>
      </section>
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {projectsData.map((project) => (
            <div key={project.id} className="group border rounded-xl overflow-hidden shadow bg-white hover:shadow-xl transition-all duration-200">
              <Link to={`/projects-gallery/${project.id}`}>
                <img src={project.image} alt={project.name} className="w-full h-48 object-cover group-hover:scale-105 transition-all duration-200" />
                <div className="p-5">
                  <h2 className="font-bold text-lg text-construction-primary">{project.name}</h2>
                  <p className="text-gray-600 mt-2 text-sm">{project.teaser}</p>
                  <span className="inline-block mt-4 px-3 py-1 text-xs rounded bg-construction-accent/80 text-white">{project.category}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <footer className="text-center text-construction-primary mt-16 text-lg font-semibold py-8 border-t">مشاريعنا تتحدث عنّا — نحن لا نبني فقط، بل نرسم تفاصيل الحياة.</footer>
      </main>
    </div>
  );
};

export default ProjectsShowcase;
