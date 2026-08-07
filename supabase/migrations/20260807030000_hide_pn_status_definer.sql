create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.pn_set_note_status_impl(
  target_note_id uuid,
  next_status text,
  status_comment text default null
)
returns public.pn_notes
language plpgsql
security definer
set search_path = public, private
as $$
declare
  updated_note public.pn_notes;
begin
  if next_status not in ('open','in_progress','blocked','done') then
    raise exception 'Invalid PN note status';
  end if;

  update public.pn_notes
  set status = next_status,
      completed_at = case when next_status = 'done' then now() else null end,
      updated_at = now()
  where id = target_note_id
  returning * into updated_note;

  if updated_note.id is null then
    raise exception 'PN note not found';
  end if;

  if status_comment is not null and char_length(btrim(status_comment)) > 0 then
    insert into public.pn_comments(project_id, note_id, body)
    values (updated_note.project_id, updated_note.id, left(btrim(status_comment), 5000));
  end if;

  insert into public.pn_activity(project_id, note_id, action, actor_id, details)
  values (
    updated_note.project_id,
    updated_note.id,
    'status_changed',
    auth.uid(),
    jsonb_build_object('status', next_status)
  );

  return updated_note;
end;
$$;

revoke all on function private.pn_set_note_status_impl(uuid, text, text) from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.pn_set_note_status_impl(uuid, text, text) to anon, authenticated;

create or replace function public.pn_set_note_status(
  target_note_id uuid,
  next_status text,
  status_comment text default null
)
returns public.pn_notes
language sql
security invoker
set search_path = public, private
as $$
  select private.pn_set_note_status_impl(target_note_id, next_status, status_comment)
$$;

revoke all on function public.pn_set_note_status(uuid, text, text) from public;
grant execute on function public.pn_set_note_status(uuid, text, text) to anon, authenticated;
