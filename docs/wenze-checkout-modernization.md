# Wenze Checkout modernization — audit and validation

The existing Personal POS already supports variant/barcode selection, atomic inventory consumption, merchant-recorded cash/Mobile Money/card, keyed retries, immutable receipts, localized thermal PDFs, history and reversals. The redesign reuses those APIs and services. No migration, gateway, automatic verification or new account permissions is needed.

Frontend work: integrate payment controls in the basket, explicit method selection, exact minor-unit cash entry and keypad, mobile product rows, backend-confirmed success, safe error/retry, and labeled receipt payment details. A successful response whose JSON body is unreadable must retain its original idempotency key; deleting that key at HTTP-header receipt could create a duplicate on retry.

The existing history/stock-only/reversal controls remain in the secondary expandable area. Relocating these coupled workflows is deferred; their authorization and audit behavior remain unchanged. Organization management stays in the existing Business workspace; Personal API routing must never confer Organization rights. WhatsApp entry points, authentication, urgent templates and notification behavior are untouched.

Validation and release evidence will be added after the focused checks. Production deployment requires approval for this specific release, as requested in the checkout brief.

## Completed implementation

- Payment method starts unselected. Cash, Mobile Money and Card live in the basket; the explicit final action records the merchant's declaration. No checkbox or second payment-selection dialog remains.
- Cash uses integer minor units and bounded decimal strings. Per-currency keypad, clear/backspace and dynamically rounded suggestions update the actual received amount. Insufficient/invalid cash disables recording. Mobile keypad and basket are mutually exclusive dialogs.
- Success appears only after a decoded backend receipt. It shows the saved totals/payment/cash amounts, receipt reference and receipt/new-sale/today actions. Short CSS checkmark animation respects reduced motion.
- Errors retain the basket and payment fields. Unknown results freeze the original command and reuse its key; server-rejected commands can be corrected. The API retains keys through JSON/blob consumption, including a truncated HTTP 200.
- Receipt preview labels the recorded method and details, retains canonical refetch, QR/commercial disclaimers and existing print/PDF outputs. Opening old receipts does not show a new-sale success animation.

## Validation — 31 October 2026

- Production build, TypeScript and focused ESLint: passed.
- `vitest run tests/wenze-cash.test.ts tests/wenze-personal-gateway.test.ts`: 21 passed. Includes precise arithmetic and Personal authority, stale sessions, cross-origin writes and Organization-path injection boundaries.
- `playwright.wenze-shop-checkout.config.ts`: 19 passed. 360/390/768/1440, EN/FR/LN/SW, explicit method selection, insufficient/exact/mixed-currency cash, variants/quantity limits, barcode entry, remove/clear, retained data, three payment methods, network/503/truncated-200 retries, known rejection, reduced motion, history, print popup and PDF download.
- Existing scanner browser suite: 4 passed (real label decoding with controlled camera frames, repeated detection and permission denial).
- Current backend main `899241d5`, isolated test worktree: `tests/test_wenze_pos.py`: 12 passed. Atomic rollback, exact-shop/actor authorization, variants/reversals, receipt immutability, mixed currency, localized PDF, payment details and physical-shop gate.
- Full browser/backend acceptance: 1 passed. Three 9,000 CDF sales (Cash, Mobile Money, Card), each with two products/three units. Exactly 3 receipts, 6 sale lines, stock 10/10 → 4/7. Cash 10,000 received / 1,000 change. First committed response deliberately truncated; retry reused the original receipt without another sale. History and canonical receipt content match, and both 58/80 mm PDFs contain the saved payment values/reference. Sanitized evidence: `docs/evidence/wenze-checkout-integration-20261031.json`.
- Screenshots reviewed for desktop/mobile catalogue, populated basket, cash keypad, confirmed success, receipt and failure. No production test records were created. Full backend suite was not run.

## Reproducing the cross-repository acceptance test

Use a disposable, clean backend checkout at the version above with its pinned test dependencies and normal pytest temporary-database setup. Build this website first. Copy `tests/integration/wenze_checkout_backend.py` into that checkout's `tests/test_checkout_browser_acceptance.py`, set `WENZE_WEBSITE_ROOT` to this website checkout and run `python -m pytest tests/test_checkout_browser_acceptance.py -q`. The test starts a loopback-only bridge scoped to its seeded shop, invokes `playwright.wenze-checkout-integration.config.ts`, checks saved backend state/PDFs, then stops the bridge. Remove only that copied test afterward. The normal backend pytest cleanup removes its temporary database. Do not copy dotenv/production credentials.

Authentication is substituted by the existing backend fixture; authorization and transaction services run normally. The browser shell uses controlled identity/store metadata, while all POS requests go to the actual backend route. This complements the gateway/auth-isolation tests; it is not a production sign-in test.

## Release and limitations

Website-only release; no backend implementation, migration, new dependency, environment variable, worker, cron or template change. Render was inspected read-only: production tracks `main`, auto-deploy is disabled and the live commit remains `5fd237b4688fe30a1c3a3a3b5a27c2d95bdcdedd`. Push only the feature branch pending this release's approval. The repository has no GitHub Actions workflow files; report available remote checks separately.

Actual printer/Bluetooth hardware is not available; browser print handoff and PDF contents/dimensions are tested. Camera input is controlled, not a physical-camera field test. Existing untracked-stock sale restrictions and mixed-currency backend rules are preserved. The separate Business frontend has not been redesigned or claimed as validated by these Personal-checkout tests. Existing history, stock-only sales and reversal tools remain secondary and retain their existing backend policy. Urgent WhatsApp templates remain unchanged.
