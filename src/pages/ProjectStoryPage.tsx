
import React from "react";
import { useParams, Link } from "react-router-dom";
import { projectsData } from "@/data/projectsData";
import { ArrowLeft } from "lucide-react";

const ProjectStoryPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projectsData.find(p => `${p.id}` === projectId);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-center p-8">
        <h2 className="text-3xl font-bold text-construction-primary mb-4">المشروع غير موجود</h2>
        <Link to="/projects-gallery" className="text-construction-primary underline">عودة إلى جميع المشاريع</Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 flex items-center gap-4">
          <Link to="/projects-gallery" className="text-construction-primary flex items-center hover:underline">
            <ArrowLeft className="ml-1" /> العودة لكل المشاريع
          </Link>
        </header>

        <article className="max-w-4xl mx-auto bg-gray-50 rounded-xl shadow-lg p-6">
          <img src={project.image} alt={project.name} className="rounded-lg shadow w-full h-64 object-cover mb-6" />
          <figcaption className="text-center italic text-gray-500 mb-4">{project.caption}</figcaption>
          <h1 className="text-3xl font-bold mb-6 text-construction-primary">{project.name}</h1>
          <p className="mb-4 text-lg font-medium">{project.intro}</p>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-construction-secondary">التحديات والرؤية</h2>
            <p className="text-gray-700">{project.challenge}</p>
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-construction-secondary">النتائج والتأثير</h2>
            <p className="text-gray-700">{project.outcome}</p>
          </div>

          <blockquote className="bg-construction-primary/10 border-r-4 border-construction-primary text-gray-700 italic p-4 mb-6 rounded">
            “{project.quote}”
            <footer className="text-xs text-construction-primary mt-2">— {project.quoteAuthor}</footer>
          </blockquote>

          <section className="bg-white p-3 rounded-lg mb-6 border">
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <li><strong>الفئة:</strong> {project.category}</li>
              <li><strong>العميل:</strong> {project.client}</li>
              <li><strong>الموقع:</strong> {project.location}</li>
              <li><strong>سنة الإنجاز:</strong> {project.year}</li>
            </ul>
            <div className="mt-2">
              <a href={project.link} target="_blank" className="text-construction-primary underline text-sm">رابط المشروع</a>
            </div>
          </section>

          {project.stats && (
            <section className="mb-8">
              <h3 className="text-lg font-bold mb-3 text-construction-primary">المواصفات والإحصاءات</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {project.stats.surfaceWithoutWalls && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">المساحة بدون جدران</div><div className="font-bold text-construction-primary">{project.stats.surfaceWithoutWalls}</div></div>
                )}
                {project.stats.floorArea && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">مساحة الأرضية</div><div className="font-bold text-construction-primary">{project.stats.floorArea}</div></div>
                )}
                {project.stats.volume && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">الحجم</div><div className="font-bold text-construction-primary">{project.stats.volume}</div></div>
                )}
                {project.stats.rooms !== undefined && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">الغرف</div><div className="font-bold text-construction-primary">{project.stats.rooms}</div></div>
                )}
                {project.stats.doors !== undefined && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">الأبواب</div><div className="font-bold text-construction-primary">{project.stats.doors}</div></div>
                )}
                {project.stats.windows !== undefined && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">النوافذ</div><div className="font-bold text-construction-primary">{project.stats.windows}</div></div>
                )}
                {project.stats.ceilingHeight && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">ارتفاع السقف</div><div className="font-bold text-construction-primary">{project.stats.ceilingHeight}</div></div>
                )}
                {project.stats.interiorWallThickness && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">سُمك الجدار الداخلي</div><div className="font-bold text-construction-primary">{project.stats.interiorWallThickness}</div></div>
                )}
                {project.stats.exteriorWallThickness && (
                  <div className="bg-white p-3 rounded border"><div className="text-xs text-gray-500">سُمك الجدار الخارجي</div><div className="font-bold text-construction-primary">{project.stats.exteriorWallThickness}</div></div>
                )}
              </div>
            </section>
          )}

          {project.model3dUrl && (
            <section className="mb-8">
              <h3 className="text-lg font-bold mb-3 text-construction-primary">استكشف في ثلاثي الأبعاد</h3>
              <div className="overflow-hidden rounded-lg bg-gray-200">
                <iframe
                  src={project.model3dUrl}
                  width="100%"
                  height="500"
                  style={{ border: "none", borderRadius: "10px" }}
                  allowFullScreen
                  loading="lazy"
                  title={`عرض ثلاثي الأبعاد – ${project.name}`}
                ></iframe>
              </div>
            </section>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link to="/projects-gallery" className="block bg-construction-primary text-white rounded px-5 py-3 text-center font-bold hover:bg-construction-dark">
              اكتشف المزيد من المشاريع
            </Link>
            <Link to="/contact" className="block border border-construction-primary text-construction-primary rounded px-5 py-3 text-center font-bold hover:bg-construction-primary hover:text-white">
              اطلب تصميمك الخاص الآن
            </Link>
          </div>
        </article>
        <footer className="text-center text-construction-primary mt-12 text-lg font-semibold py-8">مشاريعنا تتحدث عنّا — نحن لا نبني فقط، بل نرسم تفاصيل الحياة.</footer>
      </div>
    </div>
  );
};

export default ProjectStoryPage;
