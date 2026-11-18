# Country-neutral onboarding release — 18 November 2026

This records the explicitly authorized release of the preceding onboarding batch.
The subsequent waiting-time performance batch is local only and is **not** part
of these deployed revisions.

| Component | Verified origin/main commit | Render deployment | Verified result (UTC) |
|---|---|---|---|
| Terms publication first | `b9eaa714376621bc4ffeeb671344eca2bc516748` | `dep-dbuu23m1egvs739lj6g0` | Live 17:33:52 |
| Backend | `97e2bfb075c1801be704bceaaae3ca5ff7f29cb3` | `dep-dbuu39qfngtc739regq0` | Live 17:38:15 |
| Website | `e819c0083a3dbb809d993cfaaada1d33ac428c58` | `dep-dbuu63tckfvc73a9k5ug` | Live 17:42:43 |
| Business | `c299b985fcd5dd3e0308af8d972bc625bd9755eb` | `dep-dbuu64mtlv9c73c2q5o0` | Live 17:42:19 |

All pushes used explicit `HEAD:main`, with matching `git ls-remote` SHAs. Render's
three services have automatic deployment disabled, so each was explicitly
triggered and checked against its commit. The Terms publication checkout was
necessary to release the versioned documents before activating their pointer.
The final Website merge preserves both publication and onboarding changes.

## Verification

- Personal and Business Terms 1.2, FR and EN URLs: HTTP 200, correct document
  version and publication date. Historical documents remain accessible; current
  Privacy remains 1.1. Publishing did not record user acceptance.
- Fresh anonymous Chrome browser: Website `/fr/shida/register/` opens; the next
  step renders country/city of residence independently of WhatsApp contact.
- Fresh anonymous Chrome browser: Business `/create-organization/?lang=fr`,
  selecting the new-creator path renders “Je confirme avoir au moins 18 ans.”
  No personal fields were entered and verification was never submitted.
- Backend `/health`, public Restaurant discovery, Website Restaurant marketplace
  and Business home returned HTTP 200 in bounded read-only checks.
- Prior focused unit/browser/build evidence is recorded in
  [the implementation report](onboarding-country-neutral-implementation-20261118.md).
  The Terms publication adjustment passed ten legal tests; the final merge passed
  eleven legal/declaration tests. Both frontend Render builds and backend startup
  completed successfully.
- GitHub combined-status connector returned no statuses for these commits.
  Public check-runs returned no Website checks; Backend/Business were inaccessible
  to the unauthenticated API (404). Do not interpret that as green GitHub CI.

No new database migration was introduced. The existing backend predeploy migration
runner was retained. No production account, OTP, message or acceptance was created.
Browser checks were desktop Chrome, not physical-device/Safari verification.

The legacy `adult-drc-v1` affirmative marker remains accepted only before
**2026-12-03T00:00:00Z**. New clients send `adult-v1`; missing/unchecked declarations
remain rejected. No country inference or residence backfill was performed.

## Retained local resources

`C:\NIHILOBA\release-onboarding-terms-20261118` retains the publication commit and
its shared dependency junction. It was not removed without worktree-owner review.
Website/Business build caches from validation were previously retained after an
automatic approval rejection of cleanup; no alternative deletion mechanism was
used. Shared dependencies and unrelated unfinished work remain intact.
