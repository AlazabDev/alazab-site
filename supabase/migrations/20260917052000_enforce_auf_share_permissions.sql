create or replace function public._assert_auf_share_permission(
  p_session_token uuid,
  p_permission text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_link_id uuid;
  v_permissions text[];
begin
  if p_permission not in ('view', 'review', 'download') then
    raise exception 'share_permission_invalid';
  end if;

  v_link_id := public._assert_auf_share_session(p_session_token);

  select l.permissions
    into v_permissions
  from public.share_links l
  where l.id = v_link_id;

  if v_permissions is null or not (p_permission = any(v_permissions)) then
    raise exception 'share_permission_denied';
  end if;

  return v_link_id;
end;
$function$;

revoke all on function public._assert_auf_share_permission(uuid, text) from public;
grant execute on function public._assert_auf_share_permission(uuid, text) to anon, authenticated, service_role;

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
  perform public._assert_auf_share_permission(p_session_token, 'view');

  if p_device_id is null or btrim(p_device_id) = '' then
    raise exception 'share_device_required';
  end if;

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

create or replace function public.auf_review_bootstrap(p_session_token uuid, p_reviewer_name text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'review');
  return public._auf_review_bootstrap_core(p_session_token, p_reviewer_name);
end;
$function$;

create or replace function public.auf_review_draft(p_session_token uuid, p_receipt_number integer, p_result text default null::text, p_error_comment text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'review');
  return public._auf_review_draft_core(p_session_token, p_receipt_number, p_result, p_error_comment);
end;
$function$;

create or replace function public.auf_review_get_state(p_session_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'view');
  return public._auf_review_get_state_core(p_session_token);
end;
$function$;

create or replace function public.auf_review_report(p_session_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'download');
  return public._auf_review_report_core(p_session_token);
end;
$function$;

create or replace function public.auf_review_save(p_session_token uuid, p_receipt_number integer, p_result text, p_error_comment text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'review');
  return public._auf_review_save_core(p_session_token, p_receipt_number, p_result, p_error_comment);
end;
$function$;

create or replace function public.auf_review_touch(p_session_token uuid, p_receipt_number integer)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public._assert_auf_share_permission(p_session_token, 'review');
  return public._auf_review_touch_core(p_session_token, p_receipt_number);
end;
$function$;
