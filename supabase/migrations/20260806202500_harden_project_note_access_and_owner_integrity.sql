-- Harden project-note access checks and preserve at least one owner per project.

create or replace function public.can_access_project_notes(
  target_project_id uuid,
  required_role text default 'viewer'
)
returns boolean
language sql
stable
security definer
set search_path = public
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

create or replace function public.project_note_current_role(target_project_id uuid)
returns text
language sql
stable
security definer
set search_path = public
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

create or replace function public.protect_project_note_owner_integrity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if new.project_id is distinct from old.project_id
       or new.user_id is distinct from old.user_id then
      raise exception 'Project note membership identity cannot be changed';
    end if;

    if old.role = 'owner' and new.role <> 'owner' then
      if not exists (
        select 1
        from public.project_note_members other_owner
        where other_owner.project_id = old.project_id
          and other_owner.user_id <> old.user_id
          and other_owner.role = 'owner'
      ) then
        raise exception 'Cannot demote the last project note owner';
      end if;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' and old.role = 'owner' then
    if not exists (
      select 1
      from public.project_note_members other_owner
      where other_owner.project_id = old.project_id
        and other_owner.user_id <> old.user_id
        and other_owner.role = 'owner'
    ) then
      raise exception 'Cannot remove the last project note owner';
    end if;
  end if;

  return old;
end;
$$;

drop trigger if exists project_note_members_owner_integrity on public.project_note_members;
create trigger project_note_members_owner_integrity
before update or delete on public.project_note_members
for each row execute function public.protect_project_note_owner_integrity();

revoke all on function public.can_access_project_notes(uuid, text) from public, anon;
revoke all on function public.project_note_current_role(uuid) from public, anon;
revoke all on function public.protect_project_note_owner_integrity() from public, anon, authenticated;

grant execute on function public.can_access_project_notes(uuid, text) to authenticated, service_role;
grant execute on function public.project_note_current_role(uuid) to authenticated, service_role;
