-- Auto-create a financial receipt ONLY after successful receipt review approval.
-- No submission to ETA is performed here. Integration will be a separate workflow.
create table if not exists public.auf_financial_receipts (
 id uuid primary key default gen_random_uuid(),
 review_id uuid not null unique references public.auf_receipt_reviews(id) on delete restrict,
 session_id uuid not null references public.auf_review_sessions(id),
 receipt_id bigint not null references public.auf_maintenance_receipts(id),
 receipt_code text not null, branch text not null, work_date date not null,
 approved_at timestamptz not null, items jsonb not null,
 subtotal numeric(14,2) not null, vat_rate numeric(6,4) not null default 0.14,
 vat_amount numeric(14,2) not null, withholding_rate numeric(6,4) not null default 0.01,
 withholding_amount numeric(14,2) not null, net_total numeric(14,2) not null,
 lifecycle_status text not null default 'draft' check(lifecycle_status in ('draft','void','issued')),
 tax_status text not null default 'not_submitted' check(tax_status in ('not_submitted','pending','submitted','accepted','rejected')),
 eta_document_id text, eta_submission_id text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists auf_financial_receipts_receipt_id_idx on public.auf_financial_receipts(receipt_id);
alter table public.auf_financial_receipts enable row level security;
revoke all on public.auf_financial_receipts from anon, authenticated;

create or replace function public.auf_sync_financial_receipt()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare m public.auf_maintenance_receipts%rowtype;
begin
 if new.status='completed' and new.review_result='correct' then
   select * into strict m from public.auf_maintenance_receipts where id=new.receipt_id;
   insert into public.auf_financial_receipts
     (review_id,session_id,receipt_id,receipt_code,branch,work_date,approved_at,items,subtotal,vat_amount,withholding_amount,net_total)
   values (new.id,new.session_id,new.receipt_id,m.receipt_code,m.branch,m.receipt_date,
           coalesce(new.completed_at,now()),m.items,m.subtotal,m.vat_14,m.withholding_1,m.net_total)
   on conflict (review_id) do update set
     branch=excluded.branch,work_date=excluded.work_date,approved_at=excluded.approved_at,
     items=excluded.items,subtotal=excluded.subtotal,vat_amount=excluded.vat_amount,
     withholding_amount=excluded.withholding_amount,net_total=excluded.net_total,
     lifecycle_status='draft',updated_at=now()
   where public.auf_financial_receipts.tax_status='not_submitted'
     and public.auf_financial_receipts.lifecycle_status <> 'issued';
   if not found then raise exception 'financial_receipt_locked_after_tax_submission'; end if;
 elsif new.review_result='incorrect' or new.status<>'completed' then
   update public.auf_financial_receipts set lifecycle_status='void',updated_at=now()
   where review_id=new.id and tax_status='not_submitted' and lifecycle_status='draft';
   if exists(select 1 from public.auf_financial_receipts where review_id=new.id and lifecycle_status<>'void') then
     raise exception 'cannot_revoke_receipt_after_tax_submission';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists auf_financial_receipt_after_review on public.auf_receipt_reviews;
create trigger auf_financial_receipt_after_review
 after insert or update of status,review_result,completed_at on public.auf_receipt_reviews
 for each row execute function public.auf_sync_financial_receipt();
comment on table public.auf_financial_receipts is
 'Auto-created financial receipts after reviewer approval. Tax transmission requires a separate future ETA integration; no automatic external submission.';
