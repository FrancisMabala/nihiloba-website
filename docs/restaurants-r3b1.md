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

## R3B.2 — bounded follow-up (2026-09-09)

Status: independent review and bounded fixes completed; **browser/mobile acceptance BLOCKED**, not verified. This section supersedes the verification status only where explicitly stated. The initial worktree was clean; the existing R3B.1 implementation was retained.

### Browser availability and scenario coverage

Browser discovery returned `apps: [], browsers: []`; selecting a browser for the isolated localhost Restaurant journey returned `No browser is available`. No browser controls were exercised. Per the R3B.2 boundary, no additional HTTP journeys were substituted for browser acceptance, and the historical R3B.1 HTTP checks above are not upgraded to browser evidence.

All requested browser scenarios remain blocked: discovery with combined filters/pagination; detail/menu/Back; Business and activity destinations; unit/amount/unknown prices; sold-out/expired/unknown hours; absent images/menu; unavailable targets; save/follow authentication; WhatsApp reporting; direct/menu/QR entry. No live WhatsApp links were followed, messages sent, production mutations performed, or deployment initiated.

Representative 390px phone, 768px tablet and 1440px desktop checks remain to be performed. Actual focus order, keyboard activation, viewport overflow, image rendering, loading transitions, refresh-on-return and scroll restoration are unverified. Source review confirms existing 600/1050px layout breakpoints, minmax columns, wrapping, labeled form inputs, native controls, focus-visible styling and 44px action sizing; these observations are not visual/accessibility acceptance.

### Demonstrated defects corrected

1. Detail-load failure previously offered a collection link as “Try again,” losing the chosen establishment. Menu-load failure rebuilt a retry URL without the current menu page. A narrow client `RestaurantRetry` now reloads the exact current document, retaining route/query/position while avoiding echoing potentially private legacy slugs into rendered markup. No token or identity state is added.
2. A photo-less card's image link was named only “No photo available.” Its accessible name now identifies the action and actual establishment using existing localized labels.
3. Following a Restaurant activity from the Business profile dropped the originating filtered-result context. That link now carries the already-normalized `back` query.
4. The shared French skip link on LN/SW documents lacked its own language annotation. It now declares the actual chrome language, like the existing header/footer. This fixes the language annotation, not the missing translation.

Changed files: `app/components/shida/restaurants.tsx`, new `restaurant-retry.tsx`, `app/components/site-document.tsx`, `tests/restaurants-marketplace.test.tsx`, and this report. No CSS/layout redesign, backend changes, dependencies, schema, grants, identity endpoints or feature expansion.

### Localization coverage and remaining gaps

EN/FR/LN/SW Restaurant route/copy mapping and context-preserving local language links were inspected; existing four-language render tests passed. This is **partial LN/SW coverage**, not complete support. Header/footer, skip-link text, cart chrome and linked non-Restaurant marketplaces still use French fallback for LN/SW. Lingala weekday labels remain French; generic not-found/loading presentation and native-speaker review also need attention. The Restaurant-specific language switch remains separate from the EN/FR chrome switch. A broader shared-localization batch must address these essential navigation translations explicitly; no site-wide rewrite was attempted here.

### Exact build warning investigation

A temporary Node fetch wrapper was used during `npm run build` to log only failed origin/path/error code, omitting queries, credentials, bodies and headers, then rethrow unchanged. It was removed after diagnosis; no diagnostic logging or suppression remains in the application.

The reproduced raw warning was `TypeError: fetch failed`, caused by `connect EACCES 216.24.57.7:443`. The trace identified failed `https://api.nihiloba.com/api/public/shida/hotels` requests during static generation. Other denied build requests were `/api/public/shida/apartments`, `/services`, `/wenze/stores`, and `/jobs`; Next's separate `https://telemetry.nextjs.org/api/v1/record` calls were also sandbox-denied. No Restaurant endpoint was fetched during this build.

Source chain: `public-client.ts:getHotels()` requests the Hotels collection with `revalidate: 60`; default/localized hotel collection pages use that function during prerendering. `HotelCollectionPage` catches the shared unavailable error and renders the existing unavailable state. `sitemap.ts` also requests Hotels and other marketplaces, catching failures and retaining static routes. The installed Next fetch implementation includes a pending-revalidation `catch(console.error)` path, so application error handling does not imply every framework fetch warning is silent. No framework file was changed.

The observed failure is an environment-denied build-time connection, not a demonstrated Restaurant parser or rendering defect. In an affected build, Hotels may use an existing cached response or render unavailable, and dynamically enumerated sitemap entries can be absent. Restaurant pages remain request-time/no-store. If production also cannot reach the API, backend-backed functionality would likewise fail; the build warning alone cannot prove production API health. The user's supplied Render log showed a successful build/start and no corresponding warning, but live data behavior was not tested here. No warning was suppressed, security restriction weakened or caching policy changed.

### Final checks and stop boundary

- `npm run test`: **180 passed, 19 files**, including 16 Restaurant cases. Three new tests cover exact-document retry wiring, named photo-less links and Business activity return context. These are unit/server-render checks, not browser interaction.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run build`: passed on the final application state; the separate traced diagnostic build also passed despite sandbox-denied fetches.
- `git diff --check`: passed, with Windows line-ending notices only.

No backend regression/migration tests were needed or run because no backend code changed. The inherited 70-failure backend baseline remains as recorded above, not a passing suite. Local Node remains below the declared >=22.13.0 requirement; repeat acceptance on the supported CI/runtime.

Next bounded step: supply an available browser and isolated backend/test-recipient environment, then execute the blocked scenario/viewport matrix and native-language review. Dashboard, OPEN-05/reviews, delegated access, instrumentation, ordering and deployment remain excluded. R3B.2 does not establish public-release acceptance.

Suggested commit: `fix(restaurants): preserve retry context and improve accessible navigation`
