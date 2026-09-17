drop policy if exists "Public can read Abu Auf maintenance receipts" on public.auf_maintenance_receipts;

revoke select on table public.auf_maintenance_receipts from anon, authenticated;

grant select on table public.auf_maintenance_receipts to service_role;

comment on table public.auf_maintenance_receipts is
  'Abu Auf maintenance receipts. Direct client access is blocked; use share-session RPCs and the receipt image gateway.';
