import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, MapPin, User, ArrowRight, Loader2 } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import ProjectImageGallery from '@/components/project/ProjectImageGallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface PublicProject {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  client_name: string | null;
  company_name: string | null;
  location: string | null;
  cover_image_url: string | null;
  year: number | null;
  end_date: string | null;
}

const ProjectPortfolioDetails: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<PublicProject | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    let active = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      const [{ data: projectRow, error: projectError }, { data: imageRows, error: imagesError }] = await Promise.all([
        supabase.from('projects').select('id,name,description,short_description,category,client_name,company_name,location,cover_image_url,year,end_date').eq('id', projectId).eq('is_published', true).maybeSingle(),
        supabase.from('project_images').select('image_url,order_index').eq('project_id', projectId).order('order_index'),
      ]);

      if (!active) return;
      if (projectError) console.error('[portfolio] project load failed', projectError);
      if (imagesError) console.error('[portfolio] images load failed', imagesError);
      setProject(projectRow as PublicProject | null);
      const gallery = (imageRows || []).map((row) => row.image_url);
      if (projectRow?.cover_image_url && !gallery.includes(projectRow.cover_image_url)) gallery.unshift(projectRow.cover_image_url);
      setImages(gallery.length ? gallery : ['/placeholder.svg']);
      setLoading(false);
    };

    void load();
    return () => { active = false; };
  }, [projectId]);

  if (loading) return <PageLayout title="تفاصيل المشروع"><div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></PageLayout>;

  if (!project) {
    return (
      <PageLayout title="المشروع غير متاح">
        <div className="py-12 text-center"><p className="mb-4 text-muted-foreground">المشروع غير منشور أو غير موجود.</p><Button asChild><Link to="/projects">العودة إلى المشاريع</Link></Button></div>
      </PageLayout>
    );
  }

  const client = project.client_name || project.company_name;
  const completion = project.year || (project.end_date ? new Date(project.end_date).getFullYear() : null);

  return (
    <PageLayout title={project.name}>
      <div className="grid gap-10 lg:grid-cols-2">
        <ProjectImageGallery images={images} projectName={project.name} />
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">{project.category && <Badge>{project.category}</Badge>}</div>
          <p className="text-lg leading-8 text-muted-foreground">{project.description || project.short_description || 'تفاصيل المشروع قيد التحديث.'}</p>
          <div className="space-y-3 rounded-xl border p-5">
            {client && <div className="flex items-center gap-2"><User className="h-4 w-4 text-construction-primary" /><span>العميل: {client}</span></div>}
            {project.location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-construction-primary" /><span>{project.location}</span></div>}
            {completion && <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-construction-primary" /><span>سنة الإنجاز: {completion}</span></div>}
          </div>
          <Button variant="outline" asChild><Link to="/projects"><ArrowRight className="me-2 h-4 w-4" />العودة إلى المشاريع</Link></Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProjectPortfolioDetails;
