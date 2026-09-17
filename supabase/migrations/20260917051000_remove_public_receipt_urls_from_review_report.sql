create or replace function public._auf_review_report_core(p_session_token uuid)
returns jsonb
language sql
security definer
set search_path to 'public', 'pg_temp'
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
      select jsonb_agg(jsonb_build_object(
        'receipt_number', m.receipt_number,
        'receipt_code', m.receipt_code,
        'receipt_date', m.receipt_date,
        'branch', m.branch,
        'items_count', m.items_count,
        'subtotal', m.subtotal,
        'vat_14', m.vat_14,
        'withholding_1', m.withholding_1,
        'net_total', m.net_total,
        'image_url', null,
        'review_status', coalesce(r.status,'pending'),
        'review_result', r.review_result,
        'error_comment', r.error_comment,
        'reviewed_at', r.completed_at
      ) order by m.receipt_number)
      from public.auf_maintenance_receipts m
      left join public.auf_receipt_reviews r
        on r.receipt_id = m.id and r.session_id = s.id
    )
  )
  from public.auf_review_sessions s
  where s.session_token = p_session_token;
$function$;
