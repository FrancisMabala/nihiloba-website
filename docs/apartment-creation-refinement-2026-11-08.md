# Apartment creation refinement — 8 November 2026

## Scope

Refined the existing three-step private-draft wizard: localized required-field guidance and shorter role labels, a keyboard-accessible commune suggestion list, clearer photo selection and pending-file feedback, stable property icons and a small native SVG building illustration. Fixed mobile count controls so inline validation messages occupy their own row.

The canonical draft, ownership, revision, retry, upload, deletion and explicit-publication behavior is unchanged. City changes still clear dependent location fields. WhatsApp behavior is unchanged. No backend change or database migration is required.

## Validation

- TypeScript and focused ESLint checks passed.
- `npx vitest run tests/apartment-creation-gateway.test.ts`: 8 passed.
- Production Next.js webpack build passed. The existing dependency junction prevents the default Turbopack build locally; webpack was used without changing deployment configuration.
- `npx playwright test --config playwright.apartments.config.ts --grep 'explicit web apartment creation|property save failure|resumed draft can cancel'`: 13 passed, covering all four supported languages, mobile/desktop creation, retry, draft resumption/discard and pending-upload cancellation.
- After the final mobile validation layout fix, the two French creation cases passed again.
- `git diff --check` passed.

Desktop and mobile screenshots were inspected, including entry, information, open commune suggestions, inline validation and photo selection. Evidence remains locally in `test-results/apartment-{entry,validation,commune,photos}-{390,1440}.png` and the existing wizard screenshots.

## Limits and release

Browser tests use isolated fixture responses and do not create production listings. Actual hosted photo-storage delivery was not exercised; this release does not claim to resolve an unproven storage-provider failure. Existing backend upload and eligibility safeguards remain authoritative.

Deploy only the website after pushing the validated commit. Confirm Render's live commit matches remote main. Retain unrelated stock evidence and unfinished files in this checkout.
