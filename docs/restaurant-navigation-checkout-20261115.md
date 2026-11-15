# Restaurant navigation and checkout — 15 November 2026

Implemented locally only. The request explicitly prohibits deployment; do not push these commits to an automatically deployed branch without a subsequent release request.

## Workspace

The personal restaurant workspace now connects the existing marketplace header to a cream, flat sidebar. Restaurant identity and guarded switching live in the sidebar (and mobile drawer). Existing permission checks determine visible destinations. Menu and daily dishes share local navigation; establishment profile, hours, configuration and sharing share local navigation; finance retains summary, expenses, cash, invoices and lookup tools. Old tab/view identifiers map to the appropriate parent and continue loading their existing data. Existing home preference and fullscreen controls remain available.

The POS instance remains mounted while navigating within the same restaurant. Its basket guard is scoped so internal navigation can retain it, while switching establishments, leaving the workspace, incomplete checkout and other unsaved forms still use the existing guard. A restaurant/binding key prevents state reuse across establishments. Drafts and recorded unpaid sales remain distinct.

## Disappearing receipt: identified cause and fix

The former `RestaurantCounter.onPaid` callback closed payment and cleared the order and bill-group reference immediately after success. Those same values controlled whether the dialog was mounted, so basket cleanup destroyed the receipt view. There was no dismissal timer to extend.

Confirmed payment snapshots and the receipt target now have independent state. Only server-confirmed entries enter the recorded state, including authoritative recovery of an uncertain operation. Clearing the sold basket no longer closes the dialog. Closing retains receipt access; starting a new sale does not clear another basket or unpaid order. Polling, QR display and printing preserve the recorded state. An already-settled bill read prevents another payment submission. Remaining balances are explicitly labelled as balances after that payment; Paid requires the current authoritative bill to be settled.

The native dialog uses viewport centring, a dimmed backdrop and bounded scrolling, following the existing Wenze presentation. Mobile uses the available viewport. Native fullscreen retains the dialog inside the fullscreen workspace. Escape explicitly closes checkout and restores focus; it does not simultaneously exit the workspace focus mode. Paper format is retained in the existing browser preference style. Receipt loading/printing failure is separate from confirmed payment state. Restaurant payment, stock and fulfilment APIs and idempotency envelopes remain unchanged.

## Validation

- TypeScript checks passed for Web and Business.
- Targeted ESLint and `git diff --check` passed. An unused browser-test variable was removed after the final lint review.
- Web targeted Vitest: 13 passed (POS, money contracts and navigation mapping).
- Business targeted Vitest: 12 passed (POS contracts/interactions and money contracts).
- Browser suite covers 34 cases at 320, 375, 390, 820 and 1440 px, including French, English, Lingala and Swahili. The initial broader run exposed duplicate mobile basket headings; corrected cases and all affected/new cases passed in focused reruns. Final five-case run passed, including modal geometry, old-receipt/new-basket isolation and concurrent cashier settlement. This was not a final single 34-case run.
- Local browser coverage includes flat navigation, retained basket, guarded switching, legacy hours links, inventory permission omission, required options, composed plates, held drafts, unpaid sales, changed prices, uncertain prepare/payment recovery, duplicate submission protection, partial payment, receipt failure retry, 31-second polling, fullscreen, focus restoration, print media, authorized receipt QR and new-sale behavior.
- Screenshots: `C:/NIHILOBA/release-evidence/restaurant-nav-checkout-20261115/` (`pos-basket-*`, `pos-payment-*`, `pos-recorded-*`, `navigation-375.png`). Desktop and mobile images were inspected against the reference. Test content is synthetic; the reference's dishes and counts are not hardcoded into the product.

## Limits and retained artifacts

Browser tests intercept backend requests on loopback and block external network calls. They verify frontend handling of concurrent settlement and recovery, not real database concurrency. No production payment, customer message, backend migration or deployment was performed. No full backend suite or duplicate dependency installation was run. Physical printers, real mobile keyboards and production integration remain unverified. Business receives shared checkout parity; its separate organization navigation is unchanged.

Existing worktrees and shared dependencies remain intact because these commits are local and unpublished. Local dev build output remains available for review. Evidence screenshots, test reports and task helper scripts are retained in the evidence directory; they are not application runtime dependencies. WhatsApp authentication and messaging were not changed; existing web destination query parameters and protected receipt access are preserved.
