create table if not exists public.project_note_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.project_note_settings enable row level security;

insert into public.project_note_settings(project_id, is_public)
select id, true
from public.projects
where slug = 'arabesque'
on conflict (project_id)
do update set is_public = excluded.is_public, updated_at = now();

create or replace function public.project_notes_is_public(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select settings.is_public
    from public.project_note_settings settings
    where settings.project_id = target_project_id
  ), false)
$$;

create or replace function public.project_note_storage_is_public(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.project_notes_is_public(public.project_notes_storage_project_id(object_name))
    and exists (
      select 1
      from public.project_notes note
      where note.project_id = public.project_notes_storage_project_id(object_name)
        and note.id = public.project_notes_storage_note_id(object_name)
    )
$$;

revoke all on function public.project_notes_is_public(uuid) from public;
revoke all on function public.project_note_storage_is_public(text) from public;
grant execute on function public.project_notes_is_public(uuid) to anon, authenticated, service_role;
grant execute on function public.project_note_storage_is_public(text) to anon, authenticated, service_role;

revoke all on public.project_note_settings from anon, authenticated;

revoke all on public.project_note_sections from anon;
revoke all on public.project_notes from anon;
revoke all on public.project_note_comments from anon;
revoke all on public.project_note_attachments from anon;
grant select on public.project_note_sections to anon;
grant select on public.project_notes to anon;
grant select on public.project_note_comments to anon;
grant select on public.project_note_attachments to anon;

drop policy if exists project_note_sections_public_select on public.project_note_sections;
create policy project_note_sections_public_select
on public.project_note_sections
for select
to anon, authenticated
using (public.project_notes_is_public(project_id));

drop policy if exists project_notes_public_select on public.project_notes;
create policy project_notes_public_select
on public.project_notes
for select
to anon, authenticated
using (public.project_notes_is_public(project_id));

drop policy if exists project_note_comments_public_select on public.project_note_comments;
create policy project_note_comments_public_select
on public.project_note_comments
for select
to anon, authenticated
using (public.project_notes_is_public(project_id));

drop policy if exists project_note_attachments_public_select on public.project_note_attachments;
create policy project_note_attachments_public_select
on public.project_note_attachments
for select
to anon, authenticated
using (public.project_notes_is_public(project_id));

drop policy if exists project_notes_storage_public_select on storage.objects;
create policy project_notes_storage_public_select
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'project-notes'
  and public.project_note_storage_is_public(name)
);
