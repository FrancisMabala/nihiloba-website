# SHIDA responsive presentation rollout — 18 November 2026

## Scope and status

Local implementation and review evidence; no push or deployment authorized for this rollout.
Website baseline: `d972a58d` (bounded Services pilot). Business baseline: `a300c59`.
The clean release/security worktrees were reused. Primary repositories and unfinished
School work were not modified. No dependencies, endpoints, accounting, permissions,
translations, polling or lifecycle rules were added or changed.

## Adopted presentation

- Identical shared token/adapter files in both repositories: cream/forest identity,
  existing sans/serif stacks, 44px targets, readable fields, flat summary variants,
  spacing/radii, focus outline and reduced-motion behavior.
- Explicit management root opt-in. Website Wenze, Restaurants and all Services views;
  Business AppShell consumers. Public/account pages inherit foundation tokens and
  keyboard focus, retaining visible titles and their existing layout.
- Business CSS and matchMedia now agree with Website at 1024px. Existing permission-aware
  navigation, measured overflow, dirty-form guard, safe-area padding and keyboard
  clearance remain intact, including released School/Employment shell consumers.
- Plus sheets center at 768px and above and dock below; finance/selection sheet
  boundaries agree. Native dialog focus, Escape, back handling and scroll locks remain.
- Existing dashboard cards receive semantic flat color variants without altering data.
  Business Services activity keeps its separate model and permission checks.
- Heading visibility is an explicit component/page choice. Redundant Services/Wenze
  management headings are accessible-only at both sizes; actions/identity remain visible.
  Shared headings focus on changed accessible destinations. Public/detail/edit/settings
  and identity headings remain visible. Website Wenze fullscreen moves into its existing
  secondary options pattern without a reserved page-title row.
- Services empty sections lose excessive padding; Business's decorative Services banner
  becomes compact. Useful section labels and activity messages are retained.

## Deliberate boundaries

This is wider shared-component adoption, not a claim that every bespoke page is converted.
Calendar grids, counter sales, financial tables, receipt/print documents, confirmations,
organization setup and specialist education flows retain their existing structures.
Do not hide their fields or force a general list-card layout onto them. Remaining
module-specific headings and form/table composition need individual review against the
contract. Public marketplace and account pages have no new content/layout redesign.

## Validation and evidence

Paired screenshots use the same synthetic fixtures, locale, filters, fixed clock and
390×900 / 1440×900 CSS viewports. Sources: `tests/browser/responsive-rollout-fixtures.ts`
and the existing checkout/work fixtures. No production API is used.

Production builds (`next build --webpack`) and TypeScript passed for both projects.
Webpack is required by this reused local dependency layout: Turbopack cannot resolve
Next through the dependency junction outside its project root. No dependency install
or build configuration change was made.

- Website build: `tAvu-89L-_aN0UtYBSMFu`; Business build: `9x4Li2DaHQZJUwM0AnvSw`.
  Both loopback previews were verified by project command line and HTTP page identity.
- Unit checks: Website 7 tests / 3 files; Business 29 tests / 5 files, including
  accessible heading focus and preservation of adjacent actions.
- Lint: no errors. Website retains three existing warnings (two Services hook
  dependencies and one unused `_hint`); Business has no warnings.
- Website rollout browser checks: 13 passed. Wenze, Restaurant and Services in
  FR/EN/LN/SW at 320, 390, 767, 768, 820, 1023, 1024 and 1440px; 200% root text;
  Plus geometry/Escape/focus and public heading/focus regression.
- Business rollout browser checks: 4 passed, each exercising Services, Wenze,
  Restaurant and Employment across the same eight widths and 200% text.
- Business focused browser regressions: 19 passed (mixed activity in four locales
  at mobile/desktop, direct requests, truthful loading/error/retry, Wenze navigation
  and business switching, School permission clearing, organization selection sheets
  including 767/768px). Two French activity captures were rerun against the final build.
- Website focused regressions: 78 distinct tests passed across the initial and affected
  reruns (42 Services/shop/cost checks plus 35 expense/finance-navigation checks and the
  additional 767px cost-detail edge case).
  A further 767px cost-detail edge check found the old JavaScript 760px cutoff; it is
  now aligned with CSS at 767px. All 9 affected cost checks passed on the final
  rebuilt preview, including 767/768px, editing, permissions, history, focus and scroll
  restoration. The three French paired-page checks were also rerun on that build.

Computed CSS retains the existing sans stack. Chrome's platform-font evidence reports
**Segoe UI Semibold** for sampled mobile navigation and **Arial** for retained
Business desktop sidebar text. These component-specific fallbacks are not newly
installed Inter fonts. The after-state JSON files record computed values and actual
rendered fonts; the existing typography dependencies remain unchanged.

Four real integration conflicts were corrected during validation: legacy padding
inflated accessible-only headers, a Services section action did not shrink at 200%
French text, and a legacy Wenze attention grid squeezed enlarged Swahili labels.
A fourth mismatch between the purchase-cost CSS and JavaScript breakpoints was
aligned at 767px. The fixes address flow, sizing and boundary agreement, not negative offsets.

Business paired Services screenshots intentionally show the same restricted-capability
Today fallback in both revisions; they are not evidence of a populated work view.
Separate `after-work-mixed-fr-*` screenshots and interaction assertions verify the
permitted populated work view, hidden redundant heading, and destination content.

Physical phones, Safari, real virtual keyboards and browser toolbar animations are not
verified by Chromium emulation. Existing viewport/keyboard simulations are reported
separately. No full backend suite is run.

## Reuse and ownership

`shida-presentation.css` and `shida-responsive.css` are mirrored without a new package.
Review their byte parity before changes in either repository; module adapters remain
local because their data/permissions differ. The original Services pilot adapter remains
scoped to Services and work-table selectors. This avoids changing other modules' tables.

Temporary output uses unique OS-temp directories. Compatible shared node_modules links
are preserved. Required paired screenshots are retained; builds remain disposable only
once preview processes are stopped. Do not remove shared dependencies or worktrees.

## Retained paired evidence

Screenshots use identical fixtures and viewport sizes; illustrative source mockups are not test evidence.

| Page | 390px before / after | 1440px before / after |
| --- | --- | --- |
| services | [Before](evidence/responsive-rollout-20261118/before-services-390.png) · [After](evidence/responsive-rollout-20261118/after-services-390.png) | [Before](evidence/responsive-rollout-20261118/before-services-1440.png) · [After](evidence/responsive-rollout-20261118/after-services-1440.png) |
| wenze | [Before](evidence/responsive-rollout-20261118/before-wenze-390.png) · [After](evidence/responsive-rollout-20261118/after-wenze-390.png) | [Before](evidence/responsive-rollout-20261118/before-wenze-1440.png) · [After](evidence/responsive-rollout-20261118/after-wenze-1440.png) |
| restaurants | [Before](evidence/responsive-rollout-20261118/before-restaurants-390.png) · [After](evidence/responsive-rollout-20261118/after-restaurants-390.png) | [Before](evidence/responsive-rollout-20261118/before-restaurants-1440.png) · [After](evidence/responsive-rollout-20261118/after-restaurants-1440.png) |

## Focused checks to reproduce

Use the repository's existing Node dependencies with `vitest run`, `tsc --noEmit`,
and ESLint on the changed TypeScript files. Browser configurations do not start a
server: supply the validated production preview at Website port 3017 or Business
port 3018, with `SHIDA_API_BASE_URL=https://127.0.0.1:9` (never production).
Set `ROLLOUT_EVIDENCE` to an evidence directory and run
`playwright test --config playwright.responsive-rollout.config.ts`.
`playwright.responsive-regression.config.ts` selects affected existing suites; use
focused grep selections recorded with this rollout rather than the backend suite.
Each run creates a distinct OS-temp output directory. Six completed result folders
containing only disposable pass markers were removed (270 bytes). Failure diagnostics
remain for review; unique screenshots, build outputs, active previews and dependency
junctions are preserved.

SelectionSheet consumers: organization onboarding and organization address fields.
FinanceSheet consumers: Wenze finance navigation and purchase-cost details, plus
personal missions. Organization selection and Wenze cost paths were exercised;
personal missions were source-reviewed but not separately interaction-tested.
Public focus checks covered Wenze, Restaurants and Jobs; this is not exhaustive
verification of every public page or every specialized Business workflow.

The existing expense browser tests still referenced a removed native section selector.
They now open the already-existing finance menu and assert the destination content,
with a complete synthetic purchase-cost response and a no-browser-error assertion.
The original native-select failure was a stale test, distinct from the actual 767px
CSS/JavaScript mismatch caught by the expanded edge check.

**Final status:** implementation and focused validation completed locally. No push,
CI release or production deployment performed. Both loopback previews remain available
for review; their build folders must not be deleted while they are running.
