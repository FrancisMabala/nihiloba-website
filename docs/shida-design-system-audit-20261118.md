# SHIDA responsive design audit — 18 November 2026

**Status: evidence and proposal for review. No application changes.** The companion
[proposed canonical rules](shida-responsive-design-rules-proposal.md) are not yet
implemented or approved. This audit does not authorize a broad redesign.

## Scope and evidence

Code inspected at Website `16ce335c6450260fb4327f717d38d51936f8ff03` and
Business `a300c59febf01602e74a6472ee947aa5a8e3d603`. Website sources below are
relative to this repository. Business references mean `FrancisMabala/shida-business`
at that exact revision, inspected in `C:/NIHILOBA/next-security-business-20261117`.
The dirty primary Business checkout and unfinished work were not changed.

Key source entry points: Website [tokens](../app/globals.css),
[management navigation](../app/components/shida/management-mobile-navigation.tsx),
[Services responsive rules](../app/components/shida/services-mobile-pages.css),
[Restaurant dashboard](../app/components/shida/restaurant-today.tsx),
[Wenze dashboard styles](../app/components/shida/wenze-today-design.css),
[confirmation dialog](../app/components/shida/confirmation-dialog.tsx), and
[finance sheet](../app/components/shida/finance-sheet.tsx). Business has its own
[tokens](https://github.com/FrancisMabala/shida-business/blob/a300c59febf01602e74a6472ee947aa5a8e3d603/app/globals.css),
[management navigation](https://github.com/FrancisMabala/shida-business/blob/a300c59febf01602e74a6472ee947aa5a8e3d603/components/management-mobile-navigation.tsx),
[module registration](https://github.com/FrancisMabala/shida-business/blob/a300c59febf01602e74a6472ee947aa5a8e3d603/components/business-module-navigation.tsx), and
[selection sheet](https://github.com/FrancisMabala/shida-business/blob/a300c59febf01602e74a6472ee947aa5a8e3d603/components/selection-sheet.tsx).

This is a representative audit, not a certification of every page. It combines
source inspection with visual review of retained browser screenshots of actual
components using synthetic fixtures. These are **existing November 15–18 captures,
not newly captured live production sessions**. Generated user mockups are direction,
not evidence of implemented behavior. No live account, production write, new
browser interaction suite, backend suite, or application build was used for this
documentation task. No local preview was listening on ports 3013/3016/3017.

| Area | Implemented route / component inspected | Rendered evidence reviewed |
| --- | --- | --- |
| Wenze | `/fr/shida/seller/wenze`; `wenze-today.tsx`, `wenze-today-design.css`, `wenze-shop-design.css` under `app/components/shida` | Today at 390; online orders at 1440; November 16 fixtures |
| Restaurants | `/fr/shida/seller/restaurants`; `restaurant-today.tsx`, `restaurant-operations.css`, `restaurant-orders-list.tsx` | Today at 390/1440; Finance at 390; November 17 fixtures |
| Services | `/fr/shida/seller/services?view=work`, also `overview`, `calendar`, `available`, `proposals`; `services-management.tsx`, `services-today.tsx`, `services-mobile-pages.css` | Work and Plus at 390; November 18 production-preview fixtures |
| Business | `/businesses/[business_ref]/settings` and `/businesses/[business_ref]/wenze`; `components/organization-settings.tsx`, `wenze-today.tsx`, module navigation | Settings at 390/1280, November 16; Wenze desktop, November 15 |
| Public marketplace | `app/components/shida/public-marketplace.tsx/.css`, `app/globals.css` | Code inspection only in this audit; no fresh public-page screenshot |

### Screenshots

Unmodified copies of selected existing evidence are retained with this audit.
Full-page captures include content below the original viewport: a fixed navigation
bar appearing midway through the image is **not proof** of inaccessible content.
The Restaurant mobile capture includes a focused skip link; that is a capture
state, not an extra permanent page control. Fixture dates, amounts, names, and
counts are not production data or recommended defaults.

| Capture | What it demonstrates |
| --- | --- |
| [Services Work, 390](evidence/design-audit-20261118/services-work-390.png) | Flat colored metrics, wrapped identity, compact filters; fourth tab needs scrolling. Operational type still varies across controls. |
| [Services Plus, 390](evidence/design-audit-20261118/services-more-390.png) | Existing native-dialog sheet, identity context and destination rows. |
| [Restaurant Today, 390](evidence/design-audit-20261118/restaurant-today-390.png) / [1440](evidence/design-audit-20261118/restaurant-today-1440.png) | Same five metrics and partial failure, two-column mobile versus wide desktop; failed value is a dash, not zero; currencies stay separate. |
| [Wenze Today, 390](evidence/design-audit-20261118/wenze-today-390.png) / [orders, 1440](evidence/design-audit-20261118/wenze-orders-1440.png) | Older visible title plus local tabs, monetary card spanning columns, dense desktop table. These are different pages, not a paired comparison. |
| [Business settings, 390](evidence/design-audit-20261118/business-settings-390.png) / [1280](evidence/design-audit-20261118/business-settings-1280.png) | Compact organization switcher; larger section containers and headings; scrollable settings tabs. |

The [evidence manifest](evidence/design-audit-20261118/manifest.json) records original
paths, image dimensions, SHA-256 hashes, and capture provenance. The dates above
identify the evidence batches; older captures do not prove the current live UI is
unchanged. Business's [prior management validation report](https://github.com/FrancisMabala/shida-business/blob/a300c59febf01602e74a6472ee947aa5a8e3d603/docs/management-mobile-layout.md)
and Website's [Services release report](services-mobile-provider-20261118.md)
describe prior browser coverage. Those checks were not rerun for this audit.

## Main findings and impact

| Finding | Evidence | Practical impact / proposed response |
| --- | --- | --- |
| Shared palette exists, but semantic tokens do not govern components consistently | Both `app/globals.css` files define forest `#082d25`, cream `#f7f1e7`, gold `#b68a38`. Website `finance-sheet.css` uses `#faf7ef` / `#173c32`; navigation uses `#fbf8f1`; Services uses `--color-forest` with its own fallback. | Slightly different creams/greens and hard-to-maintain themes. Alias existing foundations into semantic tokens first; migrate component by component. |
| CSS ownership and overrides are unclear | `wenze-today-design.css` sets metric columns to four, then three, with earlier one-column mobile rules later overridden by two. `wenze-shop-design.css` repeatedly redefines identity layout. `public-marketplace.css` contains successive responsive additions. | Fixes depend on import order and specificity. Do not infer the visible result from the first matching rule. Consolidate only a pilot's verified cascade, then remove superseded rules with screenshots. |
| Breakpoints disagree across shared navigation | Website `management-mobile-navigation.tsx/.css`: desktop begins at 1024; Business counterpart: 851. FinanceSheet becomes a bottom sheet at 760; Business SelectionSheet at 600. | The same tablet width gets different navigation and overlay behavior. Propose a shared 1024 shell boundary and 768 sheet boundary, with content-based component layouts. Existing behavior remains until approved migration. |
| Density is not a shared contract | Website base `.button` is 49px high / 2px radius, Business 47px / 2px; FinanceSheet buttons use 44px / 7px; SelectionSheet trigger 44px / 8px. Business base icon control is 42px. | Target sizes and control shapes vary; base values below 44 require consumer-level checks, not an assumption that every rendered button fails. Establish minimum targets and a small radius scale. |
| Typography lacks an explicit role map | Website globals use body line-height 1.65, Business 1.5; branding and many section selectors set Georgia directly; operational controls inherit fonts in some components. Both declare Inter with system fallbacks; inspected document wrappers do not load a font themselves. | Screenshots show inconsistent control/body appearance and heading prominence. Verify computed fonts per route and OS; prescribe sans operations and serif headings without downloading a new font or changing branding. No font-loading defect is claimed. |
| Title policy is only partially implemented | Services scoped mobile CSS hides the heading while `services-management.tsx` retains a focusable `h1`; Restaurant mobile Today hides redundant heading space. Retained Wenze evidence still shows Today plus Today/Caisse tabs. | Repeated labels consume the first viewport. Use an explicit page-heading mode; do not globally hide `h1`, section headings, or task/detail titles. |
| Shared concepts have independent frontend implementations | Both frontends contain `management-mobile-navigation`, `confirmation-dialog`, `wenze-header`, marketplace-specific Today components. Business `business-module-navigation.tsx` also owns organization-scoped registration. | Visual fixes can drift or accidentally change permissions if copied wholesale. Share a token/behavior contract first; keep authorization and data adapters local. |
| States are partly strong, partly inconsistent | `restaurant-today.tsx` retains prior values with stale/error text and updates the successful-refresh time only after full success. `services-today.tsx` and `wenze-today.tsx` clear relevant values on refresh and render loading/unavailable states. | Layout flicker and different refresh experiences. Preserve valid distinctions; adopt common presentation states without changing request cadence, data eligibility, or financial meaning. |
| Focus/selected styles vary | Business globals use a translucent gold outline; Website seller workspace uses gold; FinanceSheet uses green. Navigation selected backgrounds and Services overrides differ. | Focus must remain distinguishable on every actual background. Opaque gold `#b68a38` on cream is only 2.80:1; translucent versions are weaker. Use a forest ring with a light separation gap; preserve semantic selected attributes. |
| Reflow helpers exist but lack a consistent acceptance gate | Navigation measures width and height, uses `visualViewport`, and reserves `--management-nav-space`; Services has a long-label fallback. Finance rows contain later overrides from nowrap grid to wrapped flex. | Prior fixes are valuable, but fresh device evidence is needed for browser toolbars, keyboards, text scaling, and final-row clearance. Avoid fixed padding guesses and whole-page overflow suppression. |

The code contains legacy gradients and large promotional surfaces in globals and
older page styles. Their presence is a **source-level consolidation candidate**,
not proof that every current marketplace displays a gradient. The proposed flat
surface rule applies to the pilot and future approved adoption, not an automatic
rewrite of all marketing pages.

## Existing documentation: authority and conflicts

- [design-handoff.md](design-handoff.md) explicitly describes a proposal requiring
  approval. Its generated boards and earlier menu-first concepts are not a
  canonical implemented design system.
- [public-marketplace-design.md](public-marketplace-design.md) describes an earlier
  shared hero implementation. Later compact page corrections must be considered;
  neither an old document nor a screenshot alone overrides current user direction.
- [Services mobile release](services-mobile-provider-20261118.md), Business
  `docs/organization-mobile-20261116.md`, `docs/management-mobile-layout.md`, and
  `docs/responsive-cards-20261115.md` are scoped delivery records, not universal rules.
  The responsive-cards report explicitly limits Business browser verification.
- The new proposal is a prospective common contract. Keep historical documents
  intact; after approval add supersession links for presentation rules only.

## Reuse and consolidation priorities

| Keep / evolve | Boundary to preserve |
| --- | --- |
| Existing SHIDA headers, account controls, `BusinessIdentity` / `BusinessSidebar` in `connected-business-workspace.tsx` | Real names/photos, language/account access, capability-gated fullscreen, organization switch and session context. |
| `ManagementMobileNavigation` in both frontends | Width/height measurement, selected nested destination, leave guards, focus return, all authorized destinations. Business module registration must not become a hard-coded universal menu. |
| `ConfirmationDialog` / `useConfirmation` | Native dialog, safe initial focus, in-flight lock, rejected promises retaining errors, conflict wording, four locales, severity. This is stronger than ad hoc `confirm()` or inline cancellation forms. |
| Website `FinanceSheet`; Business `SelectionSheet` | Shared overlay mechanics are candidates; finance content, search/options, manual-entry permissions, and confirmation semantics remain specialized. Do not replace native selects everywhere. |
| Existing summary cards, status badges, list/field wrappers | Extract presentation primitives after the pilot proves API shape. Metric definitions, category vocabulary, currency formatting and read-state logic stay in their current models. |
| Existing icon families | Normalize slot size/stroke use within each component, not a mass icon replacement. Keep marketplace-specific meaning and established branding. |

## Recommended first adoption

Pilot **Website Services → Demandes et missions**,
`/fr/shida/seller/services?view=work`, with its desktop equivalent and all four
locales. It covers colored summaries, filters, responsive lists, long labels,
native navigation sheet, state feedback and permission-sensitive actions. Existing
focused tests provide useful protection. Restaurant Today supplies the approved
colorful-dashboard direction; it is not a template to copy all fields from.

Review desktop and mobile screenshots together before expanding. Then port the
contract to Business Services with its team/organization adapter, followed by
Restaurant orders/Today and Wenze orders/Today. Finance, forms, calendars and
public marketplaces follow separately because their data density and task
requirements differ. Full rollout gates and exceptions are in the proposal.

## Audit validation and limitations

- Inspected source, historical documents, representative screenshot files, and
  current checkout SHAs; compared shared token, navigation, overlay and state code.
- Calculated proposed color-pair contrast from sRGB relative luminance; values are
  in the rules document. This is not a rendered accessibility certification.
- Documentation link/file checks and `git diff --check` are the relevant checks
  for this change. No application source, dependencies, routes or API changed.
- No fresh interactive desktop/mobile pass, computed-style inventory across all
  routes, screen-reader session, physical iOS Safari/Android keyboard test, or
  live authenticated Business verification was performed. Older screenshot
  findings require current-page confirmation during the pilot.
- No push or deployment is part of this audit. The proposed rules are local
  documentation only, even though some individual patterns already exist.
