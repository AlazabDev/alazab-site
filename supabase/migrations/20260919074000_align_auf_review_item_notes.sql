
create or replace function public.auf_review_get_item_notes(
  p_session_token uuid,
  p_receipt_number integer
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'line_no', n.line_no,
        'comment', n.comment,
        'updated_at', n.updated_at
      )
      order by n.line_no
    ) filter (where n.line_no is not null),
    '[]'::jsonb
  )
  from public.auf_review_sessions s
  join public.auf_maintenance_receipts m
    on m.receipt_number = p_receipt_number
  left join public.auf_receipt_item_reviews n
    on n.session_id = s.id
   and n.receipt_id = m.id
  where s.session_token = p_session_token
    and public._assert_auf_share_permission(p_session_token, 'view') is not null;
$function$;

create or replace function public._auf_review_report_core(p_session_token uuid)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $function$
  select jsonb_build_object(
    'session', jsonb_build_object(
      'reviewer_name', s.reviewer_name,
      'status', s.status,
      'completed_count', s.completed_count,
      'correct_count', s.correct_count,
      'incorrect_count', s.incorrect_count,
      'started_at', s.started_at,
      'completed_at', s.completed_at
    ),
    'rows', (
      select jsonb_agg(
        jsonb_build_object(
          'receipt_number', m.receipt_number,
          'receipt_code', m.receipt_code,
          'receipt_date', m.receipt_date,
          'branch', m.branch,
          'items_count', m.items_count,
          'items', m.items,
          'subtotal', m.subtotal,
          'vat_14', m.vat_14,
          'withholding_1', m.withholding_1,
          'net_total', m.net_total,
          'image_url', null,
          'review_status', coalesce(r.status,'pending'),
          'review_result', r.review_result,
          'error_comment', r.error_comment,
          'item_notes', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'line_no', n.line_no,
                'comment', n.comment,
                'updated_at', n.updated_at
              )
              order by n.line_no
            )
            from public.auf_receipt_item_reviews n
            where n.session_id = s.id
              and n.receipt_id = m.id
          ), '[]'::jsonb),
          'reviewed_at', r.completed_at
        )
        order by m.receipt_number
      )
      from public.auf_maintenance_receipts m
      left join public.auf_receipt_reviews r
        on r.receipt_id = m.id
       and r.session_id = s.id
    )
  )
  from public.auf_review_sessions s
  where s.session_token = p_session_token;
$function$;

create or replace function public._auf_review_save_core(
  p_session_token uuid,
  p_receipt_number integer,
  p_result text,
  p_error_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_session public.auf_review_sessions%rowtype;
  v_receipt public.auf_maintenance_receipts%rowtype;
  v_completed int;
  v_correct int;
  v_incorrect int;
  v_next int;
  v_done boolean;
  v_item_notes_count int;
begin
  if p_result not in ('correct','incorrect') then
    raise exception 'invalid_review_result';
  end if;

  if p_result = 'incorrect' and nullif(btrim(p_error_comment),'') is null then
    raise exception 'error_comment_required';
  end if;

  select *
  into v_session
  from public.auf_review_sessions
  where session_token = p_session_token;

  if not found then
    raise exception 'review_session_not_found';
  end if;

  select *
  into v_receipt
  from public.auf_maintenance_receipts
  where receipt_number = p_receipt_number;

  if not found then
    raise exception 'receipt_not_found';
  end if;

  select count(*)
  into v_item_notes_count
  from public.auf_receipt_item_reviews n
  where n.session_id = v_session.id
    and n.receipt_id = v_receipt.id;

  if p_result = 'correct' and v_item_notes_count > 0 then
    raise exception 'item_notes_require_incorrect';
  end if;

  insert into public.auf_receipt_reviews(
    session_id,
    receipt_id,
    receipt_code,
    status,
    review_result,
    error_comment,
    completed_at,
    updated_at
  )
  values (
    v_session.id,
    v_receipt.id,
    v_receipt.receipt_code,
    'completed',
    p_result,
    case when p_result='incorrect' then btrim(p_error_comment) else null end,
    now(),
    now()
  )
  on conflict (session_id, receipt_id) do update
    set status='completed',
        review_result=excluded.review_result,
        error_comment=excluded.error_comment,
        completed_at=now(),
        updated_at=now();

  select count(*) filter (where status='completed'),
         count(*) filter (where status='completed' and review_result='correct'),
         count(*) filter (where status='completed' and review_result='incorrect')
  into v_completed, v_correct, v_incorrect
  from public.auf_receipt_reviews
  where session_id=v_session.id;

  v_done := v_completed = 120;

  if not v_done then
    select m.receipt_number
    into v_next
    from public.auf_maintenance_receipts m
    where m.receipt_number > p_receipt_number
      and not exists (
        select 1
        from public.auf_receipt_reviews r
        where r.session_id=v_session.id
          and r.receipt_id=m.id
          and r.status='completed'
      )
    order by m.receipt_number
    limit 1;

    if v_next is null then
      select m.receipt_number
      into v_next
      from public.auf_maintenance_receipts m
      where not exists (
        select 1
        from public.auf_receipt_reviews r
        where r.session_id=v_session.id
          and r.receipt_id=m.id
          and r.status='completed'
      )
      order by m.receipt_number
      limit 1;
    end if;
  else
    v_next := p_receipt_number;
  end if;

  update public.auf_review_sessions
  set current_receipt_number=v_next,
      completed_count=v_completed,
      correct_count=v_correct,
      incorrect_count=v_incorrect,
      status=case when v_done then 'completed' else 'in_progress' end,
      completed_at=case when v_done then coalesce(completed_at,now()) else null end,
      last_activity_at=now(),
      updated_at=now()
  where id=v_session.id;

  return jsonb_build_object(
    'ok',true,
    'completed_count',v_completed,
    'correct_count',v_correct,
    'incorrect_count',v_incorrect,
    'total_count',120,
    'next_receipt_number',v_next,
    'is_complete',v_done
  );
end;
$function$;
