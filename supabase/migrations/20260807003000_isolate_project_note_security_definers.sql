create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.can_access_project_notes(
  target_project_id uuid,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    auth.uid() is not null
    and public.project_note_role_rank(required_role) > 0
    and (
      public.is_admin()
      or exists (
        select 1
        from public.project_note_members member
        where member.project_id = target_project_id
          and member.user_id = auth.uid()
          and public.project_note_role_rank(member.role) >= public.project_note_role_rank(required_role)
      )
    )
$$;

create or replace function private.can_access_project_note_storage(
  object_name text,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select
    private.can_access_project_notes(
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

create or replace function private.project_notes_is_public(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select settings.is_public
    from public.project_note_settings settings
    where settings.project_id = target_project_id
  ), false)
$$;

create or replace function private.project_note_storage_is_public(object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    private.project_notes_is_public(public.project_notes_storage_project_id(object_name))
    and exists (
      select 1
      from public.project_notes note
      where note.project_id = public.project_notes_storage_project_id(object_name)
        and note.id = public.project_notes_storage_note_id(object_name)
    )
$$;

create or replace function private.project_note_current_role(target_project_id uuid)
returns text
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select case
    when auth.uid() is null then null
    when public.is_admin() then 'owner'
    else (
      select member.role
      from public.project_note_members member
      where member.project_id = target_project_id
        and member.user_id = auth.uid()
      limit 1
    )
  end
$$;

create or replace function private.get_project_note_members(target_project_id uuid)
returns table(
  user_id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
begin
  if not private.can_access_project_notes(target_project_id, 'viewer') then
    return;
  end if;

  return query
  select
    users.id,
    users.email::text,
    profiles.full_name,
    members.role,
    members.created_at
  from public.project_note_members members
  join auth.users users on users.id = members.user_id
  left join public.profiles profiles on profiles.id = members.user_id
  where members.project_id = target_project_id
  order by members.created_at;
end;
$$;

create or replace function private.add_project_note_member_by_email(
  target_project_id uuid,
  member_email text,
  member_role text default 'viewer'
)
returns table(user_id uuid, email text, full_name text, role text)
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  target_user_id uuid;
begin
  if not private.can_access_project_notes(target_project_id, 'owner') then
    raise exception 'Not authorized to manage project note members';
  end if;

  if member_role not in ('viewer', 'commenter', 'editor', 'owner') then
    raise exception 'Invalid project note role';
  end if;

  select users.id
  into target_user_id
  from auth.users users
  where lower(users.email) = lower(btrim(member_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No registered user found for this email';
  end if;

  insert into public.project_note_members(project_id, user_id, role, added_by)
  values (target_project_id, target_user_id, member_role, auth.uid())
  on conflict (project_id, user_id)
  do update set
    role = excluded.role,
    added_by = excluded.added_by,
    updated_at = now();

  return query
  select users.id, users.email::text, profiles.full_name, members.role
  from public.project_note_members members
  join auth.users users on users.id = members.user_id
  left join public.profiles profiles on profiles.id = members.user_id
  where members.project_id = target_project_id
    and members.user_id = target_user_id;
end;
$$;

revoke all on all functions in schema private from public;
grant execute on function private.project_notes_is_public(uuid) to anon, authenticated, service_role;
grant execute on function private.project_note_storage_is_public(text) to anon, authenticated, service_role;
grant execute on function private.can_access_project_notes(uuid, text) to authenticated, service_role;
grant execute on function private.can_access_project_note_storage(text, text) to authenticated, service_role;
grant execute on function private.project_note_current_role(uuid) to authenticated, service_role;
grant execute on function private.get_project_note_members(uuid) to authenticated, service_role;
grant execute on function private.add_project_note_member_by_email(uuid, text, text) to authenticated, service_role;

create or replace function public.can_access_project_notes(
  target_project_id uuid,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.can_access_project_notes(target_project_id, required_role)
$$;

create or replace function public.can_access_project_note_storage(
  object_name text,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.can_access_project_note_storage(object_name, required_role)
$$;

create or replace function public.project_notes_is_public(target_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.project_notes_is_public(target_project_id)
$$;

create or replace function public.project_note_storage_is_public(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.project_note_storage_is_public(object_name)
$$;

create or replace function public.project_note_current_role(target_project_id uuid)
returns text
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select private.project_note_current_role(target_project_id)
$$;

create or replace function public.get_project_note_members(target_project_id uuid)
returns table(
  user_id uuid,
  email text,
  full_name text,
  role text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.get_project_note_members(target_project_id)
$$;

create or replace function public.add_project_note_member_by_email(
  target_project_id uuid,
  member_email text,
  member_role text default 'viewer'
)
returns table(user_id uuid, email text, full_name text, role text)
language sql
volatile
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.add_project_note_member_by_email(
    target_project_id,
    member_email,
    member_role
  )
$$;

revoke all on function public.can_access_project_notes(uuid, text) from public;
revoke all on function public.can_access_project_note_storage(text, text) from public;
revoke all on function public.project_notes_is_public(uuid) from public;
revoke all on function public.project_note_storage_is_public(text) from public;
revoke all on function public.project_note_current_role(uuid) from public;
revoke all on function public.get_project_note_members(uuid) from public;
revoke all on function public.add_project_note_member_by_email(uuid, text, text) from public;

grant execute on function public.project_notes_is_public(uuid) to anon, authenticated, service_role;
grant execute on function public.project_note_storage_is_public(text) to anon, authenticated, service_role;
grant execute on function public.can_access_project_notes(uuid, text) to authenticated, service_role;
grant execute on function public.can_access_project_note_storage(text, text) to authenticated, service_role;
grant execute on function public.project_note_current_role(uuid) to authenticated, service_role;
grant execute on function public.get_project_note_members(uuid) to authenticated, service_role;
grant execute on function public.add_project_note_member_by_email(uuid, text, text) to authenticated, service_role;

drop policy if exists project_note_settings_deny_direct_access on public.project_note_settings;
create policy project_note_settings_deny_direct_access
on public.project_note_settings
for all
to anon, authenticated
using (false)
with check (false);
