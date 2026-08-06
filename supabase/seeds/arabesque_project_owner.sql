-- Bootstrap the current operational admin as owner of Arabesque notes.
-- Resolves users by email; no environment-specific UUID is stored in source control.

insert into public.project_note_members(project_id, user_id, role, added_by)
select project.id, account.id, 'owner', account.id
from public.projects project
join auth.users account on lower(account.email) = lower('admin@alazab.com')
where project.slug = 'arabesque'
on conflict (project_id, user_id)
do update set
  role = 'owner',
  updated_at = now();
