# Candidate profile web completion — 4 November 2026

## Delivered

My Space now includes candidate profile management and a three-step private creation wizard in EN, FR, LN and SW. Jobs discovery, job detail and My Applications link to the same workspace. Professional and occasional-work profiles retain the backend's independent limits and required fields.

Saved progress resumes across the web and the existing WhatsApp conversation using the canonical onboarding operations introduced with migration 0218. Expired progress requires explicit recovery. Creation is private; professional recruiter visibility requires a separate consent action and retains the existing 30-day rules. Existing profiles support revision-checked editing and archiving. Optional PDF upload uses private document storage and returns only an asset reference.

A failed finalization retries the same saved intent; back/edit/save controls cannot replace an unresolved finalization. Conflicting edits preserve local input and require an explicit reload. Profile creation never submits a job application automatically. Job context is retained for returning to the originating offer.

## Privacy and compatibility

The same-origin gateway requires the existing session binding, rejects cross-site mutations, restricts paths/content types/body sizes, disables caching and redirects, and bounds backend timeouts. The backend remains authoritative for ownership, required fields, CV association, visibility and canonical creation. No sample profiles or employer access are fabricated. Existing WhatsApp commands, applications and urgent notification templates are unchanged.

Backend dependency: 4fff144fb824b3c056137b71a8b7f7e69e4160e0 (Complete private candidate profile web management APIs). Migration 0218 was already deployed; this completion adds no migration. Deploy and verify that backend before publishing this website release. Rollback the website first if necessary; retain additive schema and saved progress.

## Validation

- 28 focused frontend tests passed (gateway, candidate applications and My Space routing).
- TypeScript and focused ESLint passed.
- Production webpack build passed. The local dependency junction prevents Turbopack from resolving its project root; no production configuration was changed for that local limitation.
- Six Playwright browser tests passed on the final build: EN desktop, FR mobile, LN tablet, SW mobile, expired occasional-work recovery and concurrent profile edit handling. The creation scenarios verify exact retry payloads after an interrupted finalization.
- Backend validation: 39 SQLite tests passed; four PostgreSQL-only cases are separately covered by PostgreSQL runs. The PostgreSQL foundation races and profile-edit race passed; see the backend employment candidate audit for exact run accounting.

These are isolated test records. Live verification is read-only and does not create candidate profiles or submit applications. Release status is recorded separately after Render confirms both exact commits Live. Personal job-offer onboarding and broader account-security modernization remain separate queued batches.
