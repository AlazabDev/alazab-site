begin;

create sequence if not exists public.maintenance_work_order_number_seq start with 1;

create table if not exists public.maintenance_work_orders (
  id uuid primary key default gen_random_uuid(),
  work_order_number text not null unique default (
    'WO-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.maintenance_work_order_number_seq')::text, 5, '0')
  ),
  request_id uuid references public.maintenance_requests(id) on delete set null,
  title text not null,
  description text,
  branch text,
  service_type text,
  priority text not null default 'medium',
  status text not null default 'new',
  assigned_to uuid,
  vendor_name text,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  estimated_cost numeric(14,2),
  actual_cost numeric(14,2),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_work_orders_status_check check (
    status in (
      'new', 'triaged', 'approved', 'assigned', 'scheduled', 'in_progress',
      'waiting_parts', 'waiting_approval', 'completed', 'financial_review', 'closed', 'cancelled'
    )
  )
);

create index if not exists maintenance_work_orders_request_id_idx
  on public.maintenance_work_orders(request_id);
create index if not exists maintenance_work_orders_status_idx
  on public.maintenance_work_orders(status);
create index if not exists maintenance_work_orders_created_at_idx
  on public.maintenance_work_orders(created_at desc);

create table if not exists public.maintenance_work_order_items (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.maintenance_work_orders(id) on delete cascade,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text,
  unit_price numeric(14,2),
  total numeric(14,2) generated always as (quantity * coalesce(unit_price, 0)) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists maintenance_work_order_items_work_order_idx
  on public.maintenance_work_order_items(work_order_id);

create table if not exists public.maintenance_status_history (
  id bigint generated always as identity primary key,
  work_order_id uuid not null references public.maintenance_work_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  note text,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create index if not exists maintenance_status_history_work_order_idx
  on public.maintenance_status_history(work_order_id, changed_at desc);

create or replace function public.maintenance_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.maintenance_validate_work_order_transition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'new' and new.status in ('triaged', 'cancelled')) or
    (old.status = 'triaged' and new.status in ('approved', 'cancelled')) or
    (old.status = 'approved' and new.status in ('assigned', 'scheduled', 'cancelled')) or
    (old.status = 'assigned' and new.status in ('scheduled', 'in_progress', 'cancelled')) or
    (old.status = 'scheduled' and new.status in ('in_progress', 'cancelled')) or
    (old.status = 'in_progress' and new.status in ('waiting_parts', 'waiting_approval', 'completed', 'cancelled')) or
    (old.status in ('waiting_parts', 'waiting_approval') and new.status in ('in_progress', 'completed', 'cancelled')) or
    (old.status = 'completed' and new.status = 'financial_review') or
    (old.status = 'financial_review' and new.status in ('closed', 'in_progress'))
  ) then
    raise exception 'Invalid maintenance work order status transition: % -> %', old.status, new.status
      using errcode = '23514';
  end if;

  if new.status = 'in_progress' and new.started_at is null then
    new.started_at = now();
  end if;

  if new.status = 'completed' and new.completed_at is null then
    new.completed_at = now();
  end if;

  return new;
end;
$$;

create or replace function public.maintenance_log_work_order_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.maintenance_status_history(work_order_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.maintenance_status_history(work_order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists maintenance_work_orders_validate_transition on public.maintenance_work_orders;
create trigger maintenance_work_orders_validate_transition
before update of status on public.maintenance_work_orders
for each row execute function public.maintenance_validate_work_order_transition();

drop trigger if exists maintenance_work_orders_touch_updated_at on public.maintenance_work_orders;
create trigger maintenance_work_orders_touch_updated_at
before update on public.maintenance_work_orders
for each row execute function public.maintenance_touch_updated_at();

drop trigger if exists maintenance_work_orders_log_status on public.maintenance_work_orders;
create trigger maintenance_work_orders_log_status
after insert or update of status on public.maintenance_work_orders
for each row execute function public.maintenance_log_work_order_status();

alter table public.maintenance_work_orders enable row level security;
alter table public.maintenance_work_order_items enable row level security;
alter table public.maintenance_status_history enable row level security;

drop policy if exists "maintenance work orders authenticated read" on public.maintenance_work_orders;
create policy "maintenance work orders authenticated read"
on public.maintenance_work_orders for select
to authenticated
using (true);

drop policy if exists "maintenance work orders authenticated insert" on public.maintenance_work_orders;
create policy "maintenance work orders authenticated insert"
on public.maintenance_work_orders for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "maintenance work orders authenticated update" on public.maintenance_work_orders;
create policy "maintenance work orders authenticated update"
on public.maintenance_work_orders for update
to authenticated
using (true)
with check (true);

drop policy if exists "maintenance work order items authenticated read" on public.maintenance_work_order_items;
create policy "maintenance work order items authenticated read"
on public.maintenance_work_order_items for select
to authenticated
using (true);

drop policy if exists "maintenance work order items authenticated write" on public.maintenance_work_order_items;
create policy "maintenance work order items authenticated write"
on public.maintenance_work_order_items for all
to authenticated
using (true)
with check (true);

drop policy if exists "maintenance status history authenticated read" on public.maintenance_status_history;
create policy "maintenance status history authenticated read"
on public.maintenance_status_history for select
to authenticated
using (true);

grant select, insert, update on public.maintenance_work_orders to authenticated;
grant select, insert, update, delete on public.maintenance_work_order_items to authenticated;
grant select on public.maintenance_status_history to authenticated;
grant usage, select on sequence public.maintenance_work_order_number_seq to authenticated;

commit;
