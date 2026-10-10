# RM V11 10F1 Service ordering and guest approval

RM-V11-10F1 adds Service ordering over completed Backend 10B1/10B2. An explicit Send for preparation creates an assisted round; counter POS continues to complete food already physically handed over. Group responses show individual original order references, states and CDF/USD amounts. They are not a payable bill, balance, paid receipt, invoice or sales ledger.

## Access and ordering

Business Owner/Admin use the Service tab and the existing narrow grant plus assignment editor extended for service_work and function service. Staff/Recruiter use /businesses/{B}/service and the exact self-only GET /restaurants/stations/service/assignments?page=1 bootstrap. Every delegated menu, group, basket, quote, submit, receipt, proposal and handover request carries assignment_ref and assignment_revision in its query. Management capability projections intentionally deny staff; the Service bootstrap and bound API are the worker authority. Worker Service does not read owner establishment management/summary data or expose grants, stock, payments or preparation actions. Existing assigned Kitchen navigation remains separate.

Personal Pro sellers use the same owner Service structure inside their Personal restaurant workspace. Canonical menu items, grouped Malewa plates, quantities/amount portions, food preferences and authoritative receipt terms are preserved. Each additional round starts a fresh basket. Handover requires a ready assisted order and explicit confirmation that food was physically given to its recipient. Current owner Kitchen is the available preparation route; assigned Kitchen does not prepare assisted rounds in this batch.

Writes keep their serialized action, operation key, revisions and complete assignment locator in memory. Uncertain results block fresh actions. Reconnect and explicit retry first reread current authority and canonical state; retry sends exactly the original envelope. Conflicts reread state and require a new quote where appropriate. Background reads disable controls while holding the request lock. Access errors and sign-out clear protected menu, group, preference, receipt, draft and pending action data. Renewed assignments use their new generation and remount cleared work. There is no browser-storage queue or private receipt/preference persistence. Visible polling is bounded with backoff, and the screens have FR/EN/LN/SW copy, phone-sized controls and a distinct preparation action.

## Guest consent

The NIHILOBA HTTPS proxy adds only GET service-proposals, POST service-proposals/{P}/approve and GET service-group beneath the existing establishment/private visit path. The exact path-scoped Secure HttpOnly SameSite Strict cookie, same-origin write checks, cookie-only private authority and private/no-store responses remain in place. No cookie value becomes JavaScript data or browser storage.

A proposal explains the original guest order reference and staff association. QR scanning, page entry and refresh perform no approval write. Approve sends explicit confirm:true with the original operation key, group_revision and visit_revision. Expired or changed proposals cease to be approvable and have a localized explanation. Approved staff rounds are identified as staff-entered and rendered without cancellation or pickup-code controls. The guest's original customer pickup actions remain on their own private rounds.

Decline dismisses that proposal in memory on the current device. 10B2 has no decline mutation endpoint, so no fourth guest endpoint or durable denial is invented. It creates no association; the proposal remains subject to Backend expiry, and any new proposal still needs a new explicit guest approval. Staff-only ordering works without a phone, after decline and after guest access loss. Only public visit/basket navigation references use the existing sessionStorage continuity mechanism.

## Deployment order

1. Keep existing intake gates and allowlist controlled. Apply Backend migration 0140; alembic heads was verified to return only 0140 (head).
2. Upgrade every Backend API and maintenance instance to completed 10B1/10B2 before creating Service grants, assignments or associations. Mixed Backend versions must not serve this traffic.
3. Release both frontend consumers together with the exact NIHILOBA guest proxy. Preserve production HTTPS, allowed origins, session binding and cookie paths. No new runtime dependency, environment setting, cron job or worker is introduced.
4. Run deployment preflight and device/language acceptance, then restore only approved intake settings and allowlist. Once evidence exists, close new intake and forward-fix rather than deleting evidence or forcing a downgrade.

No deployment, commit or push was performed. Backend source and production data were not changed.

## Remaining limits

This is not a complete staffed pilot. Preparation remains owner Kitchen only; assigned assisted-order Kitchen/Bar routing is later work. Money checkout/freeze/billing is later work within this same Service structure. There is no separate cashier screen, payment selector, tax invoice, expense flow or daily closing. Group close is irreversible closure to new rounds, not checkout.

Browser acceptance uses real Backend routes/services over loopback HTTPS, a fresh ordinary durable SQLite fixture and synthetic accounts. It is not a production or PostgreSQL concurrency certification. The existing Backend handoffs retain their own PostgreSQL evidence and inherited release gates. Human translation review and actual device acceptance remain rollout checks. Full frontend unit/lint baseline failures listed below remain unresolved and are not waived.

## Validation

| Check | Result |
|---|---|
| New Service and guest proxy/replay contract units | 13 passed |
| Focused original POS, Kitchen, pickup, guest, delivery and preference plus Service | 58 passed across 13 files (includes existing ignored snapshot copies selected by Vitest) |
| Full unit suite | 674 passed, 8 failed; same baseline 4 failures in tests/shida-page.test.tsx and 4 duplicate failures in .s3a-local/09b2-head-source/tests/shida-page.test.tsx (baseline 661 passed, 8 failed) |
| TypeScript and production build | Passed |
| Lint of changed files | Passed |
| Full lint | Existing 9 errors and 2 warnings; unchanged baseline |
| Real Backend Personal Service browser | Passed; stale quote, repeat rounds, ready-only assisted handover, paid loss and Free Orders resolution |
| Real Backend guest association browser | Passed; same-QR isolated visits, no implicit approval, expired/stale proposal rejection, decline, explicit approval, committed response loss with exact replay, cookie isolation, missing-Origin denial, no assisted action buttons, no private browser storage and access-loss clearing |
| Real Backend original counter POS browser | Passed; immediately handed-over sale, no Send for preparation or assisted handover action |
| Real Backend original guest pickup browser | Passed; independent same-QR visits, repeat rounds, ready-only private pickup code, handover and separate CDF/USD amounts on phone |

Website browser commands use RESTAURANT_ACTUAL_BACKEND=1, RESTAURANT_TEST_EXTERNAL_SERVER=1 and RESTAURANT_TEST_BASE_URL=https://localhost:3014. Run the new restaurant-service.browser.ts with RESTAURANT_SERVICE_BACKEND=1; run the existing restaurant-guest.browser.ts general QR case with RESTAURANT_GUEST_BACKEND=1. Seeded browser suites must run serially against this fixture because they share its test clock and intake allowlist.

The test-only Backend harness is NIHILOBA tests/integration/restaurant-service-backend.py, extending the existing private guest fixture. It disables dotenv, outbound transport and non-loopback connections and writes only disposable website-owned databases. Synthetic session/control routes are fixture-only; never import or serve this harness in production. Use the existing ephemeral TLS certificates and NODE_EXTRA_CA_CERTS for local production Next servers; do not disable production CSP or cookie security.

Local diagnostic logs and synthetic phone previews are retained under .s3a-local/rm-v11-10f1/. Acceptance results use final passing browser runs; earlier diagnostic failures are not acceptance evidence.

## Changed files

- app/api/shida/restaurant-guests/[...path]/route.ts
- app/components/shida/restaurant-guest.tsx
- app/components/shida/restaurant-order-screen.tsx
- app/components/shida/restaurant-seller-workspace.tsx
- app/components/shida/restaurant-service.css
- app/components/shida/restaurant-service.tsx
- app/lib/restaurant-guest-browser.ts
- app/lib/restaurant-guest-contract.ts
- app/lib/restaurant-orders-contract.ts
- app/lib/restaurant-seller-contract.ts
- app/lib/restaurant-service-contract.ts
- app/lib/restaurant-service-copy.ts
- app/lib/restaurant-work-copy.ts
- app/lib/restaurant-work.ts
- docs/restaurants_rm_v11_10f1_service_ordering.md
- docs/restaurants_rm_v11_10f1_validation.json
- tests/browser/restaurant-service.browser.ts
- tests/integration/restaurant-service-backend.py
- tests/restaurant-service-contract.test.ts
- tests/restaurant-service-guest.test.ts
