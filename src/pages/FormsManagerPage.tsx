import React, { useEffect, useMemo, useState } from 'react';
import { Download, File, FileArchive, FileImage, FileSpreadsheet, FileText, RefreshCw, Search } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory' | string;
  mtime?: string;
  size?: number;
}

const FILES_ENDPOINT = '/fm-files/';

const formatSize = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const extensionOf = (name: string) => {
  const index = name.lastIndexOf('.');
  return index > -1 ? name.slice(index + 1).toLowerCase() : '';
};

const fileIcon = (name: string) => {
  const ext = extensionOf(name);
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return FileText;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return FileImage;
  if (['zip', 'rar', '7z'].includes(ext)) return FileArchive;
  return File;
};

const FormsManagerPage: React.FC = () => {
  const [files, setFiles] = useState<DirectoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(FILES_ENDPOINT, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as DirectoryEntry[];
      const visibleFiles = Array.isArray(data)
        ? data
            .filter((item) => item.type === 'file' && item.name && !item.name.startsWith('.'))
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
        : [];

      setFiles(visibleFiles);
    } catch (err) {
      console.error('Failed to load work forms:', err);
      setError('تعذر تحميل قائمة النماذج حالياً.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const filteredFiles = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ar');
    if (!normalized) return files;
    return files.filter((file) => file.name.toLocaleLowerCase('ar').includes(normalized));
  }, [files, query]);

  return (
    <PageLayout title="نماذج العمل">
      <section className="mx-auto max-w-5xl" dir="rtl">
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-construction-primary">مركز تحميل النماذج</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                النسخ المعتمدة من نماذج التشغيل والتوريد والصيانة. يتم تحديث القائمة تلقائياً عند إضافة أي ملف جديد.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{files.length} ملف</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث باسم النموذج..."
                className="h-11 w-full rounded-xl border border-input bg-background pr-10 pl-4 text-sm outline-none transition focus:border-construction-primary focus:ring-2 focus:ring-construction-primary/15"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadFiles()}
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>جاري تحميل النماذج...</span>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
              <FileText className="h-9 w-9" />
              <p className="font-medium">لا توجد نماذج مطابقة.</p>
              <p className="text-sm">ستظهر الملفات هنا تلقائياً بمجرد إضافتها إلى مجلد النماذج على السيرفر.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredFiles.map((file) => {
                const Icon = fileIcon(file.name);
                const extension = extensionOf(file.name).toUpperCase() || 'FILE';
                const downloadUrl = `${FILES_ENDPOINT}${encodeURIComponent(file.name)}`;

                return (
                  <article key={file.name} className="flex flex-col gap-4 p-4 transition hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between md:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-construction-primary/10 text-construction-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground" title={file.name}>{file.name}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span>{extension}</span>
                          <span>{formatSize(file.size)}</span>
                          <span>آخر تعديل: {formatDate(file.mtime)}</span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={downloadUrl}
                      download
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-construction-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Download className="h-4 w-4" />
                      تحميل
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default FormsManagerPage;
