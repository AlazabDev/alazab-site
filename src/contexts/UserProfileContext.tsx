import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  projectUpdates: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  avatarUrl: string;
  role: string | null;
  preferences: UserPreferences;
}

interface ProfileUpdate {
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  initials: string;
  roleLabel: string;
  refreshProfile: () => Promise<void>;
  updateProfile: (changes: ProfileUpdate) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  projectUpdates: true,
};

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

const asPreferences = (value: unknown): UserPreferences => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PREFERENCES;
  const source = value as Record<string, unknown>;
  return {
    emailNotifications: typeof source.emailNotifications === 'boolean' ? source.emailNotifications : true,
    pushNotifications: typeof source.pushNotifications === 'boolean' ? source.pushNotifications : true,
    projectUpdates: typeof source.projectUpdates === 'boolean' ? source.projectUpdates : true,
  };
};

const initialsFromName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

const roleLabels: Record<string, string> = {
  platform_owner: 'مالك المنصة',
  platform_admin: 'مدير المنصة',
  database_administrator: 'مدير قاعدة البيانات',
  data_engineer: 'مهندس بيانات',
  data_analyst: 'محلل بيانات',
  read_only: 'قراءة فقط',
};

export const UserProfileProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const buildFallback = useCallback((): UserProfile | null => {
    if (!user) return null;
    const metadata = user.user_metadata ?? {};
    const fullName =
      [metadata.full_name, metadata.name, metadata.display_name]
        .find((value) => typeof value === 'string' && value.trim())?.trim() ||
      user.email?.split('@')[0] ||
      user.phone ||
      'المستخدم';
    const avatarUrl =
      [metadata.avatar_url, metadata.picture, metadata.photo_url, metadata.image]
        .find((value) => typeof value === 'string' && value.trim())?.trim() || '';

    return {
      id: user.id,
      email: user.email || '',
      fullName,
      phone: typeof metadata.phone === 'string' ? metadata.phone : (user.phone || ''),
      address: typeof metadata.address === 'string' ? metadata.address : '',
      avatarUrl,
      role: null,
      preferences: DEFAULT_PREFERENCES,
    };
  }, [user]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fallback = buildFallback();
    try {
      const [{ data: profileRow, error: profileError }, { data: roleRows, error: roleError }] = await Promise.all([
        supabase
          .from('adp_profiles')
          .select('id, email, full_name, phone, address, avatar_url, preferences')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('adp_user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1),
      ]);

      if (profileError) console.warn('[profile] falling back to auth metadata:', profileError.message);
      if (roleError) console.warn('[profile] role lookup failed:', roleError.message);

      const role = roleRows?.[0]?.role ?? null;
      setProfile({
        id: user.id,
        email: profileRow?.email || fallback?.email || '',
        fullName: profileRow?.full_name || fallback?.fullName || 'المستخدم',
        phone: profileRow?.phone || fallback?.phone || '',
        address: profileRow?.address || fallback?.address || '',
        avatarUrl: profileRow?.avatar_url || fallback?.avatarUrl || '',
        role,
        preferences: asPreferences(profileRow?.preferences),
      });
    } catch (error) {
      console.error('[profile] failed to load profile', error);
      setProfile(fallback);
    } finally {
      setLoading(false);
    }
  }, [buildFallback, user]);

  useEffect(() => {
    if (authLoading) return;
    void refreshProfile();
  }, [authLoading, refreshProfile]);

  const updateProfile = useCallback(async (changes: ProfileUpdate): Promise<void> => {
    if (!user) throw new Error('AUTH_REQUIRED');

    const current = profile ?? buildFallback();
    if (!current) throw new Error('PROFILE_UNAVAILABLE');

    const nextPreferences = { ...current.preferences, ...(changes.preferences || {}) };
    const next = {
      ...current,
      fullName: changes.fullName ?? current.fullName,
      phone: changes.phone ?? current.phone,
      address: changes.address ?? current.address,
      avatarUrl: changes.avatarUrl ?? current.avatarUrl,
      preferences: nextPreferences,
    };

    const { error } = await supabase.from('adp_profiles').upsert({
      id: user.id,
      email: user.email || null,
      full_name: next.fullName || null,
      phone: next.phone || null,
      address: next.address || null,
      avatar_url: next.avatarUrl || null,
      preferences: next.preferences,
    }, { onConflict: 'id' });

    if (error) throw error;

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: next.fullName,
        phone: next.phone,
        address: next.address,
        avatar_url: next.avatarUrl,
      },
    });
    if (authError) throw authError;

    setProfile(next);
  }, [buildFallback, profile, user]);

  const uploadAvatar = useCallback(async (file: File): Promise<string> => {
    if (!user) throw new Error('AUTH_REQUIRED');
    if (!file.type.startsWith('image/')) throw new Error('الملف المختار يجب أن يكون صورة');
    if (file.size > 5 * 1024 * 1024) throw new Error('الحد الأقصى لحجم الصورة 5 ميجابايت');

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path);
    await updateProfile({ avatarUrl: data.publicUrl });
    return data.publicUrl;
  }, [updateProfile, user]);

  const initials = useMemo(() => initialsFromName(profile?.fullName || 'U'), [profile?.fullName]);
  const roleLabel = profile?.role ? (roleLabels[profile.role] || profile.role) : 'مستخدم';

  const value = useMemo<UserProfileContextValue>(() => ({
    profile,
    loading,
    initials,
    roleLabel,
    refreshProfile,
    updateProfile,
    uploadAvatar,
  }), [initials, loading, profile, refreshProfile, roleLabel, updateProfile, uploadAvatar]);

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
};

export const useUserProfile = (): UserProfileContextValue => {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error('useUserProfile must be used within UserProfileProvider');
  return context;
};
