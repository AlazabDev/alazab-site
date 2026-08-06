-- Require every Storage object path to match an existing project/note pair:
-- project_id/note_id/random-file-name.ext

create or replace function public.project_notes_storage_note_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  parsed_id uuid;
begin
  parsed_id := split_part(object_name, '/', 2)::uuid;
  return parsed_id;
exception when others then
  return null;
end;
$$;

create or replace function public.can_access_project_note_storage(
  object_name text,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_access_project_notes(
      public.project_notes_storage_project_id(object_name),
      required_role
    )
    and exists (
      select 1
      from public.project_notes note
      where note.project_id = public.project_notes_storage_project_id(object_name)
        and note.id = public.project_notes_storage_note_id(object_name)
    )
$$;

revoke all on function public.project_notes_storage_note_id(text) from public, anon;
revoke all on function public.can_access_project_note_storage(text, text) from public, anon;
grant execute on function public.project_notes_storage_note_id(text) to authenticated;
grant execute on function public.can_access_project_note_storage(text, text) to authenticated;

drop policy if exists project_notes_storage_select on storage.objects;
create policy project_notes_storage_select on storage.objects
for select to authenticated
using (
  bucket_id = 'project-notes'
  and public.can_access_project_note_storage(name, 'viewer')
);

drop policy if exists project_notes_storage_insert on storage.objects;
create policy project_notes_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-notes'
  and owner_id = (select auth.uid())::text
  and public.can_access_project_note_storage(name, 'commenter')
);

drop policy if exists project_notes_storage_update on storage.objects;
create policy project_notes_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'project-notes'
  and public.can_access_project_note_storage(name, 'viewer')
  and (
    owner_id = (select auth.uid())::text
    or public.can_access_project_note_storage(name, 'editor')
  )
)
with check (
  bucket_id = 'project-notes'
  and public.can_access_project_note_storage(name, 'commenter')
);

drop policy if exists project_notes_storage_delete on storage.objects;
create policy project_notes_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'project-notes'
  and public.can_access_project_note_storage(name, 'viewer')
  and (
    owner_id = (select auth.uid())::text
    or public.can_access_project_note_storage(name, 'editor')
  )
);
