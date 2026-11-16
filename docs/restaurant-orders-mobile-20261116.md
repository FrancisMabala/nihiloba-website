# Restaurant mobile orders — 16 November 2026

Local implementation only. No push, deployment, migration, API contract or order lifecycle changes.

## Cause and correction

The queue's heading, introductory sentence, refresh button, screen-awake checkbox and full date occupied separate mobile rows. Every order repeated a full-width action button. The management wrapper and inner content each added horizontal padding. Shared heading rules also overrode the queue's intended mobile font size.

The queue now uses 16px outer padding, a compact identity row, a 28px mobile serif heading with a 44px refresh control, and a page-options disclosure for screen-awake. Refresh exposes loading and retry feedback; the last-success time changes only after the existing polling request completes successfully. Existing rows remain available during refresh. Unsupported screen-awake browsers receive an explicit explanation. Existing fullscreen/account/language controls and bottom navigation remain intact.

Each order is one native, keyboard-focusable link containing its full reference, unchanged status badge, source and fulfilment, amount/currency, timestamp and chevron. Mobile cards have 12px padding and 10px gaps. Desktop retains the column layout. No quick order mutation controls were added.

Previously the list/detail transition only updated component state. The existing `order` destination now participates in browser history, while validated, namespaced queue query parameters retain applied search, tab, filters and pagination. Back/forward restores list/detail content and returning in the mounted workspace restores scroll and focus. Refresh/direct links reconstruct the selected filters and detail. Pending operation protections remain in place.

## Why older accepted orders remain active

The existing active state set is `pending`, `accepted`, `preparing`, `ready`, `out_for_delivery`, without a date cutoff. Backend `restaurant_order_api_service.orders` applies state filtering and orders by submission time descending. `restaurant_order_service._reconcile` applies the response deadline to pending orders and explicitly preserves accepted obligations across ordinary admission loss. An earlier date alone does not complete, archive or cancel an accepted order. This behavior is unchanged.

## Validation

- 20 focused Vitest tests: queue query contract, four-language empty/loading states, route round trips and validation, real card link content, and existing order-detail action rules.
- 16 Playwright scenarios on the real local Next application with intercepted synthetic API records, external requests blocked. Chrome touch input at 320, 375, 390 and 430 CSS pixels; tablet 820 and desktop 1440. No backend suite or live customer messages.
- Search, source filtering, active/history counts, reset/no-match states, direct links, reload, detail opening, browser back/forward, list scroll restoration and final-row clearance above navigation.
- Refresh success, retained rows while loading, failed refresh retaining its previous success time, retry, initial error without false empty state, and genuine empty state without an irrelevant reset action.
- Screen-awake support/unavailability, simulated acquire/release, options-menu Escape and focus return. Keyboard link focus. Long references, large USD amounts, long business names/statuses and 200% root text in FR/EN/LN/SW without page overflow.
- Focused ESLint, TypeScript `--noEmit --incremental false`, and `git diff --check`.
- After the final enlarged-text heading/options adjustment, the 11 affected visual/navigation scenarios were rerun.

At 390 × 844, the initial baseline card started at y=536 and was 190px tall. The compact result starts around y=359 and is 118px tall; the first complete card and subsequent cards are visible before scrolling. Both screenshots use the same viewport, synthetic records and application chrome.

Evidence retained outside the repository in `C:/NIHILOBA/release-evidence/restaurant-orders-mobile-20261116/`: `before-390.png`, `after-390.png`, `after-820.png`, `after-1440.png`, `enlarged-320.png`.

Limitations: synthetic API/browser checks do not establish live backend integration or live WhatsApp delivery. Physical iPhone Safari, dynamic browser toolbars, hardware safe-area insets, actual device wake-lock persistence and native accessibility text enlargement were not exercised. The Business-hosted wrapper was not separately browser-tested; its shared queue behavior is covered by the component checks. No unresolved failure in the focused checks.

## Changed files

- `app/components/shida/restaurant-order-screen.tsx`
- `app/components/shida/restaurant-orders-list.tsx`
- `app/components/shida/restaurant-orders-mobile.css`
- `app/lib/restaurant-queue-copy.ts`
- `tests/restaurant-queue.test.tsx`
- `tests/browser/restaurant-orders-mobile.browser.ts`
- `playwright.restaurant-orders-mobile.config.ts`
- This report.

The reusable local fixture environment and shared dependencies were preserved. The task's test server was stopped after validation. Automatic approval review rejected deletion of disposable Playwright output with “blocked by policy”; none of those folders was removed. Screenshots remain as evidence.

Optional manual cleanup: under `C:/Users/mabal/AppData/Local/Temp/`, only these task-owned test-output folders are disposable: `restaurant-orders-before-20261116`, `restaurant-orders-after-20261116`, `restaurant-orders-validation-20261116`, `restaurant-orders-validation2-20261116`, `restaurant-orders-validation3-20261116`, `restaurant-orders-validation4-20261116`, `restaurant-orders-layout-final-20261116`. Keep the reusable runtime, shared dependencies and release-evidence directory.
