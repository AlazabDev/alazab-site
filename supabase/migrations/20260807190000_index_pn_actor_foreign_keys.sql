create index if not exists pn_projects_created_by_idx on public.pn_projects(created_by);
create index if not exists pn_sections_created_by_idx on public.pn_sections(created_by);
create index if not exists pn_notes_created_by_idx on public.pn_notes(created_by);
create index if not exists pn_comments_actor_id_idx on public.pn_comments(actor_id);
create index if not exists pn_attachments_uploaded_by_idx on public.pn_attachments(uploaded_by);
create index if not exists pn_status_events_actor_id_idx on public.pn_status_events(actor_id);
