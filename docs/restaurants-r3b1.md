# Restaurant R3B.1 — NIHILOBA public integration

Date: 2026-09-09. Status: local website implementation; browser/device and live acceptance remain outstanding. No deployment or production data changes.

## Authority and inspected baseline

Read the website AGENTS.md and installed Next.js Server/Client Component guidance. Inspected Backend AGENTS.md, Business layer/module contract/index, `restaurants_malewa.md` v1.2, and Restaurant reports R0-A, R1, R1-B, R2-A, R2-B, R3A.1, R3A.3 and R3A.2 including stable verification at `3dc64ba`.

Backend checkout inspected: `e02d4f8` (stable-verification report follow-up). `git diff 3dc64ba HEAD -- app` is empty. Actual route/service sources, rather than proposed canonical mappings, determine this adapter. No Backend file was edited, no database was accessed and no backend regression/transaction/migration suite was rerun.

The documented Backend stable full-suite baseline is **3924 passed, 70 failed, 365 skipped**. This is inherited evidence, not a new run or a fully passing suite. Existing Employment, Services, Hotels and migration failures remain. R3B.1 changes no authorization, grants, schema, business eligibility or concurrency policy.

## Existing versus connected behavior

The website already provided EN/FR marketplace routing, shared site chrome, media allowlisting, server-side API requests, safe WhatsApp continuation URLs and Business-independent marketplace pages. It had no Restaurant or public Business profile pages. The backend already provided all read and handoff contracts required here; no parallel API was introduced.

New public routes:

- `/shida/restaurants/`: discovery with query, name, city, area, food type, declared service mode, dish, backend-authoritative open-now filter and pagination.
- `/shida/restaurants/{reference-or-slug}/`: establishment, current menu, hours, public location, owner and supported Personal continuations.
- `/shida/restaurants/{reference-or-slug}/menu/`: independently addressable paginated menu. The website resolves a slug to the canonical establishment reference before requesting the menu.
- `/shida/businesses/{public_ref}/`: actual owning Business identity and paginated eligible activities.

All four route families support `/fr`, `/ln` and `/sw` prefixes, with English at the unprefixed route. Restaurant-specific copy and language switching cover EN/FR/LN/SW. Shared site chrome remains the existing EN/FR implementation; LN/SW use correctly language-tagged French chrome, and other marketplace activity destinations use existing EN/FR routes. Native-speaker review is still required, especially LN/SW. This is not full-site four-language localization.

The SHIDA gateway now includes Restaurants & Malewa. Sitemap additions cover only the four collection routes; no cached Restaurant/Business identities or menu snapshots are enumerated. Detail metadata uses the resolved public reference and generic copy, not raw slugs/private fields. Detail pages are conservatively noindex/follow pending release acceptance.

## Actual backend contracts

All paths below are relative to the existing `SHIDA_API_BASE_URL` (default `https://api.nihiloba.com`). Every request uses the shared timeout/error handling and `cache: no-store` without account cookies/credentials.

| Endpoint | Website use |
| --- | --- |
| `GET /api/public/shida/restaurants` | Supported filters; `language`, `page`; backend page size/count/total and declared service-mode options |
| `GET /api/public/shida/restaurants/{ref_or_slug}` | Explicit safe projection, exact owning Business, public location, menu availability counts, images and authoritative hours |
| `GET /api/public/shida/restaurants/{RST}/menu` | Category/item projection; exact prices; current dated availability; backend hours; page/total |
| `GET /api/public/shida/businesses/{public_ref}` | Public identity and included paginated activities; no Dashboard data needed |
| `GET /api/public/shida/entity-actions/restaurant/{RST}` | Exact save/follow links; establishment/menu `/go` destinations, only when returned and safe |

Business activity adapters are exactly the released `restaurants`, `services`, `wenze`, `jobs` set. They route to existing resource pages using public references, not display names. No hotels or merely activated/private modules are invented. Null-Organization establishments remain viewable without a fabricated owner link.

Save and Follow open the returned establishment-specific SHIDA continuation in a new tab with `noopener noreferrer`; no local saved/followed account state or implied marketing consent is created. The backend remains responsible for Personal onboarding, target revalidation and explicit confirmation. Public Restaurant reporting has **no HTTP submission endpoint**: the website opens the exact establishment using `share_url` and instructs the customer to select Report inside WhatsApp. `menu_share_url` remains the released generic menu/QR destination. No raw WhatsApp number or token is manufactured, decoded, logged or retargeted.

No new browser authentication endpoint or return parameter was invented. Completion after authentication is the existing WhatsApp exact-establishment journey, not a claim of a verified browser-to-browser login return.

## Presentation and privacy

- Fixed dishes and components retain separate labels. `UNIT_PRICED` shows exact decimal unit price/currency/sale unit. `AMOUNT_PRICED` shows configured monetary choices and optional minimum, never an invented quantity/plate total. Unknown prices remain unknown. No floating-point conversion or currency conversion.
- Current dated offerings and effective sold-out/temporarily-unavailable states are rendered from the server. The browser calculates neither open-now nor expiry. Schedule windows, exceptional closures, timezone and evaluated timestamp are visible.
- Every public navigation is a fresh document request; no prefetch-based detail cache. A small client hook refreshes on foreground return and persisted history restoration. Rendered information remains a checked snapshot, not a food guarantee.
- Explicit DTO allowlists exclude raw private addresses, internal IDs, contacts, reporter evidence, actor state and restriction reasons. Exact venue address/landmark requires `address_visibility=public`. Media uses the existing Cloudinary allowlist and lazy image fallback.
- Menu responses must match the exact establishment. Hidden category/item or non-current offering responses fail safely. A menu/action 404 after detail resolution withdraws the detail rather than retaining a stale parent.
- Query context contains only supported public search keys. Back links retain filters/page plus the establishment anchor. No arbitrary external return URL is accepted.
- Native form labels, focus styling, 44px controls, responsive one/two/three-column layouts, long-label wrapping and absent-photo states are implemented. Their actual visual/keyboard behavior is not browser-verified in this session.
- Reviews, ratings, responses, composer/cart/ordering, payment, Dashboard, management and inferred delivery coverage are absent.

## Files

- `app/services/shida/restaurants-client.ts`: typed allowlist adapters and query normalization; shared `public-client.ts` exports its existing request function.
- `app/components/shida/restaurants.tsx`: discovery/detail/menu/Business rendering, metadata and error states.
- `app/components/shida/restaurant-revalidation.tsx`: foreground/history revalidation only.
- `app/lib/restaurant-i18n.ts`: Restaurant-specific four-language copy and safe route/context helpers.
- New route and loading files below `app/(default)/shida/{restaurants,businesses}` and `app/(localized)/[lang]/shida/{restaurants,businesses}`.
- Localized layout/site document/header/footer: language boundary and correct chrome language tags; no structural redesign.
- `marketplace.tsx`, `globals.css`, `sitemap.ts`: entry link, scoped responsive styling, collection discovery.
- `tests/restaurants-marketplace.test.tsx`, synthetic `tests/fixtures/restaurants.mjs`, updated homepage gateway expectation.
- `scripts/restaurants-fixture-fetch.mjs`, `scripts/restaurants-smoke.mjs`: opt-in, process-local production-server fixtures; external network disabled, no user data, no deployment imports.

## Verification

- `npm run test`: **177 passed, 19 files** (13 Restaurant tests). Includes DTO privacy, exact/mismatched actions, no-store, bounded query context, unit/amount/unknown prices, hidden/expired payload rejection, current status/closures, return anchors, missing targets and four-language empty states.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed. Static generation printed an outbound-fetch `EACCES` under the sandbox; it remained non-fatal. Restaurant routes are dynamic and were not prebuilt from live data.
- `node scripts/restaurants-smoke.mjs`: **17 production HTTP journeys passed** using a loopback Next server with process-local synthetic API responses. Covers list/page 2, detail/back URL, menu price/availability states, Business-to-Restaurant links, FR/LN/SW routes, empty/error and unavailable targets; asserts no private sentinel fields and no-store on successful responses. This does not execute browser clicks or hydration.
- `git diff --check`: passed (Git emits existing Windows line-ending conversion notices).

Development failures were corrected rather than suppressed: homepage expected five links before adding the sixth; smoke preload needed a Windows file URL; streaming HTML comments required text normalization in assertions; server-component tests needed a mocked Next router after adding revalidation.

**Actual browser journeys performed: none.** Browser discovery returned no browsers and selecting one returned `No browser is available`. Thus mobile/tablet/desktop visual verification, keyboard/form interaction, scroll restoration, hydrated foreground refresh and native-device QR scanning remain unverified. No authenticated test-recipient/Meta environment was used; no real save, follow, report, authentication or message was submitted. HTTP fixtures are not live-backend lifecycle or expiry verification. Other-module activity destination rendering remains covered only by existing frontend tests, not new cross-module browser journeys.

## Rollout and remaining acceptance

No migrations, backfill, environment-variable additions, dependencies, production records or ownership changes. Deploy only against the compatible R3A.2 backend/schema (`0065` and its timezone dependency) with the existing valid WhatsApp recipient configuration. Without returned continuation links, the website shows no working-looking Personal controls. Keep fixture mode/scripts out of deployment commands.

Local Node was v22.12.0; the repository declares >=22.13.0. Use the declared supported runtime in CI/Render and repeat acceptance there. No runtime requirement was relaxed.

Before release, execute the requested browser journey matrix at common phone/tablet/desktop sizes against an isolated real backend, including same/different Business names, legacy ownership, all four activity types, expired/sold-out items, unknown/closed hours, suspended/direct targets, auth continuation and menu QR. Obtain native-language review and confirm no caching layer overrides no-store.

Dashboard integration, OPEN-05 review policy, delegated establishment access, missing instrumentation and remaining release acceptance are still open. The next bounded step is R3B.1 browser/live-integration acceptance with test recipients and an available browser, not ordering or a Dashboard expansion. No complete canonical R3/public-release claim, Git commit or deployment is made.

Suggested commit: `feat(restaurants): integrate public discovery menus and Business profiles`
