# RM-V11-10F4 — Personal owner daily operations

Handoff, 2026-10-11. Consumer: exact Personal Pro Restaurant owner. No Backend file, intake gate, deployment, commit or push was changed.

## Implementation

- The existing Restaurant seller workspace has a Daily operations tab beside payment methods and Service. The tab requires the paid POS capability and does not alter Free ordering or bounded resolution of an already-open money obligation. The Personal proxy only forwards the exact owner finance/day routes after its existing session binding and same-origin checks.
- The owner records paid expenses with category, actual configured method, amount and CDF/USD currency; reviews the B6a journal; links reversal or replacement to a mistaken entry; separately attests actual money recovered; and records reasoned cash additions/removals. Cash-paid expenses already affect physical cash, so the screen warns against a duplicate cash removal. Stock receiving and waste do not create expense evidence. External mobile money remains restaurant-recorded and provider-unverified.
- The B6b day view confirms the establishment IANA zone, attests opening cash only in that local day, previews the selected day, waits until its stored midnight boundary for count and final close, and displays expected cash, discrepancy, outstanding balances/refunds and open work by currency. Missing values are styled differently from attested zero. Applicable exceptions require acknowledgement and a reason. Closing needs explicit confirmation. Prior immutable reports display linked later adjustments, with paging beyond the first 100.
- Uncertain B6a writes keep their exact in-memory envelope and call the read-only recover route. For uncertain B6b writes, the client rereads current state or a closed report and allows only an explicit identical-envelope retry. Stale responses refresh state. Sign-out, access loss and establishment changes clear private financial state; no financial journal or offline write queue is browser-stored.

## Backend compatibility and rollout

The screen was compared with Backend's implemented `0144` B6a and `0145` B6b service, then exercised through the real isolated Backend over HTTPS. It uses currency-keyed `outstanding`, `refs` for open work, paid-expense and actual-recovery method totals, and the paged `adjustments` endpoint. B6b's implemented `restaurant_day_not_open` and `restaurant_day_not_ended` guards govern opening, count and close. The same-origin Personal gateway validates these exact paths, query limits and write bodies.

Apply `0145` after `0144` and enable all B6b owner routes before releasing Website and Business together. Confirm the real establishment zone and payment methods before operational use. No production deployment was performed.

## Validation and remaining acceptance

- Website daily gateway tests: 4 passed. TypeScript, changed-file ESLint, production build, translation parity with Business and `git diff --check` passed.
- Complete Website Vitest suite: 695 passed, eight inherited failures in `tests/shida-page.test.tsx` and its `.s3a-local/09b2-head-source` copy; no new failure identities.
- Real Backend TLS browser flow passed with a clean runner exit for Personal expense, current-day preview, opening CDF/USD, after-midnight count, explicit close, protected prior report and a later linked reversal. It checked 390px horizontal fit. A test-only read-only clock control in the disposable Website fixture aligns browser and Backend time; production has no such route.
- Physical-device and live-establishment acceptance remain: real mixed CDF/USD cash and external-method reconciliation, actual refunds and open work, DST, concurrent stale writes, uncertain transport, and pagination beyond 100 adjustments. The inherited full-suite gate remains unresolved.

Changed files: `app/components/shida/restaurant-seller-workspace.tsx`, `app/components/shida/restaurant-daily.tsx`, `app/components/shida/restaurant-daily.css`, `app/lib/restaurant-seller-contract.ts`, `app/lib/restaurant-daily-contract.ts`, `app/lib/restaurant-daily-copy.ts`, `tests/restaurant-daily-contract.test.ts`, `tests/browser/restaurant-daily.browser.ts`, `tests/integration/restaurant-service-backend.py`, and this handoff.
