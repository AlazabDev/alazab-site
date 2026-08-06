-- Project notes collaboration module
-- Safe to replay against the current production database after the live rollout.

create table if not exists public.project_note_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','commenter','editor','owner')),
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_note_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  description text,
  position integer not null default 0 check (position >= 0),
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, title),
  unique (project_id, id)
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  description text,
  status text not null default 'open' check (status in ('open','in_progress','blocked','done','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  position integer not null default 0 check (position >= 0),
  source_reference text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id),
  constraint project_notes_section_fk foreign key (project_id, section_id)
    references public.project_note_sections(project_id, id) on delete cascade,
  constraint project_notes_completion_check check (
    (status = 'done' and completed_at is not null) or status <> 'done'
  )
);

create table if not exists public.project_note_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  note_id uuid not null,
  parent_comment_id uuid references public.project_note_comments(id) on delete cascade,
  body text not null check (length(btrim(body)) > 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, id),
  constraint project_note_comments_note_fk foreign key (project_id, note_id)
    references public.project_notes(project_id, id) on delete cascade
);

create table if not exists public.project_note_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  note_id uuid not null,
  comment_id uuid references public.project_note_comments(id) on delete cascade,
  bucket_id text not null default 'project-notes' check (bucket_id = 'project-notes'),
  object_path text not null unique check (length(btrim(object_path)) > 0),
  file_name text not null check (length(btrim(file_name)) > 0),
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_note_attachments_note_fk foreign key (project_id, note_id)
    references public.project_notes(project_id, id) on delete cascade
);

create table if not exists public.project_note_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  note_id uuid references public.project_notes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb not null default '{}'::jsonb check (jsonb_typeof(changes) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists project_note_members_user_idx on public.project_note_members(user_id, project_id);
create index if not exists project_note_members_added_by_idx on public.project_note_members(added_by);
create index if not exists project_note_sections_project_idx on public.project_note_sections(project_id, position) where not is_archived;
create index if not exists project_note_sections_creator_idx on public.project_note_sections(created_by);
create index if not exists project_note_sections_updater_idx on public.project_note_sections(updated_by);
create index if not exists project_notes_project_status_idx on public.project_notes(project_id, status, priority);
create index if not exists project_notes_section_position_idx on public.project_notes(section_id, position);
create index if not exists project_notes_project_section_idx on public.project_notes(project_id, section_id);
create index if not exists project_notes_assigned_idx on public.project_notes(assigned_to, status) where assigned_to is not null;
create index if not exists project_notes_creator_idx on public.project_notes(created_by);
create index if not exists project_notes_updater_idx on public.project_notes(updated_by);
create index if not exists project_notes_completer_idx on public.project_notes(completed_by);
create index if not exists project_note_comments_note_idx on public.project_note_comments(note_id, created_at);
create index if not exists project_note_comments_project_note_idx on public.project_note_comments(project_id, note_id);
create index if not exists project_note_comments_parent_idx on public.project_note_comments(parent_comment_id);
create index if not exists project_note_comments_creator_idx on public.project_note_comments(created_by);
create index if not exists project_note_attachments_note_idx on public.project_note_attachments(note_id, created_at);
create index if not exists project_note_attachments_project_note_idx on public.project_note_attachments(project_id, note_id);
create index if not exists project_note_attachments_project_idx on public.project_note_attachments(project_id);
create index if not exists project_note_attachments_comment_idx on public.project_note_attachments(comment_id);
create index if not exists project_note_attachments_uploader_idx on public.project_note_attachments(uploaded_by);
create index if not exists project_note_activity_project_idx on public.project_note_activity(project_id, created_at desc);
create index if not exists project_note_activity_actor_idx on public.project_note_activity(actor_id);
create index if not exists project_note_activity_note_idx on public.project_note_activity(note_id);

create or replace function public.project_note_role_rank(role_name text)
returns integer
language sql
immutable
set search_path = public
as $$
  select case role_name
    when 'viewer' then 10
    when 'commenter' then 20
    when 'editor' then 30
    when 'owner' then 40
    else 0
  end
$$;

create or replace function public.can_access_project_notes(target_project_id uuid, required_role text default 'viewer')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1
      from public.project_note_members member
      where member.project_id = target_project_id
        and member.user_id = auth.uid()
        and public.project_note_role_rank(member.role) >= public.project_note_role_rank(required_role)
    )
$$;

create or replace function public.project_notes_storage_project_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  parsed_id uuid;
begin
  parsed_id := split_part(object_name, '/', 1)::uuid;
  return parsed_id;
exception when others then
  return null;
end;
$$;

create or replace function public.validate_project_note_comment_parent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_comment_id is not null and not exists (
    select 1
    from public.project_note_comments parent
    where parent.id = new.parent_comment_id
      and parent.project_id = new.project_id
      and parent.note_id = new.note_id
  ) then
    raise exception 'Parent comment must belong to the same project note';
  end if;
  return new;
end;
$$;

create or replace function public.validate_project_note_attachment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.comment_id is not null and not exists (
    select 1
    from public.project_note_comments comment_row
    where comment_row.id = new.comment_id
      and comment_row.project_id = new.project_id
      and comment_row.note_id = new.note_id
  ) then
    raise exception 'Attachment comment must belong to the same project note';
  end if;

  if public.project_notes_storage_project_id(new.object_path) is distinct from new.project_id then
    raise exception 'Attachment path must start with the project UUID';
  end if;
  return new;
end;
$$;

create or replace function public.log_project_note_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
  target_note_id uuid;
  activity_changes jsonb := '{}'::jsonb;
begin
  target_project_id := coalesce(new.project_id, old.project_id);
  target_note_id := coalesce(new.id, old.id);

  if tg_op = 'UPDATE' then
    activity_changes := jsonb_strip_nulls(jsonb_build_object(
      'status', case when old.status is distinct from new.status then jsonb_build_object('from', old.status, 'to', new.status) end,
      'priority', case when old.priority is distinct from new.priority then jsonb_build_object('from', old.priority, 'to', new.priority) end,
      'assigned_to', case when old.assigned_to is distinct from new.assigned_to then jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to) end,
      'title', case when old.title is distinct from new.title then jsonb_build_object('from', old.title, 'to', new.title) end
    ));
  end if;

  insert into public.project_note_activity(project_id, note_id, actor_id, action, entity_type, entity_id, changes)
  values (target_project_id, target_note_id, auth.uid(), lower(tg_op), 'note', target_note_id, activity_changes);
  return coalesce(new, old);
end;
$$;

create or replace function public.log_project_note_child_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_project_id uuid;
  row_note_id uuid;
  row_id uuid;
begin
  row_project_id := coalesce(new.project_id, old.project_id);
  row_note_id := coalesce(new.note_id, old.note_id);
  row_id := coalesce(new.id, old.id);

  insert into public.project_note_activity(project_id, note_id, actor_id, action, entity_type, entity_id, changes)
  values (row_project_id, row_note_id, auth.uid(), lower(tg_op), tg_argv[0], row_id, '{}'::jsonb);
  return coalesce(new, old);
end;
$$;

create or replace function public.add_project_note_member_by_email(
  target_project_id uuid,
  member_email text,
  member_role text default 'viewer'
)
returns table (user_id uuid, email text, full_name text, role text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not public.can_access_project_notes(target_project_id, 'owner') then
    raise exception 'Not authorized to manage project note members';
  end if;
  if member_role not in ('viewer','commenter','editor','owner') then
    raise exception 'Invalid project note role';
  end if;

  select users.id into target_user_id
  from auth.users users
  where lower(users.email) = lower(btrim(member_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No registered user found for this email';
  end if;

  insert into public.project_note_members(project_id, user_id, role, added_by)
  values (target_project_id, target_user_id, member_role, auth.uid())
  on conflict (project_id, user_id)
  do update set role = excluded.role, added_by = excluded.added_by, updated_at = now();

  return query
  select users.id, users.email::text, profiles.full_name, members.role
  from public.project_note_members members
  join auth.users users on users.id = members.user_id
  left join public.profiles profiles on profiles.id = members.user_id
  where members.project_id = target_project_id
    and members.user_id = target_user_id;
end;
$$;

create or replace function public.get_project_note_members(target_project_id uuid)
returns table (user_id uuid, email text, full_name text, role text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public, auth
as $$
begin
  if not public.can_access_project_notes(target_project_id, 'viewer') then
    raise exception 'Not authorized to view project note members';
  end if;

  return query
  select users.id, users.email::text, profiles.full_name, members.role, members.created_at
  from public.project_note_members members
  join auth.users users on users.id = members.user_id
  left join public.profiles profiles on profiles.id = members.user_id
  where members.project_id = target_project_id
  order by members.created_at;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-notes', 'project-notes', false, 52428800)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

alter table public.project_note_members enable row level security;
alter table public.project_note_sections enable row level security;
alter table public.project_notes enable row level security;
alter table public.project_note_comments enable row level security;
alter table public.project_note_attachments enable row level security;
alter table public.project_note_activity enable row level security;

drop trigger if exists project_note_members_updated_at on public.project_note_members;
create trigger project_note_members_updated_at before update on public.project_note_members
for each row execute function public.update_updated_at_column();
drop trigger if exists project_note_sections_updated_at on public.project_note_sections;
create trigger project_note_sections_updated_at before update on public.project_note_sections
for each row execute function public.update_updated_at_column();
drop trigger if exists project_notes_updated_at on public.project_notes;
create trigger project_notes_updated_at before update on public.project_notes
for each row execute function public.update_updated_at_column();
drop trigger if exists project_note_comments_updated_at on public.project_note_comments;
create trigger project_note_comments_updated_at before update on public.project_note_comments
for each row execute function public.update_updated_at_column();
drop trigger if exists project_note_comments_validate_parent on public.project_note_comments;
create trigger project_note_comments_validate_parent before insert or update on public.project_note_comments
for each row execute function public.validate_project_note_comment_parent();
drop trigger if exists project_note_attachments_validate on public.project_note_attachments;
create trigger project_note_attachments_validate before insert or update on public.project_note_attachments
for each row execute function public.validate_project_note_attachment();
drop trigger if exists project_notes_activity on public.project_notes;
create trigger project_notes_activity after insert or update or delete on public.project_notes
for each row execute function public.log_project_note_activity();
drop trigger if exists project_note_comments_activity on public.project_note_comments;
create trigger project_note_comments_activity after insert or delete on public.project_note_comments
for each row execute function public.log_project_note_child_activity('comment');
drop trigger if exists project_note_attachments_activity on public.project_note_attachments;
create trigger project_note_attachments_activity after insert or delete on public.project_note_attachments
for each row execute function public.log_project_note_child_activity('attachment');

drop policy if exists project_note_members_select on public.project_note_members;
create policy project_note_members_select on public.project_note_members for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));
drop policy if exists project_note_members_insert on public.project_note_members;
create policy project_note_members_insert on public.project_note_members for insert to authenticated
with check (public.can_access_project_notes(project_id, 'owner'));
drop policy if exists project_note_members_update on public.project_note_members;
create policy project_note_members_update on public.project_note_members for update to authenticated
using (public.can_access_project_notes(project_id, 'owner'))
with check (public.can_access_project_notes(project_id, 'owner'));
drop policy if exists project_note_members_delete on public.project_note_members;
create policy project_note_members_delete on public.project_note_members for delete to authenticated
using (public.can_access_project_notes(project_id, 'owner'));

drop policy if exists project_note_sections_select on public.project_note_sections;
create policy project_note_sections_select on public.project_note_sections for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));
drop policy if exists project_note_sections_insert on public.project_note_sections;
create policy project_note_sections_insert on public.project_note_sections for insert to authenticated
with check (public.can_access_project_notes(project_id, 'editor') and (created_by is null or created_by = (select auth.uid())));
drop policy if exists project_note_sections_update on public.project_note_sections;
create policy project_note_sections_update on public.project_note_sections for update to authenticated
using (public.can_access_project_notes(project_id, 'editor'))
with check (public.can_access_project_notes(project_id, 'editor'));
drop policy if exists project_note_sections_delete on public.project_note_sections;
create policy project_note_sections_delete on public.project_note_sections for delete to authenticated
using (public.can_access_project_notes(project_id, 'editor'));

drop policy if exists project_notes_select on public.project_notes;
create policy project_notes_select on public.project_notes for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));
drop policy if exists project_notes_insert on public.project_notes;
create policy project_notes_insert on public.project_notes for insert to authenticated
with check (public.can_access_project_notes(project_id, 'editor') and (created_by is null or created_by = (select auth.uid())));
drop policy if exists project_notes_update on public.project_notes;
create policy project_notes_update on public.project_notes for update to authenticated
using (public.can_access_project_notes(project_id, 'editor'))
with check (public.can_access_project_notes(project_id, 'editor'));
drop policy if exists project_notes_delete on public.project_notes;
create policy project_notes_delete on public.project_notes for delete to authenticated
using (public.can_access_project_notes(project_id, 'editor'));

drop policy if exists project_note_comments_select on public.project_note_comments;
create policy project_note_comments_select on public.project_note_comments for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));
drop policy if exists project_note_comments_insert on public.project_note_comments;
create policy project_note_comments_insert on public.project_note_comments for insert to authenticated
with check (public.can_access_project_notes(project_id, 'commenter') and created_by = (select auth.uid()));
drop policy if exists project_note_comments_update on public.project_note_comments;
create policy project_note_comments_update on public.project_note_comments for update to authenticated
using (created_by = (select auth.uid()) or public.can_access_project_notes(project_id, 'editor'))
with check (created_by = (select auth.uid()) or public.can_access_project_notes(project_id, 'editor'));
drop policy if exists project_note_comments_delete on public.project_note_comments;
create policy project_note_comments_delete on public.project_note_comments for delete to authenticated
using (created_by = (select auth.uid()) or public.can_access_project_notes(project_id, 'editor'));

drop policy if exists project_note_attachments_select on public.project_note_attachments;
create policy project_note_attachments_select on public.project_note_attachments for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));
drop policy if exists project_note_attachments_insert on public.project_note_attachments;
create policy project_note_attachments_insert on public.project_note_attachments for insert to authenticated
with check (public.can_access_project_notes(project_id, 'commenter') and uploaded_by = (select auth.uid()));
drop policy if exists project_note_attachments_delete on public.project_note_attachments;
create policy project_note_attachments_delete on public.project_note_attachments for delete to authenticated
using (uploaded_by = (select auth.uid()) or public.can_access_project_notes(project_id, 'editor'));

drop policy if exists project_note_activity_select on public.project_note_activity;
create policy project_note_activity_select on public.project_note_activity for select to authenticated
using (public.can_access_project_notes(project_id, 'viewer'));

drop policy if exists project_notes_storage_select on storage.objects;
create policy project_notes_storage_select on storage.objects for select to authenticated
using (bucket_id = 'project-notes' and public.can_access_project_notes(public.project_notes_storage_project_id(name), 'viewer'));
drop policy if exists project_notes_storage_insert on storage.objects;
create policy project_notes_storage_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'project-notes'
  and owner_id = (select auth.uid())::text
  and public.can_access_project_notes(public.project_notes_storage_project_id(name), 'commenter')
);
drop policy if exists project_notes_storage_update on storage.objects;
create policy project_notes_storage_update on storage.objects for update to authenticated
using (
  bucket_id = 'project-notes'
  and (owner_id = (select auth.uid())::text or public.can_access_project_notes(public.project_notes_storage_project_id(name), 'editor'))
)
with check (
  bucket_id = 'project-notes'
  and public.can_access_project_notes(public.project_notes_storage_project_id(name), 'commenter')
);
drop policy if exists project_notes_storage_delete on storage.objects;
create policy project_notes_storage_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'project-notes'
  and (owner_id = (select auth.uid())::text or public.can_access_project_notes(public.project_notes_storage_project_id(name), 'editor'))
);

grant select, insert, update, delete on public.project_note_members to authenticated;
grant select, insert, update, delete on public.project_note_sections to authenticated;
grant select, insert, update, delete on public.project_notes to authenticated;
grant select, insert, update, delete on public.project_note_comments to authenticated;
grant select, insert, delete on public.project_note_attachments to authenticated;
grant select on public.project_note_activity to authenticated;

revoke all on function public.add_project_note_member_by_email(uuid, text, text) from public, anon;
revoke all on function public.get_project_note_members(uuid) from public, anon;
revoke all on function public.can_access_project_notes(uuid, text) from public, anon;
revoke all on function public.log_project_note_activity() from public, anon, authenticated;
revoke all on function public.log_project_note_child_activity() from public, anon, authenticated;
revoke all on function public.validate_project_note_comment_parent() from public, anon, authenticated;
revoke all on function public.validate_project_note_attachment() from public, anon, authenticated;
revoke all on function public.project_notes_storage_project_id(text) from public, anon;
revoke all on function public.project_note_role_rank(text) from public, anon;

grant execute on function public.add_project_note_member_by_email(uuid, text, text) to authenticated;
grant execute on function public.get_project_note_members(uuid) to authenticated;
grant execute on function public.can_access_project_notes(uuid, text) to authenticated;
grant execute on function public.project_notes_storage_project_id(text) to authenticated;
grant execute on function public.project_note_role_rank(text) to authenticated;
