create table if not exists public.auf_receipt_item_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.auf_review_sessions(id) on delete cascade,
  receipt_id bigint not null references public.auf_maintenance_receipts(id) on delete cascade,
  line_no smallint not null check (line_no > 0),
  comment text not null check (nullif(btrim(comment),'') is not null),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, receipt_id, line_no)
);

alter table public.auf_receipt_item_reviews enable row level security;
revoke all on table public.auf_receipt_item_reviews from public, anon, authenticated;
grant select, insert, update, delete on table public.auf_receipt_item_reviews to service_role;

create or replace function public.auf_review_set_item_note(
  p_session_token uuid,
  p_receipt_number integer,
  p_line_no integer,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_session public.auf_review_sessions%rowtype;
  v_receipt public.auf_maintenance_receipts%rowtype;
  v_comment text;
begin
  perform public._assert_auf_share_permission(p_session_token, 'review');
  select * into v_session from public.auf_review_sessions where session_token = p_session_token;
  if not found then raise exception 'review_session_not_found'; end if;
  select * into v_receipt from public.auf_maintenance_receipts where receipt_number = p_receipt_number;
  if not found then raise exception 'receipt_not_found'; end if;
  if p_line_no < 1 or p_line_no > greatest(v_receipt.items_count, 1) then raise exception 'item_line_out_of_range'; end if;
  v_comment := nullif(btrim(p_comment), '');
  if v_comment is null then
    delete from public.auf_receipt_item_reviews where session_id = v_session.id and receipt_id = v_receipt.id and line_no = p_line_no;
  else
    insert into public.auf_receipt_item_reviews(session_id, receipt_id, line_no, comment)
    values (v_session.id, v_receipt.id, p_line_no, v_comment)
    on conflict (session_id, receipt_id, line_no) do update set comment = excluded.comment, updated_at = now();
  end if;
  update public.auf_review_sessions
  set current_receipt_number = p_receipt_number, last_activity_at = now(), updated_at = now()
  where id = v_session.id;
  return jsonb_build_object('ok',true,'receipt_number',p_receipt_number,'line_no',p_line_no,'comment',v_comment,'saved_at',now());
end;
$function$;

create or replace function public.auf_review_get_item_notes(p_session_token uuid, p_receipt_number integer)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('line_no',n.line_no,'comment',n.comment,'updated_at',n.updated_at) order by n.line_no), '[]'::jsonb)
  from public.auf_review_sessions s
  join public.auf_maintenance_receipts m on m.receipt_number = p_receipt_number
  left join public.auf_receipt_item_reviews n on n.session_id = s.id and n.receipt_id = m.id
  where s.session_token = p_session_token
    and public._assert_auf_share_permission(p_session_token, 'view') is not null;
$function$;

revoke all on function public.auf_review_set_item_note(uuid, integer, integer, text) from public;
revoke all on function public.auf_review_get_item_notes(uuid, integer) from public;
grant execute on function public.auf_review_set_item_note(uuid, integer, integer, text) to anon, authenticated, service_role;
grant execute on function public.auf_review_get_item_notes(uuid, integer) to anon, authenticated, service_role;
