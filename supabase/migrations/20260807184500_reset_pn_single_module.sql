-- Canonical PN reset: remove both previous generations and rebuild one PN module.
-- Runtime route: /pn only. No dependency on public.projects.

begin;

do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname='storage'
      and (policyname like 'pn_%' or policyname like 'project_note%' or policyname like '%project_note%')
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

drop table if exists public.pn_activity cascade;
drop table if exists public.pn_attachments cascade;
drop table if exists public.pn_comments cascade;
drop table if exists public.pn_deletion_log cascade;
drop table if exists public.pn_status_events cascade;
drop table if exists public.pn_audit cascade;
drop table if exists public.pn_notes cascade;
drop table if exists public.pn_sections cascade;
drop table if exists public.pn_projects cascade;

drop table if exists public.project_note_activity cascade;
drop table if exists public.project_note_attachments cascade;
drop table if exists public.project_note_comments cascade;
drop table if exists public.project_note_members cascade;
drop table if exists public.project_note_sections cascade;
drop table if exists public.project_note_settings cascade;
drop table if exists public.project_notes cascade;

do $$
declare r record;
begin
  for r in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('public','private')
      and (p.proname like 'pn_%' or p.proname like '%project_note%')
  loop
    execute format('drop function if exists %I.%I(%s) cascade', r.nspname, r.proname, r.args);
  end loop;
end $$;

create table public.pn_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  description text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pn_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pn_projects(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  position integer not null default 0 check (position >= 0),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(project_id, title),
  unique(project_id, id)
);

create table public.pn_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.pn_projects(id) on delete cascade,
  section_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  description text,
  status text not null default 'open' check (status in ('open','in_progress','blocked','done')),
  position integer not null default 0 check (position >= 0),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(project_id, id),
  constraint pn_notes_section_fk foreign key(project_id, section_id)
    references public.pn_sections(project_id, id) on delete cascade,
  constraint pn_notes_completion_check check (
    (status='done' and completed_at is not null)
    or (status<>'done' and completed_at is null)
  )
);

create table public.pn_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  note_id uuid not null,
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  actor_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pn_comments_note_fk foreign key(project_id, note_id)
    references public.pn_notes(project_id, id) on delete cascade
);

create table public.pn_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  note_id uuid not null,
  bucket_id text not null default 'pn-files' check (bucket_id='pn-files'),
  object_path text not null unique check (char_length(object_path) between 5 and 1024),
  file_name text not null check (char_length(btrim(file_name)) between 1 and 255),
  mime_type text,
  file_size bigint check (file_size is null or (file_size > 0 and file_size <= 52428800)),
  uploaded_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pn_attachments_note_fk foreign key(project_id, note_id)
    references public.pn_notes(project_id, id) on delete cascade,
  constraint pn_attachment_path_check check (
    split_part(object_path,'/',1)=project_id::text
    and split_part(object_path,'/',2)=note_id::text
  )
);

create table public.pn_status_events (
  id bigint generated always as identity primary key,
  project_id uuid not null,
  note_id uuid not null,
  status text not null check (status in ('open','in_progress','blocked','done')),
  comment text check (comment is null or char_length(btrim(comment)) between 1 and 5000),
  actor_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pn_status_events_note_fk foreign key(project_id, note_id)
    references public.pn_notes(project_id,id) on delete cascade
);

create table public.pn_audit (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('project','section','note')),
  entity_id uuid not null,
  project_id uuid,
  action text not null check (action in ('create','delete')),
  actor_id uuid references auth.users(id) on delete set null,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index pn_sections_project_position_idx on public.pn_sections(project_id, position);
create index pn_notes_project_status_idx on public.pn_notes(project_id,status);
create index pn_notes_project_section_position_idx on public.pn_notes(project_id,section_id,position);
create index pn_comments_note_created_idx on public.pn_comments(note_id,created_at);
create index pn_comments_project_note_idx on public.pn_comments(project_id,note_id);
create index pn_attachments_note_created_idx on public.pn_attachments(note_id,created_at);
create index pn_attachments_project_note_idx on public.pn_attachments(project_id,note_id);
create index pn_status_events_note_created_idx on public.pn_status_events(note_id,created_at desc);
create index pn_status_events_project_note_idx on public.pn_status_events(project_id,note_id);
create index pn_audit_entity_idx on public.pn_audit(entity_type,entity_id,created_at desc);
create index pn_audit_actor_idx on public.pn_audit(actor_id,created_at desc);

alter table public.pn_projects enable row level security;
alter table public.pn_sections enable row level security;
alter table public.pn_notes enable row level security;
alter table public.pn_comments enable row level security;
alter table public.pn_attachments enable row level security;
alter table public.pn_status_events enable row level security;
alter table public.pn_audit enable row level security;

create policy pn_projects_read on public.pn_projects for select to anon,authenticated using (true);
create policy pn_sections_read on public.pn_sections for select to anon,authenticated using (true);
create policy pn_notes_read on public.pn_notes for select to anon,authenticated using (true);
create policy pn_comments_read on public.pn_comments for select to anon,authenticated using (true);
create policy pn_attachments_read on public.pn_attachments for select to anon,authenticated using (true);

create policy pn_projects_create on public.pn_projects for insert to authenticated
  with check (created_by=(select auth.uid()));
create policy pn_projects_delete on public.pn_projects for delete to authenticated using (true);
create policy pn_sections_create on public.pn_sections for insert to authenticated
  with check (created_by=(select auth.uid()));
create policy pn_notes_create on public.pn_notes for insert to authenticated
  with check (created_by=(select auth.uid()));
create policy pn_notes_delete on public.pn_notes for delete to authenticated using (true);

create policy pn_comments_create on public.pn_comments for insert to anon,authenticated
  with check (
    actor_id is not distinct from (select auth.uid())
    and exists (
      select 1 from public.pn_notes n
      where n.id=pn_comments.note_id and n.project_id=pn_comments.project_id
    )
  );
create policy pn_attachments_create on public.pn_attachments for insert to anon,authenticated
  with check (
    uploaded_by is not distinct from (select auth.uid())
    and exists (
      select 1 from public.pn_notes n
      where n.id=pn_attachments.note_id and n.project_id=pn_attachments.project_id
    )
  );
create policy pn_status_events_create on public.pn_status_events for insert to anon,authenticated
  with check (
    actor_id is not distinct from (select auth.uid())
    and exists (
      select 1 from public.pn_notes n
      where n.id=pn_status_events.note_id and n.project_id=pn_status_events.project_id
    )
  );
create policy pn_audit_read on public.pn_audit for select to authenticated using (true);

revoke all on public.pn_projects, public.pn_sections, public.pn_notes, public.pn_comments,
  public.pn_attachments, public.pn_status_events, public.pn_audit from anon,authenticated;
grant select on public.pn_projects, public.pn_sections, public.pn_notes, public.pn_comments, public.pn_attachments to anon,authenticated;
grant insert on public.pn_comments, public.pn_attachments, public.pn_status_events to anon,authenticated;
grant insert,delete on public.pn_projects, public.pn_notes to authenticated;
grant insert on public.pn_sections to authenticated;
grant select on public.pn_audit to authenticated;
grant usage,select on sequence public.pn_status_events_id_seq to anon,authenticated;

create or replace function private.pn_apply_status_event()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
declare current_status text;
begin
  select status into current_status from public.pn_notes where id=new.note_id and project_id=new.project_id for update;
  if current_status is null then raise exception 'PN note not found'; end if;
  if current_status is distinct from new.status then
    update public.pn_notes
    set status=new.status,
        completed_at=case when new.status='done' then now() else null end,
        updated_at=now()
    where id=new.note_id and project_id=new.project_id;
  end if;
  if new.comment is not null and btrim(new.comment)<>'' then
    insert into public.pn_comments(project_id,note_id,body,actor_id)
    values(new.project_id,new.note_id,btrim(new.comment),new.actor_id);
  end if;
  return new;
end;
$$;
revoke all on function private.pn_apply_status_event() from public,anon,authenticated;
create trigger pn_status_event_apply after insert on public.pn_status_events
for each row execute function private.pn_apply_status_event();

create or replace function private.pn_audit_structure()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
declare payload jsonb; pid uuid; eid uuid; etype text; audit_action text;
begin
  if tg_op='DELETE' then payload=to_jsonb(old); audit_action='delete';
  else payload=to_jsonb(new); audit_action='create'; end if;
  eid=(payload->>'id')::uuid;
  if tg_table_name='pn_projects' then etype='project'; pid=eid;
  elsif tg_table_name='pn_sections' then etype='section'; pid=(payload->>'project_id')::uuid;
  else etype='note'; pid=(payload->>'project_id')::uuid; end if;
  insert into public.pn_audit(entity_type,entity_id,project_id,action,actor_id,snapshot)
  values(etype,eid,pid,audit_action,(select auth.uid()),payload);
  if tg_op='DELETE' then return old; else return new; end if;
end;
$$;
revoke all on function private.pn_audit_structure() from public,anon,authenticated;
create trigger pn_projects_audit_create after insert on public.pn_projects for each row execute function private.pn_audit_structure();
create trigger pn_projects_audit_delete before delete on public.pn_projects for each row execute function private.pn_audit_structure();
create trigger pn_sections_audit_create after insert on public.pn_sections for each row execute function private.pn_audit_structure();
create trigger pn_notes_audit_create after insert on public.pn_notes for each row execute function private.pn_audit_structure();
create trigger pn_notes_audit_delete before delete on public.pn_notes for each row execute function private.pn_audit_structure();

create or replace function public.pn_create_project(project_name text, project_description text default null)
returns public.pn_projects
language plpgsql
security invoker
set search_path=public
as $$
declare p public.pn_projects;
begin
  if (select auth.uid()) is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.pn_projects(name,description)
  values(btrim(project_name),nullif(btrim(project_description),''))
  returning * into p;
  insert into public.pn_sections(project_id,title,position)
  values(p.id,'ملاحظات عامة',0);
  return p;
end;
$$;
revoke all on function public.pn_create_project(text,text) from public,anon;
grant execute on function public.pn_create_project(text,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit)
values('pn-files','pn-files',false,52428800)
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit;

create policy pn_files_read on storage.objects for select to anon,authenticated using(bucket_id='pn-files');
create policy pn_files_create on storage.objects for insert to anon,authenticated
with check(bucket_id='pn-files' and exists (
  select 1 from public.pn_notes n
  where n.project_id::text=(storage.foldername(name))[1]
    and n.id::text=(storage.foldername(name))[2]
));
create policy pn_files_delete on storage.objects for delete to authenticated using(bucket_id='pn-files');

commit;
