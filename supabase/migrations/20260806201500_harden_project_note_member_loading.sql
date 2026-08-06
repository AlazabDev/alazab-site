-- Keep project-note member lookup supplemental to the board load.
-- Unauthorized callers receive an empty set instead of an exception that can
-- make the React module repeatedly enter and leave its loading state.

create or replace function public.get_project_note_members(target_project_id uuid)
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
set search_path = public, auth
as $$
begin
  if not public.can_access_project_notes(target_project_id, 'viewer') then
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

revoke all on function public.get_project_note_members(uuid) from public, anon;
grant execute on function public.get_project_note_members(uuid) to authenticated, service_role;
