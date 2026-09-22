import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  PenTool,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { RecentActivity } from '@/components/documents/RecentActivity';
import {
  Document as DBDocument,
  useDocumentAuditLogs,
  useDocuments,
  useDocumentStats,
} from '@/hooks/useDocuments';
import { DocumentStatus, DocumentType } from '@/types/document';
import { Button } from '@/components/ui/button';

function transformDocument(doc: DBDocument) {
  return {
    id: doc.id,
    daftraId: doc.daftra_id || '',
    type: doc.type as DocumentType,
    number: doc.number,
    clientName: doc.client_name,
    clientEmail: doc.client_email || '',
    total: doc.total,
    currency: doc.currency,
    date: doc.date,
    status: doc.status as DocumentStatus,
    paymentStatus: doc.payment_status as 'paid' | 'partial' | 'unpaid',
    pdfUrl: doc.pdf_url || undefined,
    htmlUrl: doc.html_url || undefined,
    fileUrl: doc.file_url || undefined,
    syncedAt: doc.synced_at || undefined,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

export default function Dashboard() {
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: stats, isLoading: statsLoading } = useDocumentStats();
  const { data: auditLogs = [], isLoading: logsLoading } = useDocumentAuditLogs();

  const recentDocuments = documents.slice(0, 4).map(transformDocument);
  const completedCount = documents.filter((doc) => ['approved', 'signed', 'archived'].includes(doc.status)).length;
  const completionRate = documents.length ? Math.round((completedCount / documents.length) * 100) : 0;

  const transformedLogs = auditLogs.map((log) => ({
    id: log.id,
    actorId: log.actor_id || 'external',
    actorName: log.actor_name,
    action: log.action,
    entityType: 'document' as const,
    entityId: log.document_id,
    createdAt: log.created_at,
  }));

  if (docsLoading || statsLoading || logsLoading) {
    return (
      <MainLayout title="لوحة الاعتماد" subtitle="جاري تحميل حالة النظام">
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="لوحة الاعتماد" subtitle="متابعة مراجعة واعتماد المستندات">
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="قيد المراجعة" value={stats?.inReview || 0} icon={<Clock className="h-6 w-6" />} variant="warning" delay={0} />
        <StatCard title="يحتاج تعديل" value={stats?.needsFix || 0} icon={<AlertCircle className="h-6 w-6" />} variant="danger" delay={50} />
        <StatCard title="جاهز للاعتماد" value={stats?.readyToApprove || 0} icon={<FileCheck className="h-6 w-6" />} variant="success" delay={100} />
        <StatCard title="معتمد اليوم" value={stats?.approvedToday || 0} icon={<CheckCircle className="h-6 w-6" />} variant="primary" delay={150} />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="إجمالي المستندات" value={stats?.totalDocuments || 0} icon={<FileText className="h-6 w-6" />} delay={200} />
        <StatCard title="بانتظار التوقيع" value={stats?.pendingSignatures || 0} icon={<PenTool className="h-6 w-6" />} delay={250} />
        <StatCard title="نسبة الإنجاز" value={`${completionRate}%`} icon={<TrendingUp className="h-6 w-6" />} delay={300} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">أحدث المستندات</h2>
            <Button variant="ghost" asChild>
              <Link to="/approvals/documents" className="flex items-center gap-1 text-primary">
                عرض الكل <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {recentDocuments.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recentDocuments.map((doc, index) => <DocumentCard key={doc.id} document={doc} delay={index * 60} />)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center">
              <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">لا توجد مستندات بعد.</p>
              <Button asChild className="mt-4"><Link to="/approvals/upload">رفع أول مستند</Link></Button>
            </div>
          )}
        </section>

        <RecentActivity logs={transformedLogs} />
      </div>
    </MainLayout>
  );
}
