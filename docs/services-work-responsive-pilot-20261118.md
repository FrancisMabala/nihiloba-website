# Services work view — bounded responsive pilot

18 November 2026. **Local implementation; not pushed or deployed.**

## Scope and evidence

Website route `/[locale]/shida/seller/services?view=work` (English has no locale
prefix), rendered by `ServicesManagement` → `ServicesTransactions` →
`ServicesWorkSummary`. Baseline checkout: `44ca1619b90a48cff834e24ae2829cff8cfa6471`
(documentation-only audit on application revision
`16ce335c6450260fb4327f717d38d51936f8ff03`). The audit's older retained images were
not reused as the before captures: fresh screenshots came from the local Next.js
production preview before editing.

The [rules document](shida-responsive-design-rules-proposal.md) now distinguishes
this adoption from the proposed wider rollout. There are no backend, API, locale
dictionary, permission, metric, lifecycle, dependency or lockfile changes.

### Confirmed causes

- The mobile work heading was already visually hidden; desktop retained its
  title, explanatory paragraph, separator and fullscreen row. Nested panel
  borders/padding further separated the controls from the list.
- `services-workplace.css` uses `.svc-work-summary` for a flex chip group and
  styles descendant spans as pills. That collides with the work summary's grid
  and labels. The pilot resets only this view's wrapper and label presentation;
  it does not change the other component's styles.
- `services-work.css`, `services-mobile-pages.css` and the financial panel styles
  supply overlapping typography/background rules. The baseline table was 12.8px;
  desktop filters were 14px. A few legacy backgrounds/padding use `!important`;
  scoped presentation overrides are required until a separately reviewed cleanup.
- CSS declares the existing Inter/system sans stack, but Chrome's actual platform
  font inspection reports **Segoe UI / Segoe UI Semibold / Segoe UI Bold** on this
  Windows host. The pilot uses that same stack and adds no font dependency.

## Implemented contract

- Opt-in `shida-presentation.css` tokens for cream surfaces, forest controls,
  readable type, spacing, radii, focus and overlay treatment. Reusable
  `shida-summary-card` blue/amber/green/purple variants retain every original
  icon, label, number and metric action. They have no gradients or fixed height.
- `services-work-pilot.css` applies only below the `view=work` opt-in root.
  Gutters are 16/24/32px at compact/medium/wide widths, main content is bounded
  within the existing shell, and the inherited flex wrapper is reset to block
  so the summary grid can use the available width. Wide cards use a 13.75rem
  minimum, medium cards 8.5rem, phones two columns where readable; the 17.5rem
  container threshold permits one column with enlarged text.
- Explicit `data-heading-visibility="accessible"` removes the landing heading's
  reserved space at **all widths**, retaining `#services-view-title`, its h1,
  tab index and existing route-change focus. Useful detail/section headings remain.
  Fullscreen uses the existing desktop secondary menu and existing mobile
  identity menu rather than a dedicated heading action row.
- Controls use at least 44px targets and 16px labels/values at default root size;
  summary values are 28px, desktop table text 14px, mobile primary row text 16px,
  secondary text 14px. List data stays in the same semantic table and existing
  detail/action flow. Operational headings remain sans-serif; the Plus heading
  uses the existing serif stack.
- Tabs keep their four existing destinations, including activity messages.
  The selected tab is revealed horizontally without moving the document.
  Filters wrap; focus uses a 3px forest outline with light separation.
- The existing **1024px navigation boundary** remains unchanged. Only this
  view's Plus overlay adopts a bottom sheet below **768px** and a centered,
  at-most-560px dialog at/above it. Native modal behavior is reused. Bottom
  clearance uses the shared measured navigation height plus 16px, including
  the existing safe-area handling without double-counting it.
- Plus still returns to canonical localized **Mon espace**. Current provider
  scope, permission checks, leave guards, refresh locks and all action handlers
  are retained.

### Changed consumers

| File / component | Scope |
| --- | --- |
| `services-management.tsx` | Opt-in root and heading mode only for `view=work` |
| `services-work-summary.tsx` | Reusable presentation attributes; sole Website caller is `ServicesTransactions` |
| `services-transactions.tsx` | Selected-tab horizontal reveal, guarded by pilot ancestor; metrics and handlers unchanged |
| `services-provider-navigation.tsx` | Existing fullscreen menu added only to work's desktop navigation |
| `shida-presentation.css`, `services-work-pilot.css` | Token definitions and scoped presentation; no global token replacement |
| `playwright.services-work-pilot.config.ts`, fixture and browser test | Repeatable synthetic production-page checks and paired capture workflow |

`ManagementMobileNavigation`, `BusinessFullscreen`, headers and identity
components are reused without source changes. Services overview/calendar are
checked when entering and leaving the pilot. Restaurant, Wenze and Business do
not acquire the opt-in class; their layouts and navigation rules are untouched.

## Paired screenshots

The same fixture, fixed clock (`2026-11-18T10:00:00Z`), French locale, default
Requests and quotes tab, all-service/all-status filters, viewport, scroll origin
and data state are used on each side. Both are actual local production-build
pages, with synthetic API responses; neither is a live customer session or mockup.

| Viewport / state | Before | After |
| --- | --- | --- |
| 390 × 900, populated | [Before](evidence/services-work-pilot-20261118/before-populated-390.png) | [After](evidence/services-work-pilot-20261118/after-populated-390.png) |
| 1440 × 900, populated | [Before](evidence/services-work-pilot-20261118/before-populated-1440.png) | [After](evidence/services-work-pilot-20261118/after-populated-1440.png) |
| 390 × 900, empty | [Before](evidence/services-work-pilot-20261118/before-empty-390.png) | [After](evidence/services-work-pilot-20261118/after-empty-390.png) |
| 1440 × 900, empty | [Before](evidence/services-work-pilot-20261118/before-empty-1440.png) | [After](evidence/services-work-pilot-20261118/after-empty-1440.png) |
| 390 × 900, error | [Before](evidence/services-work-pilot-20261118/before-error-390.png) | [After](evidence/services-work-pilot-20261118/after-error-390.png) |
| 1440 × 900, error | [Before](evidence/services-work-pilot-20261118/before-error-1440.png) | [After](evidence/services-work-pilot-20261118/after-error-1440.png) |
| 390 × 900, loading | [Before](evidence/services-work-pilot-20261118/before-loading-390.png) | [After](evidence/services-work-pilot-20261118/after-loading-390.png) |
| 1440 × 900, loading | [Before](evidence/services-work-pilot-20261118/before-loading-1440.png) | [After](evidence/services-work-pilot-20261118/after-loading-1440.png) |
| 390 × 900, Plus open | [Before](evidence/services-work-pilot-20261118/before-more-390.png) | [After](evidence/services-work-pilot-20261118/after-more-390.png) |
| 820 × 900, Plus open | [Before](evidence/services-work-pilot-20261118/before-more-820.png) | [After](evidence/services-work-pilot-20261118/after-more-820.png) |

Computed styles and actual platform fonts are retained in the adjacent
`before-computed-fonts.json` and `after-computed-fonts.json`. `manifest.json`
records the fixture/source hashes and final build identifier.

## Focused validation

| Check | Result |
| --- | --- |
| `next build --webpack` with loopback API fallback | Passed, final build `daBVmZyeb_jiJOMp7bBMM` |
| `tsc --noEmit` | Passed |
| Scoped ESLint on the four changed TSX components, test/config/fixture | No errors; two pre-existing hook dependency warnings in `services-management.tsx` (`offeringRef`, `navigate`) |
| Vitest: work model, work inbox gateway, management mobile navigation | 3 files, 6 tests passed |
| `playwright.services-work-pilot.config.ts` | 15 tests passed against the final production build, no CSP bypass |
| Existing `playwright.services-mobile.config.ts` with `SERVICES_PRODUCTION=1` | 12 tests passed: overview, work, calendar, availability, discovery, Plus, locale/denial, refresh and conflict regressions |
| `git diff --check` | Passed |

The pilot matrix checks **320, 390, 767, 768, 820, 1023, 1024 and 1440px** in
FR/EN/LN/SW, with long provider and service names. It asserts content rendering,
summary values/actions, readable computed fonts, real summary contrast ≥4.5:1,
control heights ≥44px, full-width grid use, heading visibility, navigation and
overlay boundaries, selected-tab visibility and absence of page-wide overflow.
All four locales also run **150% and 200% root-text enlargement** at 320/390/820/
1440px with 26 records, pagination and final-row clearance checks.

Interactions cover all four tabs and their destination-specific content, all
summary actions, service/status filters, reset, request/message details and
filter-preserving return; empty, loading, failure/retry and denied access;
keyboard focus, native modal page-focus containment, Escape/focus return,
calendar/work transitions, direct links, reload, Back/Forward and canonical
Mon espace return in each locale. The existing regression suite additionally
checks all Plus destinations, unchanged neighboring views, and synthetic
write/conflict protections. No live account or backend writes were performed.

Initial validation found the tablet flex/grid collision; it was fixed before
the final build and captures. A focus assertion was refined to distinguish
native browser-chrome focus from background-page focus. Fullscreen entry was
explicitly diagnosed as a browser denial, not reported as a successful entry.
The [final pilot log](evidence/services-work-pilot-20261118/browser-final.txt)
and [regression log](evidence/services-work-pilot-20261118/regression.txt) are retained.

## Enforcement and review

Tokens, explicit opt-in heading mode, summary variants, minimum control sizes,
focus styles, reflow and overlay geometry are enforced by the scoped CSS and
the focused browser assertions. Metrics, permissions and workflow actions stay
in their existing components and model tests. Human review still decides title
redundancy, information hierarchy, status wording, whether long labels read
naturally, and physical keyboard/toolbar behavior. This pilot is not permission
to opt other pages into the contract automatically.

Production-preview output in this checkout's `.next` is retained for review,
with shared `node_modules` untouched. Working evidence/build logs remain under
`C:/NIHILOBA/release-evidence/services-work-pilot-20261118`; the committed evidence
set above is the reviewable copy. The existing Services regression captures are
retained in the task's `shida-services-mobile-YqUbjT` temporary output directory.
Automatic approval review rejected cleanup of the eight task-only Playwright
runner directories with `blocked by policy`; they remain under the OS temporary
directory (`shida-work-pilot-3RClDs`, `7c9ZYD`, `DxO3Fx`, `h84cB4`, `Li3CZU`,
`pwQIDK`, `w7HY0o`, `WKp7u3`, each with the same `shida-work-pilot-` prefix).
No shared dependencies, source worktrees or unfinished work were removed.

## Limits and deliberate non-changes

- Browser verification uses installed Chrome with touch emulation and synthetic
  API interception on loopback. Physical iOS Safari/Android Chrome, browser
  toolbar transitions, real virtual keyboards, screen-reader output and actual
  400% browser zoom are not verified. Root-text enlargement is a separate check.
- Native dialog focus can move into browser chrome at its tab boundary, then
  return to the dialog. Checks distinguish that from focus entering background
  page controls; a custom focus trap was not added.
- Headless Chrome denies native fullscreen with `TypeError: not granted` despite
  exposing the API. The menu's workspace target, closing and graceful fallback
  are checked; successful fullscreen entry on a physical browser is unverified.
- The existing management navigation uses `replaceState` for in-page switches.
  This presentation pilot preserves that behavior. Direct links, reload and
  browser traversal across actual history entries are checked; no new history
  entries are introduced for tabs, details or Plus.
- The work-list fetch policy and financial/action rules are unchanged. Synthetic
  UI tests are not backend authorization or financial correctness certification.
- No broader rollout, full backend suite, push or deployment is included.
