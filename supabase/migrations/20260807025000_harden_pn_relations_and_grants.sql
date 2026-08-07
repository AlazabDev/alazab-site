alter table public.pn_notes
  drop constraint if exists pn_notes_section_fk;

alter table public.pn_notes
  add constraint pn_notes_section_fk
  foreign key (project_id, section_id)
  references public.pn_sections(project_id, id)
  on delete restrict;

grant select on public.pn_projects, public.pn_sections, public.pn_notes, public.pn_comments, public.pn_attachments
to anon, authenticated;

grant insert on public.pn_comments, public.pn_attachments
to anon, authenticated;

grant insert, delete on public.pn_projects, public.pn_sections, public.pn_notes
to authenticated;

grant select on public.pn_activity, public.pn_deletion_log
to authenticated;
