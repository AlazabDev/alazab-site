import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, Search, Shield, UserPlus, Users as UsersIcon } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useApprovalAccess, ApprovalRole, APPROVAL_ROLE_LABELS } from '@/hooks/useApprovalAccess';
import { useToast } from '@/hooks/use-toast';

interface Member {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: ApprovalRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FoundUser {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  membership: { role: ApprovalRole; active: boolean } | null;
}

const roleColors: Record<ApprovalRole, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  reviewer: 'bg-blue-100 text-blue-800',
  approver: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800',
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

export default function Users() {
  const { toast } = useToast();
  const { role: actorRole } = useApprovalAccess();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [findEmail, setFindEmail] = useState('');
  const [finding, setFinding] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [newRole, setNewRole] = useState<ApprovalRole>('reviewer');

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('approval-members', { body });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'تعذر تنفيذ العملية');
    return data;
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke({ action: 'list' });
      setMembers(data.members || []);
    } catch (error) {
      console.error('[approvals] members load failed', error);
      toast({
        title: 'تعذر تحميل الصلاحيات',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [invoke, toast]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      member.fullName.toLowerCase().includes(term) ||
      (member.email || '').toLowerCase().includes(term) ||
      APPROVAL_ROLE_LABELS[member.role].includes(search.trim()),
    );
  }, [members, search]);

  const findUser = async () => {
    const email = findEmail.trim().toLowerCase();
    if (!email) return;
    setFinding(true);
    setFoundUser(null);
    try {
      const data = await invoke({ action: 'find_user', email });
      setFoundUser(data.user as FoundUser);
      if (data.user.membership?.role) setNewRole(data.user.membership.role);
    } catch (error) {
      toast({
        title: 'لم يتم العثور على الحساب',
        description: error instanceof Error && error.message.includes('USER_NOT_FOUND')
          ? 'يجب أن يكون للمستخدم حساب موجود في منصة العزب أولًا.'
          : error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setFinding(false);
    }
  };

  const saveMembership = async (userId: string, role: ApprovalRole, active: boolean) => {
    setSavingId(userId);
    try {
      await invoke({ action: 'upsert', userId, role, active });
      await loadMembers();
      toast({ title: 'تم تحديث الصلاحيات' });
    } catch (error) {
      toast({
        title: 'تعذر تحديث الصلاحيات',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const addFoundUser = async () => {
    if (!foundUser) return;
    await saveMembership(foundUser.userId, newRole, true);
    setAddOpen(false);
    setFoundUser(null);
    setFindEmail('');
    setNewRole('reviewer');
  };

  const roleOptions = (Object.keys(APPROVAL_ROLE_LABELS) as ApprovalRole[])
    .filter((role) => actorRole === 'owner' || role !== 'owner');

  return (
    <MainLayout title="المستخدمون والصلاحيات" subtitle="إدارة الوصول إلى نظام مراجعة واعتماد المستندات">
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">إجمالي الأعضاء</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">النشطون</p><p className="text-2xl font-bold text-green-700">{members.filter((member) => member.active).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">المديرون</p><p className="text-2xl font-bold">{members.filter((member) => ['owner', 'admin'].includes(member.role)).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">المراجعون والمعتمدون</p><p className="text-2xl font-bold">{members.filter((member) => ['reviewer', 'approver'].includes(member.role)).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2"><UsersIcon className="h-5 w-5" />أعضاء نظام الاعتماد</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث..." className="pe-10 sm:w-64" />
            </div>

            <Dialog open={addOpen} onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) {
                setFoundUser(null);
                setFindEmail('');
              }
            }}>
              <DialogTrigger asChild>
                <Button><UserPlus className="me-2 h-4 w-4" />إضافة حساب موجود</Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة عضو لنظام الاعتماد</DialogTitle>
                  <DialogDescription>البحث يتم بين الحسابات الموجودة بالفعل في منصة العزب؛ هذه الشاشة لا تنشئ حسابات مصادقة جديدة.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-email">البريد الإلكتروني</Label>
                    <div className="flex gap-2">
                      <Input id="member-email" type="email" dir="ltr" value={findEmail} onChange={(event) => setFindEmail(event.target.value)} />
                      <Button variant="outline" onClick={() => void findUser()} disabled={finding || !findEmail.trim()}>
                        {finding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'بحث'}
                      </Button>
                    </div>
                  </div>

                  {foundUser ? (
                    <div className="rounded-xl border p-4">
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar>
                          {foundUser.avatarUrl ? <AvatarImage src={foundUser.avatarUrl} /> : null}
                          <AvatarFallback>{initials(foundUser.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{foundUser.fullName}</p>
                          <p className="text-sm text-muted-foreground" dir="ltr">{foundUser.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>دور نظام الاعتماد</Label>
                        <Select value={newRole} onValueChange={(value) => setNewRole(value as ApprovalRole)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => <SelectItem key={role} value={role}>{APPROVAL_ROLE_LABELS[role]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : null}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
                  <Button onClick={() => void addFoundUser()} disabled={!foundUser || savingId === foundUser?.userId}>
                    {savingId === foundUser?.userId ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                    حفظ الصلاحية
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
          ) : filtered.length ? (
            <div className="space-y-3">
              {filtered.map((member) => (
                <div key={member.userId} className="flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar>
                      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} /> : null}
                      <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{member.fullName}</p>
                      <p className="truncate text-sm text-muted-foreground" dir="ltr">{member.email || '-'}</p>
                    </div>
                  </div>

                  <Badge className={roleColors[member.role]}><Shield className="me-1 h-3 w-3" />{APPROVAL_ROLE_LABELS[member.role]}</Badge>

                  <div className="flex items-center gap-3">
                    <Select
                      value={member.role}
                      onValueChange={(value) => void saveMembership(member.userId, value as ApprovalRole, member.active)}
                      disabled={savingId === member.userId || (member.role === 'owner' && actorRole !== 'owner')}
                    >
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => <SelectItem key={role} value={role}>{APPROVAL_ROLE_LABELS[role]}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={member.active}
                        onCheckedChange={(active) => void saveMembership(member.userId, member.role, active)}
                        disabled={savingId === member.userId || (member.role === 'owner' && actorRole !== 'owner')}
                        aria-label="حالة العضوية"
                      />
                      <span className="text-sm">{member.active ? 'نشط' : 'معطل'}</span>
                    </div>

                    {savingId === member.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground"><Mail className="mx-auto mb-3 h-10 w-10" /><p>لا توجد نتائج.</p></div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
