# Changelog

## [2.1.0] - 2026-09-22

### Added
- Unified authenticated user profile shared by the public header, dashboard header, and sidebar.
- Real profile editing for full name, phone, address, and avatar.
- Persistent project-file storage with Supabase metadata, signed downloads, and deletion support.
- Functional `/search` and `/messages` routes.
- Separate Public, Operational, and Admin application shells.
- Public project portfolio details backed by published Supabase project data.
- Document approval and review application surfaces merged through PR #10.

### Changed
- Application direction now follows the selected Arabic/English language through Radix DirectionProvider.
- Header responsiveness was reworked so the account avatar remains available on touch/mobile layouts.
- Settings now exposes working controls only.
- Service routes now resolve to their actual service pages.
- Public project cards route to public portfolio pages instead of protected project-management pages.
- Production CI now validates type-check, lint, tests, build, and backend checks.

### Removed
- Tracked `dist.next/` output and stale backup files from production source.
- Archived Supabase migration backup tree from the production repository.
- Unused mock notification surfaces and placeholder project-file behavior.
- Fake Ionic build responses; unconfigured provider endpoints now fail explicitly.

### Validation
- Frontend: type-check, lint, tests, production build.
- Backend: dependency install, syntax check, lint.
- Daftra MCP: code validation succeeds; exact OpenAPI contract/hash validation remains conditional on the authoritative 301-operation source file being present.

