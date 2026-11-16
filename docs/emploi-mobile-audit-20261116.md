# Emploi mobile audit

## Changes and causes

- `jobs.tsx`, `jobs-public.css`: the organization name and follow control shared a wrapping flex row; a long name could be reduced to a narrow column. A flexible logo/name group now owns its width, with following on a separate mobile row. Profile metadata uses compact body text and open vacancies follow after 16px. Full names remain visible. The existing Business ownership invitation remains below vacancies and now wraps oversized text safely.
- `job-presentation.tsx`, `jobs-public.css`: organization-profile cards inherited decorative category icons, clamped headings, stacked rows, and full-width detail buttons. Each now has one native, keyboard-accessible `JobAccessLink` covering the card, full title, location, neutral external label, and a subtle arrow. The existing access gate and canonical destination remain in use. Other listing-card structure is unchanged.
- `job-mobile-detail.css`: the return links, employer identity, metadata, and publication date have explicit mobile sizing and order. Employer logos/initials cannot compete with the name. The existing single sticky application control and safe-area/viewport logic remain unchanged.
- `job-public-actions.tsx`, `job-relationship-actions.tsx`: detail pages with an organization destination direct following to that profile. Save/share remain on the job. The new presentation option defaults to the previous behavior elsewhere; relationship permissions, mutation payloads, confirmations, session checks, and existing pending-action/login resumption remain unchanged.
- `employer-page-copy.ts`: “Profil créé par SHIDA” and separately localized managed-profile wording preserve provenance without repeating the organization name. Unknown management status does not claim SHIDA created the profile. FR/EN/LN/SW are supported.

## Attribution and verification audit

Read the current backend `app/services/public_job_marketplace.py` and `app/database/models.py` contracts. `ExternalJobMetadataDB.directory_entry_id` supplies one organization identity. The public employer projection has no separate recruitment-agency and actual-client relationship. Consequently the example “ITM SARL — client non communiqué” versus a description mentioning the Danish Refugee Council cannot be resolved reliably by the UI. The recorded identity and original description/source are preserved; no production data was edited or inferred. An editor should compare the original source before correcting that record.

Minimal future backend improvement: optional, separately attributed recruiting-organization and hiring-organization references, with a disclosed/undisclosed/unknown client status, explicitly reviewed against source evidence. Preserve the existing employer projection for older clients. This needs a separately scoped API/schema change and any required migration review.

The serializer currently assigns `external_verified = bool(external_metadata)`, despite metadata also having `verified_at` and review/provenance fields. This flag alone is not evidence of independent vacancy/employer verification. Public cards now consistently say “Offre externe” (localized), as job details already did. Genuine organization-verification display remains separate. Source URLs, backend-controlled application actions, instructions, and expiration rules are preserved. A future verification contract should explicitly describe what was reviewed and when instead of overloading metadata presence.

## Validation

- Focused Vitest: 76 tests across jobs-marketplace, jobs-discovery-refinement, external-job-actions, job-search, jobs-anonymous-contract, and job-results-return.
- New assertions cover full-card links, untruncated title markup, neutral labels in all four locales, managed/SHIDA-created/unknown provenance, and preserving the recorded agency name and open count.
- Targeted ESLint and TypeScript no-emit checks passed. No local production build or backend suite.
- Real Next development pages with synthetic data and Chrome touch emulation: 320, 375, 390, 430, 768, and 1440px; Wave Mobile Money, ITM SARL — client non communiqué, and the long EU delegation name; missing images; long French titles. No horizontal page overflow; keyboard card navigation and return to the organization rendered the expected content.
- Browser interactions: follow/unfollow with confirmation, save to the real My Space UI, sharing, server-authorized external-action response opening a separate tab, expired-offer action suppression, anonymous login gate, all four profile languages, and 200% root text at 320px.
- Evidence and runnable browser checker: `C:/NIHILOBA/release-evidence/emploi-mobile-20261116/`. Fixtures live in `tests/fixtures/emploi-mobile.mjs` and are available through the existing development fixture loader only.

All authenticated writes and external destinations in browser checks were simulated; no real users were followed, saved, or messaged. Physical iOS Safari, actual OS sharing UI, and real mobile browser toolbars were not tested. No backend/API changes or migrations are required for this release.
