# SHIDA UX refinement — 28 October 2026

## Scope and release state

Incremental refinement of the existing SHIDA website and shared Business Dashboard. The original brand, marketplace structure, Personal/Business account boundary, WhatsApp authentication, transaction rules and École module are retained. No backend, schema, permissions, production data, dependencies or deployment configuration changed.

Work is isolated from the original dirty checkouts and unfinished École work:

- `FrancisMabala/nihiloba-website`: `ux/refinement-20261028`, based on `a01cf5e`.
- `FrancisMabala/shida-business`: `ux/refinement-20261028`, based on `93bd933`.
- Local review only. No push or deployment has been performed for this work. Production is unchanged by this task.

## Audit and implemented improvements

Severity: High = blocks or misdirects a core journey; Medium = avoidable confusion or accessibility friction.

| Severity | Confirmed issue and affected area | Refinement |
| --- | --- | --- |
| High | Wenze product/shop cards trusted the API's locale-bearing URL. A French catalogue could link to an English detail page. Cart item links had the same problem. | Normalize safe public destinations to the visitor's current language, including `products`/`produits`. Preserve cart item return language. |
| High | Mobile global menu hardcoded French cart URLs for Lingala and Swahili. Product purchase controls also coerced these languages to French. | Reuse the existing localized cart path and all four cart translations; preserve the locale through variant selection and purchase actions. |
| Medium | The home-to-Business link omitted language. Business and Wenze restored separate browser preferences. | Pass an explicit allowlisted language in the handoff, retain it in Business preferences, and pass it to Wenze. No session or permission state is transferred by this parameter. |
| Medium | Empty Wenze cart received equal visual emphasis on Jobs, Services and other non-product pages. | Keep the cart directly reachable, but use a quieter icon/count treatment outside Wenze. A populated cart becomes prominent anywhere. |
| Medium | Mobile `Explorer` overlapped with home; `Activités` did not identify whose activity. The menu listed two links to the same account-settings destination. | Use `Marchés` and `Mon activité` in French (`Markets` and `My activity` in English); preserve the existing destinations and remove the duplicate settings entry. |
| High | Wenze price, stock and variant-option criteria could be active while the filter panel remained collapsed with no visible summary. Category selection was inside advanced controls. | Show category directly, keep secondary controls in the existing disclosure, add a submit button beside them, and show removable, readable active criteria. |
| Medium | Services, Apartments, Hotels, Jobs and Restaurants lacked a consistent visible summary with individual filter removal. Hotels required returning to the top search action after advanced edits. | Reuse a small server-rendered filter-summary component with marketplace-specific labels and values. Remove one criterion or clear all without losing shop/view context; reset pagination. Add an advanced-filter submit action for Hotels. |
| High | Wenze seller editors appeared later in the document without a focus or scroll transition, in both Personal and Business workspaces. | On opening/changing editor kind or product, focus and scroll to the editor heading. Typing does not repeatedly move focus. Keep the existing inline editor and unsaved-work safeguards. |
| High | Selecting a Business service could leave its editor below a long list on mobile. | Bring the selected/new service editor heading into view and focus it after the explicit action. Initial page loading does not steal focus. |
| Medium | Business sidebar showed Services/Wenze as non-interactive labels even where a usable management screen existed; École had no direct sidebar entry. | Link the existing available screens using the existing context, role and capability checks. Modules with no implemented management destination remain informational. École stays in the shared dashboard. |
| High | Business mobile sidebar was translated offscreen without hiding its focusable controls. Its open state lacked modal focus containment/Escape handling and a bounded scrolling strategy. | Hide/inert the closed mobile sidebar, focus the close control when opened, contain Tab/Shift+Tab, support Escape and focus return, inert the background, and allow scrolling on short screens. Close the drawer after choosing a context. |

## Coverage and deliberate preservation

| Area | Reviewed behavior |
| --- | --- |
| SHIDA home and all seven marketplaces | Public entry, navigation, search/empty states, contextual cart, phone/tablet/desktop overflow. Transport remains its existing WhatsApp continuation; no fictional vehicle tracking or confirmed booking UI was introduced. |
| Wenze | Category and advanced search, individual filter removal, product links, variants, cart, delivery/pickup selection, retry/confirmation, order tracking link, seller product creation/editing and draft protection. |
| Services | Existing category/location/rating distinctions retained. Public search, personal management, Business catalogue, messages/share controls and editor visibility checked. |
| Restaurants/Malewa | Existing establishment/type/dish/open-now/service-mode filtering and order workflows retained. Personal selection/grouped tools and Business overview checked. |
| Apartments and Hotels | Property/room/rental-period criteria remain distinct. Existing hotel availability caveat retained. |
| Personal account | Existing WhatsApp code flow, sign-in/out, pending/expired/error states, activity, requests, management and access-denied behavior checked with fixtures. |
| Business and École | Existing account/context model and capability gates retained. No unfinished school work imported or school data mutated. Only the existing École destination is made discoverable. |
| Payment and information | Existing checkout explicitly says placing an order is not a payment and payment is arranged with the seller. No planned integration was promoted to an operational method. Existing management money/date formatting and public order references were preserved. |

## Validation

All browser actions used local synthetic fixtures. No WhatsApp message, production order or production account edit was made. Browser automation is not real-person usability testing.

- Production builds succeeded for both repositories with Node 24.22.1.
- TypeScript checks passed for both repositories.
- Changed-file ESLint checks passed with only existing warnings. Full lint remains blocked by existing React-effect lint errors: four in website restaurant components and two in Business restaurant components, reproduced on unchanged main.
- Website unit suite: 655 passing, eight failures reproduced on unchanged main (baseline: 649 passing, the same eight failures). The six added filter/routing tests pass. Intentional changes to reset labels, link localization and current UI assertions are covered by updated tests.
- Business unit suite: 813 passing, five failures reproduced on unchanged main (baseline: 812 passing). The added language-handoff test passes. Existing failures concern a school export fixture, ambiguous context-selector queries, a missing `matchMedia` test mock and a receipt-byte expectation.
- Production browser checks cover 320/390 px phones, 820 px tablet and 1366/1440 px desktop, plus existing checkout widths. Checks include document overflow, keyboard menu behavior, editor focus/visibility, unsaved edits, locale persistence, filter removal, authentication and checkout retries.
- Final production browser suites: website 62/62 passing; Business 27/27 passing. The four Business menu checks also passed after waiting for the slide animation before capturing evidence. Local commit IDs are recorded in the completion report in this chat. Raw run logs remain in the local checkouts (`ux-*.log`, ignored by Git).

## Visual evidence

These screenshots use synthetic products and local fixture servers; they do not represent live customer data. Before images come from unchanged `a01cf5e`, after images from the refined production build.

| Comparison | Before | After |
| --- | --- | --- |
| Wenze, 390 px: hidden price/stock criteria, then visible summaries | [Before](evidence/ux-refinement-20261028/before-wenze-390.png) | [After](evidence/ux-refinement-20261028/after-wenze-390.png) |
| Jobs, 390 px: contextual cart and clearer bottom labels | [Before](evidence/ux-refinement-20261028/before-emplois-390.png) | [After](evidence/ux-refinement-20261028/after-emplois-390.png) |
| Wenze, desktop | [Before](evidence/ux-refinement-20261028/before-wenze-1440.png) | [After](evidence/ux-refinement-20261028/after-wenze-1440.png) |

Business evidence is in that repository's `docs/evidence/ux-refinement-20261028/business-menu-{320,390,820,1440}.png`.

## Limitations and remaining work

- Full repository suites and lint are not green because of the reproduced baseline failures listed above; these were not hidden, skipped or converted into claimed passes.
- No real WhatsApp delivery, real payment, production backend integration, live account permissions audit or human usability session was performed. Synthetic tests verify frontend behavior and existing contracts.
- Responsive emulation in Chrome does not establish complete WCAG 2.2 AA compliance, screen-reader compatibility, or behavior on every Android device/network. Focus, visible controls and tested viewport overflow were checked; a full accessibility certification was not performed.
- Some older secondary Lingala/Swahili Wenze content still falls back to French/English (for example buyer relationship/review copy). This pass fixes the identified route/purchase-language failures, but is not a complete translation rewrite.
- Existing Jobs/Properties Business summary entries do not gain speculative new management screens. Transport retains its existing WhatsApp-only scope. No new sorting, payment or other backend capability was invented.
- Deployment approval remains pending. Both repository changes should be reviewed together because public Business language links and Business language restoration complement each other.

## Reproduce the local website checks

Use Node >=22.13, `npm ci`, `npm run build`, and `npm run typecheck`. For the isolated public fixture server, run in PowerShell:

```powershell
$env:SERVICES_FIXTURE_MODE='1'
$env:SHIDA_API_BASE_URL="https://services-$([guid]::NewGuid()).fixture.invalid"
node --import ./scripts/ux-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3054
```

In a second terminal run `npx playwright test -c playwright.ux-refinement.config.ts`. The fixture import rejects non-isolated configuration and prevents external API requests. The browser suite mocks private APIs. Run `node scripts/ux-screenshots.mjs after` for public comparison screenshots. The Business report provides its separate reproduction command.