# Candidate profile refinement — 7 November 2026

Three-step candidate creation now uses removable role/skill/contract chips, localized suggestions, grouped optional information, grouped editable review, explicit private creation, draft progress and last-edited time. Draft deletion requires a contextual confirmation; leaving offers continue, save-and-exit or discard-unsaved choices. Failed saves/deletions preserve work. Cancellation releases the browser retry key for a genuinely new intent.

Canonical professional/occasional requirements, private visibility and recruiter authorization remain authoritative. Three desired roles, 20 list entries, 2000-character descriptions and private PDF uploads up to 10 MB remain unchanged. City and historical contract/availability/experience values remain text: suggestions do not invent enum identifiers or rewrite existing values. CV/no-CV remains explicit. No publication, application, notification or WhatsApp lifecycle change. Backend adds only the existing updated_at projection; no migration.

Validation: 15 unit/gateway tests, lint, TypeScript and production webpack build passed. 27 browser tests passed: EN/FR/LN/SW at 360/390/768/1024/1440, private creation/retry intent, expired occasional recovery, existing-profile conflict, delete confirmations and failed save/delete retention. Desktop/mobile screenshots reviewed and retained in outputs/candidate-profile-refinement. Synthetic fixtures only; no production candidate created. Backend PostgreSQL/WhatsApp suite: 18 passed, zero skips.

Commands: node node_modules/vitest/vitest.mjs run tests/candidate-ux.test.ts tests/candidate-profile-gateway.test.ts tests/candidate-employment.test.ts; node node_modules/next/dist/bin/next build --webpack; node node_modules/@playwright/test/cli.js test --config playwright.candidate-profile.config.ts.

Deploy backend 605b3bbd before this website. Older responses without updated_at remain supported. Rollback is code-only. Urgent WhatsApp templates unchanged. GitHub combined-status API returned no statuses; this does not establish Actions success.

The professional editor groups schedule and contract choices in one required field.
The three-step review accepts candidates with no prior experience and no CV.
The work-mode field describes on-site, hybrid or remote work independently of the
desired city. The authenticated draft retains a newly uploaded CV's display
filename. Older attachments without a recorded filename use the existing
attachment label. Finishing uses the same revision-bound finalization on retry.

### Household-job profiles

The three-step form keeps mission choices, schedules and practical skills in the owner’s structured answers. The profile card, review and read-only owner page use those answers after reload. A direct owner view includes the profile reference and loads it from the signed-in personal account. Matching consent is optional. Earlier profile-level examples remain readable, and newly entered examples belong to individual missions. Existing free-text cities, multiple Kinshasa communes and private professional drafts remain supported.
