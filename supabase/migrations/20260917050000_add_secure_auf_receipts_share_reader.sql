create or replace function public.auf_share_get_receipts(
  p_session_token uuid,
  p_device_id text
)
returns table (
  id bigint,
  receipt_number smallint,
  receipt_code text,
  receipt_date date,
  branch text,
  items_count smallint,
  total_quantity numeric,
  subtotal numeric,
  vat_14 numeric,
  total_with_vat numeric,
  withholding_1 numeric,
  net_total numeric,
  items jsonb
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
begin
  perform public.validate_auf_share_session(p_session_token, p_device_id);

  return query
  select
    r.id,
    r.receipt_number,
    r.receipt_code,
    r.receipt_date,
    r.branch,
    r.items_count,
    r.total_quantity,
    r.subtotal,
    r.vat_14,
    round((r.subtotal + r.vat_14)::numeric, 2) as total_with_vat,
    r.withholding_1,
    r.net_total,
    r.items
  from public.auf_maintenance_receipts r
  order by r.receipt_number;
end;
$function$;

revoke all on function public.auf_share_get_receipts(uuid, text) from public;
grant execute on function public.auf_share_get_receipts(uuid, text) to anon, authenticated, service_role;
