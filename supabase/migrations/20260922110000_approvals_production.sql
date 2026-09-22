-- Production schema for the Alazab document review/approval system.
-- This migration deliberately reuses the unified Alazab identity tables
-- (adp_profiles/adp_user_roles) instead of creating a second profile system.

create extension if not exists pgcrypto;

create table if not exists public.approval_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','reviewer','approver','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_approval_member(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _user_id is not null
    and exists (
      select 1
      from public.approval_memberships m
      where m.user_id = _user_id
        and m.active = true
    );
$$;

create or replace function public.has_approval_role(_user_id uuid, _roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _user_id is not null
    and exists (
      select 1
      from public.approval_memberships m
      where m.user_id = _user_id
        and m.active = true
        and m.role = any(_roles)
    );
$$;

create or replace function public.approval_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Existing platform owners/admins become approval-system owners/admins.
insert into public.approval_memberships (user_id, role, active)
select
  r.user_id,
  case when r.role::text = 'platform_owner' then 'owner' else 'admin' end,
  true
from public.adp_user_roles r
where r.role::text in ('platform_owner','platform_admin')
on conflict (user_id) do update
set role = excluded.role,
    active = true,
    updated_at = now();

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  daftra_id text unique,
  type text not null check (type in ('invoice','quote','estimate','document')),
  number text not null,
  title text,
  description text,
  client_name text not null default 'غير محدد',
  client_email text,
  sender_name text,
  project_id uuid references public.projects(id) on delete set null,
  total numeric(14,2) not null default 0,
  currency text not null default 'EGP',
  date date not null default current_date,
  status text not null default 'draft'
    check (status in ('draft','in_review','needs_fix','ready_to_approve','approved','signed','archived')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('paid','partial','unpaid')),
  pdf_url text,
  html_url text,
  file_bucket text,
  file_path text,
  file_url text,
  ai_summary text,
  ai_extracted_data jsonb,
  raw_json jsonb,
  synced_at timestamptz,
  assigned_reviewer_id uuid references auth.users(id) on delete set null,
  assigned_approver_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_status_idx on public.documents(status);
create index if not exists documents_type_idx on public.documents(type);
create index if not exists documents_created_at_idx on public.documents(created_at desc);
create index if not exists documents_project_id_idx on public.documents(project_id);
create index if not exists documents_synced_at_idx on public.documents(synced_at desc);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null default 1 check (version_number > 0),
  source text not null check (source in ('daftra','upload','revision')),
  file_bucket text,
  file_path text,
  file_url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id, version_number)
);

create index if not exists document_versions_document_idx
  on public.document_versions(document_id, version_number desc);

create table if not exists public.document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  user_name text not null,
  text text not null check (length(btrim(text)) > 0),
  page integer,
  x_position numeric,
  y_position numeric,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_comments_document_idx
  on public.document_comments(document_id, created_at desc);

create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  signer_id uuid references auth.users(id) on delete set null,
  reviewer_id uuid,
  signer_name text not null,
  signature_data text not null,
  signed_pdf_url text,
  pdf_hash text,
  ip_address inet,
  signed_at timestamptz not null default now()
);

create index if not exists document_signatures_document_idx
  on public.document_signatures(document_id, signed_at desc);

create table if not exists public.document_audit_logs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_audit_logs_document_idx
  on public.document_audit_logs(document_id, created_at desc);

create table if not exists public.document_reviewers (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  reviewer_name text not null,
  reviewer_email text not null,
  department text not null check (department in ('engineering','procurement','accounting','management','other')),
  access_token_hash text unique,
  token_expires_at timestamptz,
  email_sent_at timestamptz,
  last_accessed_at timestamptz,
  access_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  signed_at timestamptz,
  signature_data text,
  rejection_reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists document_reviewers_document_email_uidx
  on public.document_reviewers(document_id, lower(reviewer_email));
create index if not exists document_reviewers_document_idx
  on public.document_reviewers(document_id, created_at);

alter table public.document_signatures
  drop constraint if exists document_signatures_reviewer_id_fkey;
alter table public.document_signatures
  add constraint document_signatures_reviewer_id_fkey
  foreign key (reviewer_id) references public.document_reviewers(id) on delete set null;

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  daftra_item_id text,
  product_name text not null,
  product_description text,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total_price numeric not null default 0,
  notes text,
  approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected','revision_requested')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quote_items_document_idx
  on public.quote_items(document_id, created_at);
create index if not exists quote_items_status_idx
  on public.quote_items(approval_status);

create table if not exists public.document_sync_logs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid references auth.users(id) on delete set null,
  document_type text not null,
  page integer not null default 1,
  status text not null check (status in ('running','success','error')),
  synced_count integer not null default 0,
  items_synced integer not null default 0,
  error_count integer not null default 0,
  message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists document_sync_logs_started_idx
  on public.document_sync_logs(started_at desc);

-- Automatically stamp internal document creation and stop authenticated clients
-- from bypassing the server-side status state machine.
create or replace function public.approval_prepare_document()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    new.created_by := auth.uid();
    new.status := 'draft';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_prepare_document_trigger on public.documents;
create trigger approval_prepare_document_trigger
before insert on public.documents
for each row execute function public.approval_prepare_document();

create or replace function public.approval_protect_document_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.status is distinct from old.status then
    raise exception 'Document status changes must use the document-actions service';
  end if;
  return new;
end;
$$;

drop trigger if exists approval_protect_document_status_trigger on public.documents;
create trigger approval_protect_document_status_trigger
before update on public.documents
for each row execute function public.approval_protect_document_status();

drop trigger if exists approval_memberships_touch on public.approval_memberships;
create trigger approval_memberships_touch before update on public.approval_memberships
for each row execute function public.approval_touch_updated_at();

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
for each row execute function public.approval_touch_updated_at();

drop trigger if exists document_comments_touch on public.document_comments;
create trigger document_comments_touch before update on public.document_comments
for each row execute function public.approval_touch_updated_at();

drop trigger if exists document_reviewers_touch on public.document_reviewers;
create trigger document_reviewers_touch before update on public.document_reviewers
for each row execute function public.approval_touch_updated_at();

drop trigger if exists quote_items_touch on public.quote_items;
create trigger quote_items_touch before update on public.quote_items
for each row execute function public.approval_touch_updated_at();

-- RLS
alter table public.approval_memberships enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_comments enable row level security;
alter table public.document_signatures enable row level security;
alter table public.document_audit_logs enable row level security;
alter table public.document_reviewers enable row level security;
alter table public.quote_items enable row level security;
alter table public.document_sync_logs enable row level security;

drop policy if exists approval_memberships_read on public.approval_memberships;
create policy approval_memberships_read on public.approval_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.has_approval_role(auth.uid(), array['owner','admin'])
);

drop policy if exists approval_memberships_manage on public.approval_memberships;
create policy approval_memberships_manage on public.approval_memberships
for all to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin']))
with check (public.has_approval_role(auth.uid(), array['owner','admin']));

drop policy if exists documents_read on public.documents;
create policy documents_read on public.documents
for select to authenticated
using (public.is_approval_member(auth.uid()));

drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents
for insert to authenticated
with check (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']));

drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents
for update to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']))
with check (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']));

drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents
for delete to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin']));

drop policy if exists document_versions_read on public.document_versions;
create policy document_versions_read on public.document_versions
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists document_versions_insert on public.document_versions;
create policy document_versions_insert on public.document_versions
for insert to authenticated
with check (
  public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver'])
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists document_comments_read on public.document_comments;
create policy document_comments_read on public.document_comments
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists document_comments_insert on public.document_comments;
create policy document_comments_insert on public.document_comments
for insert to authenticated
with check (
  public.is_approval_member(auth.uid())
  and (user_id is null or user_id = auth.uid())
);

drop policy if exists document_comments_update on public.document_comments;
create policy document_comments_update on public.document_comments
for update to authenticated
using (
  user_id = auth.uid()
  or public.has_approval_role(auth.uid(), array['owner','admin','approver'])
)
with check (public.is_approval_member(auth.uid()));

drop policy if exists document_signatures_read on public.document_signatures;
create policy document_signatures_read on public.document_signatures
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists document_audit_logs_read on public.document_audit_logs;
create policy document_audit_logs_read on public.document_audit_logs
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists document_reviewers_read on public.document_reviewers;
create policy document_reviewers_read on public.document_reviewers
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists document_reviewers_insert on public.document_reviewers;
create policy document_reviewers_insert on public.document_reviewers
for insert to authenticated
with check (
  public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver'])
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists document_reviewers_update on public.document_reviewers;
create policy document_reviewers_update on public.document_reviewers
for update to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']))
with check (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']));

drop policy if exists document_reviewers_delete on public.document_reviewers;
create policy document_reviewers_delete on public.document_reviewers
for delete to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin']));

drop policy if exists quote_items_read on public.quote_items;
create policy quote_items_read on public.quote_items
for select to authenticated using (public.is_approval_member(auth.uid()));

drop policy if exists quote_items_update on public.quote_items;
create policy quote_items_update on public.quote_items
for update to authenticated
using (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']))
with check (public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver']));

drop policy if exists document_sync_logs_read on public.document_sync_logs;
create policy document_sync_logs_read on public.document_sync_logs
for select to authenticated using (public.is_approval_member(auth.uid()));

grant select, insert, update, delete on public.approval_memberships to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert on public.document_versions to authenticated;
grant select, insert, update on public.document_comments to authenticated;
grant select on public.document_signatures to authenticated;
grant select on public.document_audit_logs to authenticated;
grant select, insert, update, delete on public.document_reviewers to authenticated;
grant select, update on public.quote_items to authenticated;
grant select on public.document_sync_logs to authenticated;
grant execute on function public.is_approval_member(uuid) to authenticated;
grant execute on function public.has_approval_role(uuid,text[]) to authenticated;

-- Private document storage. External reviewers receive short-lived signed URLs
-- only after their invitation token is validated by the review-access function.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'approval-documents',
  'approval-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists approval_documents_storage_read on storage.objects;
create policy approval_documents_storage_read on storage.objects
for select to authenticated
using (bucket_id = 'approval-documents' and public.is_approval_member(auth.uid()));

drop policy if exists approval_documents_storage_insert on storage.objects;
create policy approval_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'approval-documents'
  and public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver'])
);

drop policy if exists approval_documents_storage_update on storage.objects;
create policy approval_documents_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'approval-documents'
  and public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver'])
)
with check (
  bucket_id = 'approval-documents'
  and public.has_approval_role(auth.uid(), array['owner','admin','reviewer','approver'])
);

drop policy if exists approval_documents_storage_delete on storage.objects;
create policy approval_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'approval-documents'
  and public.has_approval_role(auth.uid(), array['owner','admin'])
);
