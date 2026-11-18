# SHIDA shared responsive design rules — proposal

**Status: DRAFT FOR REVIEW · 18 November 2026 · Not implemented.**
Proposed canonical presentation contract for Website and Business; grounded in the
[code and screenshot audit](shida-design-system-audit-20261118.md). Approval and a
bounded pilot precede adoption. No new feature, route, endpoint, financial rule,
permission, marketplace, or general chat is proposed.

## 1. Identity and invariants

Keep SHIDA's actual branding/header components, cream canvas, forest text and
actions, restrained serif headings, sans operational information, fine borders,
and flat colorful summaries. No gradients, oversized green hero panels, invented
illustrations, or empty cards enlarged to fill a viewport. Color describes
hierarchy or state; it never replaces labels, icons, or accessible state.

Desktop and mobile share content order, terminology, destination IDs, account and
business context, permissions, metric definitions, totals, timezone interpretation,
filter semantics, and available actions. Presentation may reflow or disclose
details, but must not silently remove authorized functionality. Preserve the
existing FR/EN/LN/SW dictionaries and category-specific vocabulary.

## 2. Proposed tokens

Values below are an explicit target, not a claim that these names already exist.
Map legacy aliases such as `--forest` to these values during a scoped migration;
do not override all global styles at once. Use `rem` for type/spacing and allow
the user's root font size to scale; pixel equivalents assume 16px. Breakpoints
are shared build/JS constants, not CSS custom properties inside media queries.

### Color and surfaces

| Proposed token | Value | Use |
| --- | --- | --- |
| `--shida-canvas` | `#f7f1e7` | Cream application background |
| `--shida-surface` | `#fffcf7` | Fields, cards, dialogs, header |
| `--shida-surface-muted` | `#eee5d8` | Quiet supporting surface, disabled fill |
| `--shida-forest` | `#082d25` | Branding, headings, primary action |
| `--shida-forest-deep` | `#041e19` | Pressed primary |
| `--shida-green` | `#0d493c` | Primary hover; active foreground |
| `--shida-text` | `#102620` | Body and operational text |
| `--shida-text-muted` | `#5d6b65` | Secondary text, never lower opacity |
| `--shida-on-action` | `#fffcf7` | Text/icons on forest actions |
| `--shida-border` | `#d8cec0` | Decorative separators and card outlines |
| `--shida-control-border` | `#75847b` | Field/control boundaries when needed for identification |
| `--shida-selected-bg` | `#e1edcf` | Pale-green navigation/tab selection |
| `--shida-accent` | `#b68a38` | Restrained brand decoration; not small text or sole focus cue |
| `--shida-info-bg` / `--shida-info-fg` | `#e6f2ff` / `#084b75` | Blue information/summary tone |
| `--shida-warning-bg` / `--shida-warning-fg` | `#fff0d2` / `#744600` | Amber attention tone |
| `--shida-success-bg` / `--shida-success-fg` | `#e5f3e6` / `#285d34` | Green success tone |
| `--shida-purple-bg` / `--shida-purple-fg` | `#eee7fa` / `#583986` | Purple summary tone, not a new lifecycle state |
| `--shida-danger-bg` / `--shida-danger-fg` | `#fff0ed` / `#9b3535` | Errors and destructive actions |
| `--shida-backdrop` | `rgba(4,30,25,.40)` | Modal backdrop |

Existing lifecycle-to-color mappings remain unless separately reviewed. A blue
summary is not necessarily an information alert. Do not make every positive
number green or every pending action red. Brand assets may retain their approved
colors (including the existing bright SHIDA green); do not recolor logos.

Calculated contrast examples: forest/canvas **13.23:1**, muted/canvas **4.98:1**,
on-action/forest **14.53:1**, green/selected **8.46:1**. Blue, amber, green and
purple foregrounds on their paired fills: **8.14, 7.12, 6.76, 7.44:1**. Danger pair:
**6.41:1**. Control border against surface/canvas: **3.84/3.50:1**. These rounded
reporting values come from the specified opaque sRGB pairs; acceptance uses
unrounded results and actual composed backgrounds. Gold/canvas is **2.80:1**.

Target normal text contrast at least 4.5:1; meaningful control/state cues at least
3:1 against their adjacent backgrounds. Decorative card separators need not be
the only control identifier. See W3C guidance on [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### Type, geometry, motion

| Token / role | Explicit target |
| --- | --- |
| Sans family | `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`; use available fonts, no new font dependency |
| Serif family | `Georgia, "Times New Roman", serif`; brand component keeps its own approved typography |
| Body / inputs | `1rem` (16px), line-height `1.5`, weight 400; inputs never reduced below 16px to fit mobile |
| Operational label / button | `1rem`, line-height `1.35`, weight 600 |
| Secondary text / dense desktop table | `.875rem` (14px), line-height `1.45`; never use muted styling to hide essential information |
| Bottom-navigation label | `.8125rem` (13px), line-height `1.25`, weight 500/600; two lines allowed, grow/reflow instead of shrinking |
| Public/task/detail `h1` | `1.75rem` (28px) compact; `2rem` (32px) wide, serif, line-height `1.2`, weight 600 |
| Useful section `h2` | `1.375rem` (22px) compact / `1.5rem` (24px) wide, serif, line-height `1.25`, weight 600 |
| Operational group `h3` | `1.125rem` (18px), sans, line-height `1.35`, weight 600 |
| Summary value | `1.75rem` (28px), sans, weight 700, line-height `1.15`; tabular numerals where comparable |
| Spacing scale | `.25/.5/.75/1/1.5/2/3rem` = 4/8/12/16/24/32/48px |
| Controls | Minimum `2.75rem` height and standalone icon target width (44px at default); padding `.5rem .75rem`; no fixed maximum height |
| Icons / identity photo | 20px standard; 24px navigation/summary; 40px compact identity, using existing assets |
| Border widths | 1px normal; 2px selected/check emphasis where needed |
| Radii | Controls 8px; cards 12px; modal 16px; mobile sheet 16px top corners; pills only badges/chips/avatars |
| Shadow | None for ordinary cards; overlays only `0 8px 24px rgba(4,30,25,.12)` |
| Focus | 3px solid forest outline, 3px offset; light 2px separation ring for dark/colored surfaces; never clip at scroll edges |
| Motion | Color/opacity transitions 120ms; no hover movement; `prefers-reduced-motion` removes nonessential animation |
| Layers | Content 0; sticky toolbar 10; header 20; bottom nav 40; anchored menu 50; native modal top layer |

44px is SHIDA's proposed target-size policy; it corresponds to the enhanced
[W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
not a claim that WCAG AA universally requires 44px. Inline prose links are the
documented exception; do not turn primary actions into tiny inline links.

## 3. Component contracts

| Component | Appearance, states and behavior |
| --- | --- |
| Header and identity | Reuse real header/brand, account, language and notification/cart controls. Compact 40px photo/name row; `min-width:0` on text column, normal word wrap; actions do not shrink below target. Identity has no arbitrary fixed height. Wrap utilities if necessary; do not hide account/language to gain room. |
| Primary/secondary/text actions | One primary action per task group; forest fill, light label. Secondary outlined surface; destructive action danger-labelled and secondary until the existing confirmation step. Hover changes color only, pressed uses deep forest. Visible focus and pending label; preserve width where possible. |
| Disabled actions | Native `disabled` where applicable; quiet fill/text without reducing entire-container opacity. Explain a non-obvious unmet requirement nearby. Permission-hidden actions remain governed by existing policy; disabled is not authorization. |
| Fields | Visible associated label, 16px value, 44px minimum, helper/error connected by `aria-describedby`, `aria-invalid` on failure. Preserve values on failure and existing validation timing. Native select for short choices; existing searchable selection sheet for long catalogues. |
| Tabs / section selector | One selected item with text-weight/shape cue and correct semantics. Route destinations are links; local panels use buttons and, if implemented as ARIA tabs, full tab keyboard behavior. Long section sets may use the existing selector/sheet; selection must render content, close menu and synchronize URL/history where applicable. |
| Filter toolbar | Search uses remaining width; Filters opens an accessible panel. Show applied period/timezone and active-filter count/summary while closed. Keep refresh available and guarded; retain search, filters and position on detail return. Export and uncommon actions are secondary. |
| Summary cards | Flat color, icon, original metric label/value, optional status/action. No decorative fixed height. Comparable siblings align at the top; numbers remain prominent. Full-card link only when there is one destination; no nested interactive controls. |
| Lists / cards | 12–16px padding, 8–12px separation. Primary label, contextual secondary information, amount+currency together, concise exceptional status, clear detail affordance. One semantic link for one destination; secondary actions outside that link. Authorized full data remains in details, not discarded. |
| Tables | Preserve real headers, caption/context, sorting, totals and pagination. Dense desktop rows use at least 14px text; interactive controls retain 44px targets. Mobile summary rows and detail disclosure use the same records/formatters, with only one accessible active representation. |
| Empty state | Only after a successful result. Distinguish no records from no matches. Compact icon/heading/helper/next action; reset appears only for active filters. No minimum viewport height or nested empty card inside another empty panel. |
| Loading / refresh | Local `aria-busy` and concise status; no fake zero/empty text. Retain prior successful data when safe and explicitly mark stale/refreshing; never retain data after authorization/context changes. Do not change polling or request limits as a styling task. |
| Error / partial result | Label the failed section and offer its existing retry. Keep valid sections usable. Full success timestamps advance only after the relevant request set succeeds. An uncertain write retains its existing recovery/idempotency flow. |
| Badge / selected state | One concise visible state label and non-color cue. Use `aria-current`, `aria-selected`, or `aria-pressed` according to actual semantics. Accessible wording must preserve read/unread and exceptional states even when redundant badges are removed. |
| Confirmation | Reuse `ConfirmationDialog`: exact effect, reason fields where required, safe initial focus, explicit confirm, single-submit lock, inline errors and existing conflict recovery. Do not reinterpret cancellation as deletion. |

## 4. Responsive rules

### Widths, grids and forms

- Shared layout bands: **compact <768px**, **medium 768–1023px**, **wide ≥1024px**.
  1280px is a validation point, not another mandatory shell switch. These are
  proposed targets; current Business 851px behavior must not change incidentally.
- Gutters: 16px compact, 24px medium, 32px wide. Center ordinary main content up
  to 1180px **inside the available shell space**; dense operational tables may use
  up to 1440px. Form content max 720px; reading prose max 65ch. Sidebar target
  224px on wide layouts, never subtracted twice by nested containers.
- Two summary columns on phones **when the content fits**, 12px gap; one column
  when enlarged text or the available container cannot accommodate two readable
  cards. Start with minimum card width 8.5rem and `minmax(0,1fr)` text tracks.
  Wide layouts use 3–4 columns with roughly 13.75rem minimum card width. Preserve
  every existing metric; a legitimate fifth metric may wrap or use a documented
  five-column wide layout. A monetary summary may span two mobile columns.
- Forms: one column below 768px. At wider widths use two columns only when each
  has at least 18rem usable width. Description, error summary, upload and complex
  choice fields span the row. Amount/currency may share a mobile row only while
  both remain usable; stack on long content or enlargement. Preserve DOM order.
- Between compact controls use 8–12px; between toolbar and category strip 12–16px;
  between strip and results 16px; between meaningful sections 24px. Do not use
  negative margins, transforms, fixed empty heights or `space-between` to spread
  a short chip group across the entire row.

### Tabs, lists and overflow

- Tabs/chips are left-aligned with 8px gap, no forced flex growth. Overflow stays
  within the strip with an obvious edge/next affordance; selected item scrolls
  into view. Keyboard focus remains visible. Labels do not split mid-word.
- Search has `min-width:0`, flexible width and a persistent accessible label.
  Secondary filters can move into a panel without hiding the applied state.
- Wide tables remain tables. Compact screens use readable summary rows with
  detail access where comparison is not essential. Genuine financial matrices,
  calendars and comparison tables may keep a labelled, keyboard-scrollable local
  horizontal region. Never hide required fields solely to remove overflow.
- Use `min-width:0`, `minmax(0,1fr)`, wrapping toolbars and sensible image bounds.
  Long natural-language names wrap at spaces. `overflow-wrap:anywhere` is a
  last-resort rule for identifiers/URLs, not every label. Do not apply
  `overflow-x:hidden` to the document to mask inaccessible content.

### Navigation

- Wide shell: existing sidebar/top navigation, with full destinations and clear
  active state. Compact/medium management shell: up to three primary destinations
  plus **Plus**, or an existing four-item arrangement that fits. Preserve each
  marketplace's approved order and permissions; no universal replacement labels.
- Bottom items have equal widths, aligned 24px icon slots, and labels below. At
  least two label lines can fit without moving individual icons. Never shrink
  text to keep five destinations visible. Existing overflow/More or enlarged-text
  fallback must keep all authorized destinations reachable.
- Global Website navigation and contextual management navigation must not both
  occupy fixed bottom rows. Retain the existing context choice and canonical
  account return. Nested details keep their parent active. Link/query/hash,
  refresh and browser history must agree with rendered content.
- Retain measured navigation height (`--management-nav-space` or equivalent).
  Main bottom clearance = measured occupied bar height **including its safe-area
  inset** + 16px; do not add that inset twice. A separate task action bar adds its
  measured height. Re-measure after font/locale/viewport changes. Apply matching
  scroll padding so focus and the final row can move above fixed controls.

### Dialogs, sheets, keyboards and safe areas

- Reuse native modal mechanisms, not new page-specific overlays. Compact screens
  use bottom sheets for short options/details; at ≥768px use a centered dialog.
  Suggested width: 560px standard, 720px for existing complex editors; do not
  shrink receipts or comparison content below readability to satisfy that default.
- Bottom sheet width 100%, max height `calc(100dvh - 16px)`; centered dialog width
  `min(560px, calc(100% - 32px))`, same vertical clearance. Padding 16px compact /
  24px wide, bottom padding `max(16px, env(safe-area-inset-bottom))`. Use a flex
  body with `min-height:0`, one scrollable content region and visible close/action
  access. Do not trap users in multiple nested scrollers.
- Long creation/edit flows may remain full-page (existing canonical route), with
  a visible task title and unsaved-change protection. A visual mockup is not a
  reason to convert them to sheets.
- Modal naming, focus containment, Escape/back handling, scroll restoration and
  return-to-opener are required. Preserve current URL-driven detail state; if
  adding history for an ephemeral sheet is necessary, define and test it so one
  Back closes only that layer and Forward/direct links remain correct. Do not
  silently push new route entries as a purely visual migration.
- Keyboard: prefer normal document flow for forms. Where a fixed action footer
  is necessary, use the existing viewport mechanism and make the focused field,
  error and actions reachable above the keyboard. Browser-toolbar resize alone
  must not be treated as a keyboard. `dvh` is not proof of correct physical-device
  behavior; verify iOS Safari and Android Chrome. Modal top layer covers background
  navigation; background controls cannot receive touch/focus through the overlay.

## 5. Page-title policy

Exactly one meaningful `h1` describes each page/selected management view. Preserve
the document title and route-change focus behavior. Introduce an explicit heading
mode in the existing shell rather than broad CSS hiding all headings.

| Context | Proposed visible-heading rule |
| --- | --- |
| Management landing view clearly identified by persistent active navigation and identity | Visually hide redundant `h1` on compact/medium; remove its wrapper's reserved space. Wide pages may also opt out when the persistent active navigation provides equally clear orientation; review rather than hide every desktop title automatically. |
| Nested order/product/request detail, creation/editing, settings or ambiguous context | Keep a compact visible task/detail title and useful back/context link. A parent bottom-nav label does not identify a specific record or operation. |
| Public marketplace / public listing | Keep visible page or listing title for discovery and orientation. Public headings are not redundant management titles. |
| Section or dialog | Keep useful `h2`/`h3` and labelled dialog heading; do not replace with unlabeled cards to save space. |

Visually hidden headings use an accessible clipping utility, not `display:none`,
`visibility:hidden` or `aria-hidden`. Give the existing route-focus target a usable
focus destination without changing DOM reading order. Refresh/timezone/status
controls remain visible in a compact wrapping row even when the title is hidden.

## 6. Consolidation and legitimate exceptions

**Reuse now as design references:** SHIDA headers; connected business identity;
ManagementMobileNavigation; ConfirmationDialog; FinanceSheet/SelectionSheet;
existing metrics, icon slots and calendar. **Proposed future primitives:** semantic
token sheet, scoped page-heading mode, summary-card presentation, compact toolbar,
field/state wrapper and responsive list presentation. These names are concepts,
not a request to add a component library during this audit.

Start with matching token names and behavior tests in the two repositories.
Document version/parity in each release; consider a shared package only after
dependencies, ownership and release cadence justify it. Keep organization/team
registration, authorization and data fetching in frontend-specific adapters.
Do not blindly copy Services personal-workspace code into Business team pages.

Legitimate exceptions must name the route/component, reason, alternate rule and
validation owner in the adoption change:

- Public marketplaces retain search/discovery, product imagery, Lingala slogans,
  public titles and global navigation. Compact mobile is still required; no large
  hero is added merely to unify with an old design document.
- Counter sales, kitchen/preparation and stock workflows can use denser grids,
  wider workspaces and persistent task summaries. Keep quantities, destructive
  confirmations, draft guards and keyboard access; do not force a generic card.
- Calendar grids, schedules and genuine comparison/financial tables can scroll
  locally. Keep day/timezone and accessible data relationships intact.
- Receipts, invoices, print/PDF and QR displays follow their document/scanning
  constraints. Screen bottom navigation must not leak into print.
- Business organization/team scope, professional/individual categories, and
  existing marketplace vocabulary remain distinct. No new Appartements management
  module or unrelated Ecole work is included.
- Loading with no prior data, restricted access, stale data, unknown values, and
  genuine zeros remain different even when a compact mockup shows all zeros.

## 7. Enforcement versus review

| Enforce in shared tokens/components and focused tests | Still requires page/design review |
| --- | --- |
| Color/type/spacing/radius aliases, 44px control minimum, focus and reduced-motion styling | Whether a heading is redundant; useful section hierarchy and honest action wording |
| Shared shell breakpoint constant in CSS/JS, measured nav clearance, selected destination IDs | Correct primary destinations and marketplace-specific vocabulary |
| Native modal lifecycle, accessible names, busy locks, focus return | Appropriate panel versus full-page flow; physical keyboard/browser-toolbar behavior |
| Button/field/badge variants and documented state props | Correct status meaning, metric derivation, permission and cost visibility |
| List/grid reflow, scroll-region boundaries, active-tab visibility | Which fields belong in compact rows; comparative data that must stay in a table |
| Locale key coverage, route/history interaction assertions, automated overflow checks | Natural FR/EN/LN/SW wording, long-name readability, screen-reader usefulness |

Do not start with a repository-wide ban on hex values or legacy CSS. After the
pilot, prevent new raw presentation values in migrated components (allow assets,
data visualization and documented exceptions), and remove obsolete rules only
with scoped evidence. Shared tests cannot prove business correctness by themselves.

## 8. Pilot and staged adoption

1. **Review this proposal:** settle token values, heading rules and 1024/768 shell/
   sheet boundaries. Record approval before application edits.
2. **Pilot Website Services → Demandes et missions** (`view=work`) on desktop and
   mobile. Preserve all current tabs (including activity messages), metrics,
   search/filter/status behavior and permissions. Use existing shared shell and
   scoped token aliases; keep changes small enough to revert. No other route's
   styles change through a global token swap.
3. **Pilot acceptance:** matching desktop/mobile captures, all states/locales,
   focused navigation/work-list checks, human visual review, keyboard and touch
   checks below. Compare same data/viewport before and after. Investigate any
   difference in content/actions; an updated screenshot alone is not acceptance.
4. **Business parity:** adapt its Services management presentation while preserving
   organization/team controls. Confirm the different shell boundary and all
   permission consumers before consolidating common tokens or helpers.
5. **Restaurant then Wenze:** Today and order lists first; use their real metrics
   and existing task navigation. Follow with finance/list-detail panels, forms,
   calendar, stock and counter-sale workflows in separate small batches.
6. **Public/account surfaces last:** apply identity/type/control foundations with
   public titles/discovery exceptions. Retire superseded CSS and annotate older
   design docs after each accepted component, not in one cleanup sweep.

Each stage records changed consumers, focused test results, paired screenshots,
known device limitations and rollback commit. Release only under the applicable
task authorization; this audit itself is **not pushed or deployed**.

## 9. Focused validation checklist for adoption

| Check | Pass condition |
| --- | --- |
| Narrow mobile 320×844 | No page-wide overflow; controls and complete labels reachable; columns collapse when needed; last content and focus scroll above navigation. |
| Larger mobile 375/390/430×844 | First work section appears without oversized title/empty padding; normal and long content; selected tabs visible; all actions accessible. |
| Tablet 768×1024, 820×1180 | Sensible content width, forms use available space; sheet/nav selection matches the shared contract. Also inspect 767/768 and 1023/1024 boundaries. |
| Desktop 1280×900 and 1440×1000 | Same authorized fields/actions, intact sidebar and dense tables, readable line lengths, keyboard focus never hidden. |
| FR/EN/LN/SW | Real translations, long business/provider/product names, long status labels and amounts; no mid-word navigation breaks; no invented generic vocabulary. |
| Enlargement | 150% and 200% text (including controls), plus 400% browser zoom from 1280px to equivalent 320px reflow; no loss of content/action or text-size reduction to defeat enlargement. |
| States | Initial loading, refresh with prior data, empty, no matches, partial failure, full failure, retry, disabled, selected, focus, denied access, context change. No failure becomes zero or successful timestamp. |
| Navigation | Click/tap every displayed destination and assert destination-specific content; nested active state, two non-overview transitions, direct link, reload, Back/Forward, return filters/scroll, unsaved-change guard. |
| Dialogs and sheets | Name, safe initial focus, Tab/Shift+Tab containment, Escape, existing Back semantics, close and focus/scroll return; long content; errors and duplicate-submit prevention. |
| Input modes / devices | Keyboard-only desktop, touch browser emulation, then physical iOS Safari and Android Chrome with expanded/collapsed toolbar, orientation change and keyboard open. Label emulation separately from real-device results. |
| Accessibility | Computed text/cue contrast on actual surfaces; visible focus, skip link, correct heading order, named controls, non-color status, reduced motion and screen-reader spot check. |
| Regression scope | Focused tests for changed component and its known Website/Business consumers; no full backend suite for presentation-only changes. |

The enlargement targets follow W3C [Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
and [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) guidance.
Record unverified device behavior explicitly. A CSS viewport test, synthetic
component test, retained screenshot, authenticated browser check, and production
deployment are different evidence types and must not be reported interchangeably.
