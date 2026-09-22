import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FolderOpen, Wrench, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'project' | 'maintenance';
  title: string;
  description: string;
  href: string;
  meta?: string;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (event?: React.FormEvent): Promise<void> => {
    event?.preventDefault();
    const value = query.trim();
    if (value.length < 2) return;

    setLoading(true);
    setSearched(true);
    const safe = value.replace(/[%_,]/g, ' ');
    const pattern = `%${safe}%`;

    try {
      const [projectsResult, maintenanceResult] = await Promise.all([
        supabase.from('projects').select('id,name,description,status').or(`name.ilike.${pattern},description.ilike.${pattern}`).limit(20),
        supabase.from('maintenance_requests').select('id,title,description,status,priority').or(`title.ilike.${pattern},description.ilike.${pattern},client_name.ilike.${pattern},location.ilike.${pattern}`).limit(20),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (maintenanceResult.error) throw maintenanceResult.error;

      const projectRows: SearchResult[] = (projectsResult.data || []).map((row) => ({
        id: row.id,
        type: 'project',
        title: row.name,
        description: row.description || '',
        href: `/projects/${row.id}`,
        meta: row.status || undefined,
      }));

      const maintenanceRows: SearchResult[] = (maintenanceResult.data || []).map((row) => ({
        id: row.id,
        type: 'maintenance',
        title: row.title,
        description: row.description || '',
        href: `/maintenance-request-details/${row.id}`,
        meta: [row.status, row.priority].filter(Boolean).join(' • '),
      }));

      setResults([...projectRows, ...maintenanceRows]);
    } catch (error) {
      console.error('[search] query failed', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div><h2 className="text-2xl font-bold">البحث</h2><p className="text-muted-foreground">بحث موحد في المشاريع وطلبات الصيانة.</p></div>
        <form onSubmit={(e) => void runSearch(e)} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="اسم مشروع، طلب صيانة، عميل أو موقع..." className="pe-10" />
          </div>
          <Button type="submit" disabled={loading || query.trim().length < 2}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}</Button>
        </form>

        <div className="space-y-3">
          {results.map((result) => (
            <Link key={`${result.type}-${result.id}`} to={result.href}>
              <Card className="mb-3 transition-colors hover:border-construction-primary">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-1">{result.type === 'project' ? <FolderOpen className="h-5 w-5 text-construction-primary" /> : <Wrench className="h-5 w-5 text-construction-primary" />}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{result.title}</h3><span className="text-xs text-muted-foreground">{result.meta}</span></div>
                    {result.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.description}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {searched && !loading && results.length === 0 && <p className="py-10 text-center text-muted-foreground">لا توجد نتائج مطابقة.</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;
