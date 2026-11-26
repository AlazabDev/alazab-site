# Alazab Knowledge Base

Public reads expose approved records and approved revisions only. MCP is read-only.
REST POST requires Authorization: Bearer with AZ_KB_WRITER_TOKEN (draft-only) or AZ_KB_ADMIN_TOKEN (approval and protected-record changes). Both require at least 32 characters. Missing tokens disable writes. Existing record updates require exact expected_revision. No tokens belong in tracked .env files.

Deploy the reviewed server.py to /opt/alazab-kb after backing up the old source and database. Configure tokens in the protected systemd environment file (/etc/alazab-kb/service.env, mode 600), restart alazab-kb, validate health and unauthorized POST rejection. Do not run the old installer over existing credentials without review. Public MCP clients must no longer advertise knowledge_save. Existing approved records need provenance review because earlier writes were public.

No Nginx or DNS changes are performed by this source change.
