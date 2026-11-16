# Personal listings mobile correction — 16 November 2026

## Scope and release state

Implemented for `/{locale}/shida/space/?view=listings` and the existing owned individual-job manager/editor. English uses the unprefixed route. This batch is local only: no push or deployment is authorized by its request. No backend or database changes and no migration are required.

## Verified causes and changes

- `account-space.tsx` renders `PersonalListings` from `personal-missions.tsx`. The catalogue reused a desktop icon/content/actions grid on phones, keeping supporting information indented. Global account-space heading rules also overrode card-title size and margin. The scoped mobile grid now uses the full card width below the small icon/title row, with 12px padding, 10px list gaps and 19.2px titles at default text size. The existing section selector remains, while the redundant mobile sidebar heading is suppressed only for these listing views.
- Category buttons previously wrapped. Their strip now scrolls independently, retains full labels/counts, and brings the selected tab into view. The selected category is stored in the existing URL; history records only the list path and scroll offset, preserving other history state. Back navigation restores the list. Article and service links retain their separate canonical destinations.
- Cards preserve status, location/coverage, price/currency and supported response counts. Missing counts are not displayed as zero; articles do not acquire application counts. An untitled draft has a separate localized title and draft status.
- The job manager's old right-anchored absolute menu could extend beyond the viewport. It now reuses `FinanceSheet`, a native modal with mobile bottom-sheet positioning, focus containment, Escape/close dismissal and trigger-focus restoration. Close and delete retain distinct confirmation text and backend operations. Failed mutations retain the listing and show an error. Closed jobs retain their existing edit restrictions.
- Owner detail conditions are compact label/value groups. Mobile editing uses a localized current-step label and slim progress bar, retains the existing three steps, and uses one-column fields. Actions remain in document flow. Existing privacy guidance, location dependencies and free-text/list quartier selection are unchanged. Edit and draft cancellation now use the existing unsaved-work guard.

### Blank work type

The strict `MissionPicker` reset its search query to an empty string on focus and displayed that query instead of its saved value. This reproduced a blank-looking selection even with a valid saved category. The picker now retains the value until the user starts typing; pointer selection also preserves focus until an option is chosen.

The existing `mission_terms` JSON mapping already preserves saved categories independently of a customized job title. Legacy records without terms infer a category only from an exact canonical localized title. Missing or unsupported types remain explicit, keep their saved content, and require a deliberate choice before continuing. No default category or production-data repair was introduced. The specific production record from the user's screenshot was not inspected.

## Changed application files

- `app/components/shida/personal-missions.tsx`: catalogue structure, filter/return state, manager actions and edit guard.
- `app/components/shida/personal-listings.css`: scoped catalogue/header/card/tab responsiveness.
- `app/components/shida/mission-management.css`: owner detail, bottom-sheet actions and wizard responsiveness.
- `app/components/shida/mission-picker.tsx`: saved-value display and pointer selection.
- `app/components/shida/mission-wizard.tsx`: mobile progress and explicit missing/legacy work-type guidance.
- `app/components/shida/personal-offer-space.tsx`: draft cancellation guard.
- `app/lib/mission-form.ts`: reject unsupported category on validation without overwriting it.
- `app/lib/personal-missions-copy.ts`: French, English, Lingala and Swahili copy.

## Focused validation

Local reusable fixture runtime: `C:/NIHILOBA/local-dev/runtime/website`, loopback port 3000. Browser requests use synthetic accounts and intercepted API responses; external requests and non-fixture mutations are blocked. No real users or production records were changed.

- 17 distinct Playwright scenarios passed across focused runs in `tests/browser/listings-mobile.browser.ts` with `playwright.listings-mobile.config.ts`.
- Chrome touch-enabled viewports: 320, 375, 390, 430, 820 and 1440 CSS pixels. All four languages also passed 320px checks at 200% root text size, including no page overflow and final editor controls above the bottom navigation.
- Tested real rendered catalogue filtering/counts, refresh/direct links, detail/back navigation and scroll restoration; drafts, long unbroken titles/locations, missing optional counts; article and service management destinations and article-edit prefill; actions-sheet containment/dismissal/focus; separate close/delete confirmations, failure feedback and closed-listing restrictions.
- Tested job-edit prefill, saved-category focus, quartier option selection, step-to-step preservation, review/save request, unsaved edits, draft cancellation protection, draft save/resume, missing and unsupported legacy types, loading/error/retry and empty catalogue states.
- 12 unit tests passed: `tests/mission-prefill.test.ts`, `tests/personal-offer-form.test.ts`, `tests/individual-listing-pages.test.ts`.
- Targeted ESLint, TypeScript (`tsc --noEmit --incremental false`) and `git diff --check` passed.

No full backend suite or production build was run for this focused UI change. The existing runtime and dependency junctions were reused without installation.

## Visual evidence

Same-size 390 × 844 CSS-pixel before/after screenshots (synthetic records) are retained outside the repository at `C:/NIHILOBA/release-evidence/listings-mobile-20261116/`:

- `before-overview-390.png` / `after-overview-390.png`
- `before-actions-390.png` / `after-actions-390.png`
- `before-edit-390.png` / `after-edit-390.png`
- Additional desktop regression: `after-overview-desktop.png`.

## Limits

These are rendered browser interaction checks against synthetic fixtures, not live end-to-end backend verification. Physical iPhone Safari, its software keyboard and dynamic browser toolbar/safe-area behavior were not verified. Existing WhatsApp links, backend permissions and lifecycle contracts were preserved, but no live WhatsApp messages were sent. Article/service destinations and prefill were checked; their entire independent publication workflows were not rerun. The live site remains unchanged by this batch.

## Local runtime and cleanup

The reusable website server was stopped after validation (no listener on port 3000). Shared dependency junctions, source checkouts, unfinished work and evidence were preserved. Automatic approval review rejected removal of the following disposable test-output folders with `blocked by policy`. Together they contain 78,910 bytes; manual deletion is optional:

- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-before-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-check-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-final-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-destinations-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-links-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-last-20261116`
- `C:/Users/mabal/AppData/Local/Temp/listings-mobile-desktop-20261116`

Keep the separate release-evidence directory and reusable runtime/dependencies.
