-- Consolidate authenticated user profiles and persist project files.
alter table public.adp_profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists avatar_url text,
  add column if not exists preferences jsonb not null default '{}'::jsonb;

alter table public.adp_profiles enable row level security;

drop policy if exists adp_profiles_select_own on public.adp_profiles;
create policy adp_profiles_select_own on public.adp_profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_admin());

drop policy if exists adp_profiles_insert_own on public.adp_profiles;
create policy adp_profiles_insert_own on public.adp_profiles
for insert to authenticated
with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists adp_profiles_update_own on public.adp_profiles;
create policy adp_profiles_update_own on public.adp_profiles
for update to authenticated
using (id = (select auth.uid()) or public.is_admin())
with check (id = (select auth.uid()) or public.is_admin());

create or replace function public.sync_adp_profile_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.adp_profiles (id, email, full_name, phone, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, new.phone, 'user'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'phone', new.phone),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.adp_profiles.full_name, excluded.full_name),
      phone = coalesce(public.adp_profiles.phone, excluded.phone),
      avatar_url = coalesce(public.adp_profiles.avatar_url, excluded.avatar_url),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists sync_adp_profile_after_auth_user_change on auth.users;
create trigger sync_adp_profile_after_auth_user_change
after insert or update of email, phone, raw_user_meta_data on auth.users
for each row execute function public.sync_adp_profile_from_auth();

insert into public.adp_profiles (id, email, full_name, phone, avatar_url)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(coalesce(u.email, u.phone, 'user'), '@', 1)),
  coalesce(u.raw_user_meta_data ->> 'phone', u.phone),
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
from auth.users u
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-avatars', 'profile-avatars', true, 5242880)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists profile_avatars_public_read on storage.objects;
create policy profile_avatars_public_read on storage.objects
for select to public using (bucket_id = 'profile-avatars');

drop policy if exists profile_avatars_user_insert on storage.objects;
create policy profile_avatars_user_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists profile_avatars_user_update on storage.objects;
create policy profile_avatars_user_update on storage.objects
for update to authenticated
using (bucket_id = 'profile-avatars' and split_part(name, '/', 1) = (select auth.uid())::text)
with check (bucket_id = 'profile-avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

drop policy if exists profile_avatars_user_delete on storage.objects;
create policy profile_avatars_user_delete on storage.objects
for delete to authenticated
using (bucket_id = 'profile-avatars' and split_part(name, '/', 1) = (select auth.uid())::text);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  file_size bigint,
  mime_type text,
  bucket_id text not null default 'project-files',
  object_path text not null unique,
  uploaded_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists project_files_project_id_idx on public.project_files(project_id, created_at desc);
alter table public.project_files enable row level security;

drop policy if exists project_files_authenticated_read on public.project_files;
create policy project_files_authenticated_read on public.project_files
for select to authenticated using (true);

drop policy if exists project_files_authenticated_insert on public.project_files;
create policy project_files_authenticated_insert on public.project_files
for insert to authenticated
with check (uploaded_by = (select auth.uid()));

drop policy if exists project_files_owner_delete on public.project_files;
create policy project_files_owner_delete on public.project_files
for delete to authenticated
using (uploaded_by = (select auth.uid()) or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists project_files_storage_read on storage.objects;
create policy project_files_storage_read on storage.objects
for select to authenticated using (bucket_id = 'project-files');

drop policy if exists project_files_storage_insert on storage.objects;
create policy project_files_storage_insert on storage.objects
for insert to authenticated with check (bucket_id = 'project-files');

drop policy if exists project_files_storage_delete on storage.objects;
create policy project_files_storage_delete on storage.objects
for delete to authenticated using (bucket_id = 'project-files');
