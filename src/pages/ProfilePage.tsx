import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUserProfile } from '@/contexts/UserProfileContext';
import UserAvatar from '@/components/shared/UserAvatar';

const ProfilePage: React.FC = () => {
  const { profile, loading: profileLoading, roleLabel, updateProfile, uploadAvatar } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
    });
  }, [profile]);

  const handleSave = async (): Promise<void> => {
    if (!formData.fullName.trim()) {
      toast({ title: 'الاسم مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      });
      toast({ title: 'تم الحفظ', description: 'تم تحديث بيانات الملف الشخصي فعليًا.' });
    } catch (error) {
      toast({
        title: 'تعذر الحفظ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast({ title: 'تم تحديث الصورة الشخصية' });
    } catch (error) {
      toast({
        title: 'تعذر رفع الصورة',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء رفع الصورة',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الملف الشخصي</h2>
          <p className="text-muted-foreground">البيانات الموحدة التي تظهر في جميع أجزاء النظام.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>الصورة الشخصية</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <UserAvatar className="h-28 w-28 border-2 border-construction-primary" fallbackClassName="text-2xl" />
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute bottom-0 end-0 h-9 w-9 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="تغيير الصورة الشخصية"
                  >
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{profile?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{roleLabel}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>المعلومات الشخصية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={profile?.email || ''} disabled className="bg-muted" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input id="address" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} />
              </div>
              <Button onClick={() => void handleSave()} disabled={saving || !profile} className="w-full">
                {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
                {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
