-- Independent PN (Project Notes) module.
-- Public operations: read, comment, upload metadata, and change note status.
-- WhatsApp-authenticated operations: create/delete projects, sections, and notes.

create table if not exists public.pn_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pn_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pn_projects(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  position integer not null default 0 check (position >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, title),
  unique (project_id, id)
);

create table if not exists public.pn_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pn_projects(id) on delete cascade,
  section_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  description text,
  status text not null default 'open' check (status in ('open','in_progress','blocked','done')),
  position integer not null default 0 check (position >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (project_id, id),
  constraint pn_notes_section_fk
    foreign key (project_id, section_id)
    references public.pn_sections(project_id, id)
    on delete set null,
  constraint pn_notes_completion_check check (
    (status = 'done' and completed_at is not null)
    or (status <> 'done' and completed_at is null)
  )
);

create table if not exists public.pn_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  note_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  created_at timestamptz not null default now(),
  constraint pn_comments_note_fk
    foreign key (project_id, note_id)
    references public.pn_notes(project_id, id)
    on delete cascade
);

create table if not exists public.pn_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  note_id uuid not null,
  bucket_id text not null default 'pn-files' check (bucket_id in ('pn-files','project-notes')),
  object_path text not null unique check (char_length(object_path) between 5 and 1024),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text,
  file_size bigint check (file_size is null or (file_size > 0 and file_size <= 52428800)),
  created_at timestamptz not null default now(),
  constraint pn_attachments_note_fk
    foreign key (project_id, note_id)
    references public.pn_notes(project_id, id)
    on delete cascade
);

create table if not exists public.pn_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pn_projects(id) on delete cascade,
  note_id uuid references public.pn_notes(id) on delete cascade,
  action text not null,
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pn_sections_project_position_idx on public.pn_sections(project_id, position);
create index if not exists pn_notes_project_status_idx on public.pn_notes(project_id, status);
create index if not exists pn_notes_project_section_position_idx on public.pn_notes(project_id, section_id, position);
create index if not exists pn_comments_note_created_idx on public.pn_comments(note_id, created_at);
create index if not exists pn_attachments_note_created_idx on public.pn_attachments(note_id, created_at);
create index if not exists pn_activity_project_created_idx on public.pn_activity(project_id, created_at desc);

alter table public.pn_projects enable row level security;
alter table public.pn_sections enable row level security;
alter table public.pn_notes enable row level security;
alter table public.pn_comments enable row level security;
alter table public.pn_attachments enable row level security;
alter table public.pn_activity enable row level security;

-- Public reading.
drop policy if exists pn_projects_public_select on public.pn_projects;
create policy pn_projects_public_select on public.pn_projects for select to anon, authenticated using (true);

drop policy if exists pn_sections_public_select on public.pn_sections;
create policy pn_sections_public_select on public.pn_sections for select to anon, authenticated using (true);

drop policy if exists pn_notes_public_select on public.pn_notes;
create policy pn_notes_public_select on public.pn_notes for select to anon, authenticated using (true);

drop policy if exists pn_comments_public_select on public.pn_comments;
create policy pn_comments_public_select on public.pn_comments for select to anon, authenticated using (true);

drop policy if exists pn_attachments_public_select on public.pn_attachments;
create policy pn_attachments_public_select on public.pn_attachments for select to anon, authenticated using (true);

-- WhatsApp-authenticated create/delete. Authentication is used for attribution.
drop policy if exists pn_projects_authenticated_insert on public.pn_projects;
create policy pn_projects_authenticated_insert on public.pn_projects for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists pn_projects_authenticated_delete on public.pn_projects;
create policy pn_projects_authenticated_delete on public.pn_projects for delete to authenticated using (true);

drop policy if exists pn_sections_authenticated_insert on public.pn_sections;
create policy pn_sections_authenticated_insert on public.pn_sections for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists pn_sections_authenticated_delete on public.pn_sections;
create policy pn_sections_authenticated_delete on public.pn_sections for delete to authenticated using (true);

drop policy if exists pn_notes_authenticated_insert on public.pn_notes;
create policy pn_notes_authenticated_insert on public.pn_notes for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists pn_notes_authenticated_delete on public.pn_notes;
create policy pn_notes_authenticated_delete on public.pn_notes for delete to authenticated using (true);

-- Public comments and attachment metadata.
drop policy if exists pn_comments_public_insert on public.pn_comments;
create policy pn_comments_public_insert on public.pn_comments for insert to anon, authenticated
with check (exists (
  select 1 from public.pn_notes n
  where n.id = note_id and n.project_id = project_id
));

drop policy if exists pn_attachments_public_insert on public.pn_attachments;
create policy pn_attachments_public_insert on public.pn_attachments for insert to anon, authenticated
with check (
  object_path like project_id::text || '/' || note_id::text || '/%'
  and exists (
    select 1 from public.pn_notes n
    where n.id = note_id and n.project_id = project_id
  )
);

-- Activity is intentionally not public.
drop policy if exists pn_activity_authenticated_select on public.pn_activity;
create policy pn_activity_authenticated_select on public.pn_activity for select to authenticated using (true);

create or replace function public.pn_set_note_status(
  target_note_id uuid,
  next_status text,
  status_comment text default null
)
returns public.pn_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_note public.pn_notes;
begin
  if next_status not in ('open','in_progress','blocked','done') then
    raise exception 'Invalid PN note status';
  end if;

  update public.pn_notes
  set status = next_status,
      completed_at = case when next_status = 'done' then now() else null end,
      updated_at = now()
  where id = target_note_id
  returning * into updated_note;

  if updated_note.id is null then
    raise exception 'PN note not found';
  end if;

  if status_comment is not null and char_length(btrim(status_comment)) > 0 then
    insert into public.pn_comments(project_id, note_id, body)
    values (updated_note.project_id, updated_note.id, left(btrim(status_comment), 5000));
  end if;

  insert into public.pn_activity(project_id, note_id, action, actor_id, details)
  values (
    updated_note.project_id,
    updated_note.id,
    'status_changed',
    auth.uid(),
    jsonb_build_object('status', next_status)
  );

  return updated_note;
end;
$$;

revoke all on function public.pn_set_note_status(uuid, text, text) from public;
grant execute on function public.pn_set_note_status(uuid, text, text) to anon, authenticated;

create or replace function public.pn_audit_authenticated_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_row record;
  target_project uuid;
  target_note uuid;
begin
  source_row := case when tg_op = 'DELETE' then old else new end;
  target_project := source_row.project_id;
  target_note := case when tg_table_name = 'pn_notes' then source_row.id else null end;

  if tg_table_name = 'pn_projects' then
    target_project := source_row.id;
  end if;

  insert into public.pn_activity(project_id, note_id, action, actor_id, details)
  values (
    target_project,
    target_note,
    lower(tg_op) || '_' || tg_table_name,
    auth.uid(),
    '{}'::jsonb
  );

  return source_row;
end;
$$;

revoke all on function public.pn_audit_authenticated_writes() from public, anon, authenticated;

drop trigger if exists pn_projects_audit_insert on public.pn_projects;
create trigger pn_projects_audit_insert after insert on public.pn_projects
for each row execute function public.pn_audit_authenticated_writes();

drop trigger if exists pn_projects_audit_delete on public.pn_projects;
create trigger pn_projects_audit_delete before delete on public.pn_projects
for each row execute function public.pn_audit_authenticated_writes();

drop trigger if exists pn_notes_audit_insert on public.pn_notes;
create trigger pn_notes_audit_insert after insert on public.pn_notes
for each row execute function public.pn_audit_authenticated_writes();

drop trigger if exists pn_notes_audit_delete on public.pn_notes;
create trigger pn_notes_audit_delete before delete on public.pn_notes
for each row execute function public.pn_audit_authenticated_writes();

insert into storage.buckets (id, name, public, file_size_limit)
values ('pn-files', 'pn-files', false, 52428800)
on conflict (id) do update set file_size_limit = excluded.file_size_limit;

drop policy if exists pn_files_public_select on storage.objects;
create policy pn_files_public_select on storage.objects for select to anon, authenticated
using (bucket_id = 'pn-files');

drop policy if exists pn_files_public_insert on storage.objects;
create policy pn_files_public_insert on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'pn-files'
  and exists (
    select 1
    from public.pn_notes n
    where n.project_id::text = (storage.foldername(name))[1]
      and n.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists pn_files_authenticated_delete on storage.objects;
create policy pn_files_authenticated_delete on storage.objects for delete to authenticated
using (bucket_id = 'pn-files');

-- Copy the existing Arabesque dataset into PN without modifying the old module.
insert into public.pn_projects(id, name, description, created_by, created_at, updated_at)
select p.id, p.name, p.description, null, p.created_at, p.updated_at
from public.projects p
where p.slug = 'arabesque'
on conflict (id) do nothing;

insert into public.pn_sections(id, project_id, title, position, created_by, created_at)
select s.id, s.project_id, s.title, s.position, s.created_by, s.created_at
from public.project_note_sections s
join public.pn_projects p on p.id = s.project_id
on conflict (id) do nothing;

insert into public.pn_notes(
  id, project_id, section_id, title, description, status, position,
  created_by, created_at, updated_at, completed_at
)
select
  n.id, n.project_id, n.section_id, n.title, n.description,
  case when n.status = 'cancelled' then 'open' else n.status end,
  n.position, n.created_by, n.created_at, n.updated_at,
  case when n.status = 'done' then coalesce(n.completed_at, n.updated_at) else null end
from public.project_notes n
join public.pn_projects p on p.id = n.project_id
on conflict (id) do nothing;

insert into public.pn_comments(id, project_id, note_id, body, created_at)
select c.id, c.project_id, c.note_id, c.body, c.created_at
from public.project_note_comments c
join public.pn_notes n on n.id = c.note_id
on conflict (id) do nothing;

insert into public.pn_attachments(
  id, project_id, note_id, bucket_id, object_path, file_name, mime_type, file_size, created_at
)
select a.id, a.project_id, a.note_id, a.bucket_id, a.object_path, a.file_name, a.mime_type, a.file_size, a.created_at
from public.project_note_attachments a
join public.pn_notes n on n.id = a.note_id
on conflict (id) do nothing;
