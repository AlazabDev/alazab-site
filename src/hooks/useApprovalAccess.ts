import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ApprovalRole = 'owner' | 'admin' | 'reviewer' | 'approver' | 'viewer';

interface ApprovalMembership {
  user_id: string;
  role: ApprovalRole;
  active: boolean;
}

export const APPROVAL_ROLE_LABELS: Record<ApprovalRole, string> = {
  owner: 'مالك نظام الاعتماد',
  admin: 'مدير نظام الاعتماد',
  reviewer: 'مراجع',
  approver: 'معتمد',
  viewer: 'مشاهد',
};

export function useApprovalAccess() {
  const { user, loading: authLoading } = useAuth();
  const [membership, setMembership] = useState<ApprovalMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setMembership(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('approval_memberships')
      .select('user_id, role, active')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[approvals] membership lookup failed', error);
      setMembership(null);
    } else {
      setMembership(data as ApprovalMembership | null);
    }
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const active = membership?.active === true;
  const role = active ? membership.role : null;
  const canReview = active && !!role && ['owner', 'admin', 'reviewer', 'approver'].includes(role);
  const canApprove = active && !!role && ['owner', 'admin', 'approver'].includes(role);
  const canManage = active && !!role && ['owner', 'admin'].includes(role);

  return useMemo(() => ({
    membership,
    role,
    active,
    canReview,
    canApprove,
    canManage,
    loading: authLoading || loading,
    refresh,
  }), [membership, role, active, canReview, canApprove, canManage, authLoading, loading, refresh]);
}
