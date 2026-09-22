-- Bind approval document uploads to the authenticated user path.
alter table public.documents
  add column if not exists magicplan_gallery_url text;

drop policy if exists approval_documents_storage_insert on storage.objects;
create policy approval_documents_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'approval-documents'
  and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or public.has_approval_role(auth.uid(), array['owner','admin'])
  )
);

drop policy if exists approval_documents_storage_update on storage.objects;
create policy approval_documents_storage_update on storage.objects
for update to authenticated
using (
  bucket_id = 'approval-documents'
  and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or public.has_approval_role(auth.uid(), array['owner','admin'])
  )
)
with check (
  bucket_id = 'approval-documents'
  and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or public.has_approval_role(auth.uid(), array['owner','admin'])
  )
);

drop policy if exists approval_documents_storage_delete on storage.objects;
create policy approval_documents_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'approval-documents'
  and (
    split_part(name, '/', 1) = (select auth.uid())::text
    or public.has_approval_role(auth.uid(), array['owner','admin'])
  )
);
