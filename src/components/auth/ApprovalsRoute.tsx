import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { ApprovalRole, useApprovalAccess } from '@/hooks/useApprovalAccess';

interface ApprovalsRouteProps {
  children: React.ReactNode;
  allowedRoles?: ApprovalRole[];
}

const ApprovalsRoute: React.FC<ApprovalsRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading: authLoading } = useAuth();
  const { active, role, loading } = useApprovalAccess();
  const location = useLocation();

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-construction-primary" />
      </div>
    );
  }

  if (!user) {
    const destination = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?returnTo=${encodeURIComponent(destination)}`} replace />;
  }

  const roleAllowed = !allowedRoles?.length || (!!role && allowedRoles.includes(role));
  if (!active || !roleAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldX className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-xl font-bold">غير مصرح بالدخول</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            حسابك لا يملك الصلاحية المطلوبة للدخول إلى نظام مراجعة واعتماد المستندات.
          </p>
          <Button asChild><Link to="/dashboard">العودة إلى لوحة التحكم</Link></Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApprovalsRoute;
