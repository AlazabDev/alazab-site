-- Keep audit history valid when a note and its children are deleted.
-- The deleted entity UUID remains in entity_id; note_id is nullable once the parent no longer exists.

create or replace function public.log_project_note_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
  target_note_id uuid;
  target_entity_id uuid;
  activity_changes jsonb := '{}'::jsonb;
begin
  target_project_id := coalesce(new.project_id, old.project_id);
  target_entity_id := coalesce(new.id, old.id);
  target_note_id := case when tg_op = 'DELETE' then null else new.id end;

  if tg_op = 'UPDATE' then
    activity_changes := jsonb_strip_nulls(jsonb_build_object(
      'status', case when old.status is distinct from new.status then jsonb_build_object('from', old.status, 'to', new.status) end,
      'priority', case when old.priority is distinct from new.priority then jsonb_build_object('from', old.priority, 'to', new.priority) end,
      'assigned_to', case when old.assigned_to is distinct from new.assigned_to then jsonb_build_object('from', old.assigned_to, 'to', new.assigned_to) end,
      'title', case when old.title is distinct from new.title then jsonb_build_object('from', old.title, 'to', new.title) end
    ));
  elsif tg_op = 'DELETE' then
    activity_changes := jsonb_build_object('title', old.title);
  end if;

  insert into public.project_note_activity(
    project_id, note_id, actor_id, action, entity_type, entity_id, changes
  )
  values (
    target_project_id, target_note_id, auth.uid(), lower(tg_op),
    'note', target_entity_id, activity_changes
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.log_project_note_child_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_project_id uuid;
  source_note_id uuid;
  activity_note_id uuid;
  row_id uuid;
begin
  row_project_id := coalesce(new.project_id, old.project_id);
  source_note_id := coalesce(new.note_id, old.note_id);
  row_id := coalesce(new.id, old.id);

  select case
    when exists (select 1 from public.project_notes note where note.id = source_note_id)
      then source_note_id
    else null
  end into activity_note_id;

  insert into public.project_note_activity(
    project_id, note_id, actor_id, action, entity_type, entity_id, changes
  )
  values (
    row_project_id,
    activity_note_id,
    auth.uid(),
    lower(tg_op),
    tg_argv[0],
    row_id,
    case
      when activity_note_id is null then jsonb_build_object('deleted_note_id', source_note_id)
      else '{}'::jsonb
    end
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.log_project_note_activity() from public, anon, authenticated;
revoke all on function public.log_project_note_child_activity() from public, anon, authenticated;
