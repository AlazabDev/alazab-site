create or replace function public.admin_create_auf_share_link(
  p_label text default null::text,
  p_expires_days integer default 30,
  p_max_devices integer default 1
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions', 'pg_temp'
as $function$
declare
  v_token text;
  v_link public.share_links%rowtype;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  if p_expires_days < 1 or p_expires_days > 365 then
    raise exception 'expires_days_out_of_range';
  end if;
  if p_max_devices < 1 or p_max_devices > 50 then
    raise exception 'max_devices_out_of_range';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.share_links(
    resource, token_hash, token_hint, label, expires_at, max_devices, created_by
  ) values (
    'auf_receipts_review',
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    right(v_token, 8),
    nullif(btrim(p_label), ''),
    now() + make_interval(days => p_expires_days),
    p_max_devices,
    auth.uid()
  ) returning * into v_link;

  return jsonb_build_object(
    'id', v_link.id,
    'label', v_link.label,
    'expires_at', v_link.expires_at,
    'max_devices', v_link.max_devices,
    'deep_link', 'alazab://share/' || v_token,
    'web_link', 'https://alazab.com/receipts?hash=' || v_token,
    'token_hint', v_link.token_hint
  );
end;
$function$;
