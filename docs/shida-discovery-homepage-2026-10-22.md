# SHIDA discovery homepage — 22 October 2026

## Implemented

`/shida/` now starts with a compact, public discovery area, a marketplace-aware GET search, city suggestions with free-text city support, and seven marketplace entries. École and Business are separate entries with original hand-authored inline SVG illustrations. No image-generation service or new dependency is used.

Search uses the existing `query` and `city` parameters for Jobs, Services, Wenze, Apartments, Hotels and Restaurants. `/shida/find/` accepts only those destinations, trims input to 120 characters, discards unknown parameters, and returns a relative, no-store redirect compatible with the existing same-origin form CSP. Transport is an informational entry and is intentionally not offered as searchable inventory. Search works without JavaScript.

The server-rendered feed requests the first three public Jobs and Services records concurrently through the existing allowlisted public client. It retains backend ordering, visibility and eligibility rules, and does not claim a unified chronological ranking across all marketplaces. Service cards reuse the existing component, safe image handling, prices/currencies and public location presentation. Job cards link to the existing details and show employer, broad location and publication date; compensation and transaction actions remain on the detail page. Each source has its own empty/error state. Suspense provides a localized loading state. No invented inventory, contacts or ratings are added.

The complete existing illustrated story and its EN/FR copy are preserved in `shida-story-page.tsx`, at `/about/shida/` and `/fr/about/shida/`. The homepage links to the story. Existing homepage fragment IDs still lead to corresponding marketplace or organisation entries. Story routes have separate canonical metadata and sitemap entries.

## Accounts and languages

The shared PublicShidaAccount, browser-bound WhatsApp login, Personal space and Business Dashboard remain the account authorities. The homepage includes the existing WhatsApp account entry and links directly to `https://business.nihiloba.com`; no organisation is selected, created or authorized by this link. School operations use that same dashboard. The public École entry accurately describes the offering; no school directory or public school profiles are fabricated.

Homepage copy, canonical metadata, language controls, empty/loading/error states and service cards support EN/FR/LN/SW. Existing Jobs, property and Transport interfaces remain EN/FR; LN/SW discovery links use their supported French destinations, with the search limitation explained in the homepage copy. The old story remains in its existing EN/FR translations. No marketplace translation or account architecture is rebuilt in this phase.

## Audit and scope

Inspected the website homepage, shared header/account controls, route parsers, existing listing components and public client; Backend public marketplace/job projection and ordering; and Business SessionHome/context entry. All code changes are in the website. No Backend/Business source change, environment variable, database access, migration or deployment configuration change is required. Work was isolated from the dirty primary checkout at current origin/main.

Main files: `app/components/pages/shida-page.tsx`, `shida-discovery-listings.tsx`, `shida-discovery.css`, `discovery-illustration.tsx`, `shida-story-page.tsx`; `app/lib/discovery-{copy,search,metadata}.ts`; homepage/story/search routes; narrow header/language-control changes; sitemap; tests.

## Verification and current limitations

- Node 24.19.0; production `next build` including TypeScript passed. A preliminary build failed because Turbopack rejected an out-of-root dependency junction; replacing it with a local dependency copy resolved this without changing application configuration.
- 111 focused unit tests passed. Targeted ESLint and final typecheck passed. Unit regressions cover search safety and proxy redirects, all four locales, published service rendering/privacy, independent feed failures, preserved storytelling, public parsing, safe URLs, jobs/services, and existing login behavior.
- All 16 homepage language/viewport combinations passed, together with search submission, story-route and guest/Personal navigation checks. All 10 existing WhatsApp login browser regressions passed (code verification, invalid code, sign-out, cancellation, account change, expiration and failure recovery). Browser review covers 320, 390, 820 and 1440 px in all four languages, search navigation, preserved story routes, guest/Personal controls, the existing Business destination, and horizontal overflow. Evidence is in `docs/evidence/discovery-home/`; `verification.json` records the matrix.
- The existing live Jobs response currently fails the website's strict employer-reference parser (`jobEmployer` receives a missing required public reference). The existing API returns HTTP 200 but the client correctly rejects that payload. This pre-existing mismatch is not bypassed. Jobs display a localized recoverable error, while public Services display normally. Repairing the shared Jobs contract is a follow-up.
- No real production account was used to sign in or change organisation. Login transitions are exercised with isolated browser fixtures. A physical WhatsApp/mobile handoff and a signed-in Business organisation session were not exercised.
- The public school directory, full cross-marketplace aggregation, additional marketplace languages, and marketplace/dashboard redesigns remain follow-up phases.

## Release

Render inspection during the Jobs follow-up found automatic deployment disabled after a previous commit-specific deploy. A push to main alone does not deploy this service: manually deploy the validated commit while preserving this setting. No migration or new setting is needed. Verify the pushed commit against remote main and correlate Render's live commit with the public page.

The Jobs parser limitation described above is resolved by the follow-up in `shida-jobs-contract-2026-10-22.md`: anonymous individual employers are a legitimate backend contract, and their job records can now render without inventing public employer profiles.
