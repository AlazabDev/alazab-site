revoke insert, update, delete on public.pn_projects, public.pn_sections, public.pn_notes from anon;
revoke update on public.pn_projects, public.pn_sections, public.pn_notes from authenticated;

revoke update, delete on public.pn_comments, public.pn_attachments from anon, authenticated;
revoke all on public.pn_activity, public.pn_deletion_log from anon;

-- Re-assert only the approved public operations.
grant select on public.pn_projects, public.pn_sections, public.pn_notes, public.pn_comments, public.pn_attachments to anon, authenticated;
grant insert on public.pn_comments, public.pn_attachments to anon, authenticated;

-- WhatsApp-authenticated identity is required only for structure creation/deletion.
grant insert, delete on public.pn_projects, public.pn_sections, public.pn_notes to authenticated;
grant select on public.pn_activity, public.pn_deletion_log to authenticated;
