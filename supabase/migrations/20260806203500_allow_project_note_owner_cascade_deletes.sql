-- Allow foreign-key cascade cleanup while keeping direct owner removal guarded.

create or replace function public.protect_project_note_owner_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
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

  -- Cascades from deleting a project or auth user must remain possible.
  if not exists (
    select 1 from public.projects project where project.id = old.project_id
  ) or not exists (
    select 1 from auth.users account where account.id = old.user_id
  ) then
    return old;
  end if;

  if old.role = 'owner' and not exists (
    select 1
    from public.project_note_members other_owner
    where other_owner.project_id = old.project_id
      and other_owner.user_id <> old.user_id
      and other_owner.role = 'owner'
  ) then
    raise exception 'Cannot remove the last project note owner';
  end if;

  return old;
end;
$$;

revoke all on function public.protect_project_note_owner_integrity()
from public, anon, authenticated;
