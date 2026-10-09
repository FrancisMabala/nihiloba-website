# RM-V11-09B2: guest restaurant ordering

The permanent general-menu QR now opens the public restaurant page with an account-free pickup ordering section. Each confirmed round becomes an immutable canonical order in the same private visit. The guest can see all round references and states, compose another basket, cancel where permitted, and reveal the private pickup code only for a ready round. Completed, active and excluded order amounts remain separate in CDF and USD. No amount is described as payment received or verified.

This batch is implemented locally. Nothing was deployed, committed or pushed. The Backend 09B1 contract is consumed unchanged; no contract blocker required a Backend edit. The full release gate remains failing because of inherited failures described below. [Machine-readable validation manifest](evidence/restaurant-guest-validation.json).

## Repository changes

| Repository | Changes |
| --- | --- |
| `nihiloba-website` | Exact guest contract validators and same-origin HTTPS proxy; guest visit/basket/order interface and FR/EN/LN/SW copy; shared menu choice extracted from signed checkout; read-only public menu pagination; public-menu QR links preserved independently of WhatsApp continuation availability; unit/browser tests, disposable Backend/TLS runners, screenshots and this report. |
| `Backend` | No 09B2 source, migration, configuration, database or gate changes. Existing 09B1 migration and service were inspected and exercised through isolated validation. |

Production files: `app/api/shida/restaurant-guests/[...path]/route.ts`, `app/api/shida/restaurant-menus/[establishment]/route.ts`, `app/lib/restaurant-guest-{contract,browser,copy}.ts`, `app/components/shida/restaurant-guest.{tsx,css}`, `restaurant-menu-choice.tsx`, `restaurant-checkout.tsx`, `restaurants.tsx`, and `app/services/shida/restaurants-client.ts`. Signed checkout reuses the extracted menu selector with its existing behavior. Seller and counter implementations are unchanged.

Test/support files: `tests/restaurant-guest.test.ts`, `tests/restaurants-marketplace.test.tsx`, `tests/browser/restaurant-guest.browser.ts`, `tests/browser/restaurant-detail-design.browser.ts`, `tests/integration/restaurant-guest-{backend,checks,tls}.py`, `tests/integration/restaurant-https.mjs`, and `scripts/restaurants-fixture-fetch.mjs`. The existing detail geometry test now scrolls instantly before measuring, eliminating a smooth-scroll race exposed by the longer page. Type/lint exclusions cover generated local validation snapshots and browser output; application files remain checked. No dependency was added.

## Contract and privacy

The proxy permits only the 09B1 entry, visit, basket, quote, submit, order, pickup-code and cancellation paths with their exact methods and bounded bodies. It rejects extra query/body fields, table/payment/auth payloads and redirects. It requires HTTPS on both sides, checks write Origin with the existing same-origin validator, rejects cross-site requests, and returns `private, no-store` on success and errors. Production TLS termination must overwrite `X-Forwarded-Proto` and prevent direct untrusted access to the application port.

Only the single matching `__Secure-restaurant-visit` cookie is forwarded for private requests. Personal/Business cookies and Authorization are excluded. The Backend cookie must retain `HttpOnly`, `Secure`, `SameSite=Strict`, no Domain and the exact establishment/visit Path. Creation and deletion rewrite that Path to `/api/shida/restaurant-guests/establishments/E/visits/V`; it is never widened to the restaurant page or all visits. An unexpected authority property in upstream JSON fails closed. Private responses bypass caching and logging of request payloads/secrets; the consumer introduces no guest analytics.

The secret never enters browser JavaScript, URLs, storage, application logs or screenshots. Optional session storage contains only public visit/basket navigation references. Preferences, basket contents, quotes, receipts, pickup codes and pending action envelopes stay in memory. Losing private authority or forgetting the visit clears private screen data and navigation references; a generation check prevents late responses restoring them. Forgetting does not cancel canonical orders. Closing a visit stops new rounds while retaining authorized order access.

Eligible pickup windows come directly from guest entry, including windows already in progress. Existing signed-in `ordering_available` does not gate guest entry. Closed intake and no eligible window have distinct unavailable states. Menu grouping, Malewa plates, food preferences, receipt terms and localized canonical states are reused.

Keyed mutations retain their original serialized operation key and the action's revision/quote fields. Uncertain writes are never retried automatically: reconnect first rereads visit and relevant basket/order state, then an explicit retry uses the original envelope. A submitted basket recovers its linked canonical order without writing a second order. A confirmed submit followed by a failed summary read still displays its reference/status, but hides stale category totals. Focus/reconnect reads arriving during a mutation wait for that request to settle. Stale quotes require a fresh review. Rate limits honor Retry-After; background reads back off, stop when hidden/offline, and poll only active rounds.

Pending, accepted, preparing, ready, rejected, cancelled, expired and handed-over states are presented separately. Ready-only pickup display rereads authorized current state and the private endpoint; it is cleared on status/revision change, offline/stale state or lost access. The order reference is explicitly not collection proof. Payment remains outside SHIDA and unverified.

## Validation

Read before editing: repository instructions, installed Next.js 16.3.4 route-handler and server/client component guides, restaurant detail/checkout code, and [Backend 09B1 contract](../../Backend/docs/restaurants_rm_v11_09b1_guest_visits.md). Alembic script inspection confirmed **0138 is the sole head** without connecting to an application database. Final frontend commands use Node **24.19.0**, satisfying the repository engine requirement.

| Check | Result and scope |
| --- | --- |
| Production build | Passed on final application source. |
| TypeScript `--noEmit` | Passed. |
| Guest/proxy/shared-selector test and lint scope | **11 guest unit tests pass**; targeted ESLint passes. |
| Complete frontend unit suite | **336 passed, 4 failed, 340 total.** Four original SHIDA public-presentation failures remain. |
| Complete frontend lint | **9 errors, 2 warnings.** Reproduced on the six original-HEAD files responsible for those messages; no new diagnostic category. |
| Real-Backend HTTPS Chrome guest browser | **16 passed.** Production website build, real 09B1 routes/services, isolated ordinarily durable SQLite database, synthetic seller controls and fresh localhost-only TLS certificates. |
| Focused supported Backend validation | **101 passed, 0 failures/errors/skips**; ordinarily durable isolated SQLite. Guest visits, guest HTTP, guest migration, R3A2 and Personal API. |
| Existing signed-in/seller/public browser regression | Final aggregate **14 passed, 17 failed**, 31 distinct tests. All 17 remaining failure nodes reproduced on an isolated original-HEAD production build. Both signed-checkout recovery paths pass. |
| Whitespace | `git diff --check` passes. |

The four frontend unit failures are the existing `tests/shida-page.test.tsx` assertions for English Wenze presentation, direct-entry versus confirmation QR references, future-facing Personal QR/payment copy, and synchronized French marketplace routes. Both that test and `shida-page.tsx` match original HEAD. The previous [basic-release report](restaurants-basic-release.md) documents these four failures. Lint diagnostics remain in existing checkout/customer-orders/inventory/review/seller-review files and the existing signed-checkout browser test. Baseline reproduction copies live under ignored `.s3a-local`; unrelated implementation was preserved.

The first supported Backend selection produced 100 passing tests and one migration fixture error caused by inaccessible global Windows pytest temp storage. The supplemental migration run passed both tests using a workspace-local temp directory. The runner now assigns a unique workspace-local temp directory by default; the final complete selection passed all **101** tests in run `05c706313b0c451a8a74f1b9737f1c25`. This infrastructure error was not a Backend contract failure.

The initial existing browser regression run had 13 passes and 18 failures. An isolated original-HEAD build (`7fd60052a1b32befb05fca0ce941202d7ce6a813`) reproduced 17 failures and passed 14 tests. Those 17 failure nodes match exactly: four locale-specific intake tests and 13 seller tests expect controls/structures absent from the current baseline (including My profile, intake/portion editor and menu pagination). They remain unresolved; source preservation and passing checkout tests do not establish a clean seller acceptance gate. The additional 390px geometry failure was a synchronous measurement during global smooth scrolling. After changing that test to scroll instantly, all four public-detail browser tests pass on the guest-enabled build. Final aggregate counts combine the initial selection with this focused rerun, not a claimed second complete passing run. Current selection used one worker; HEAD comparison used three independent browser workers. Exact nodes are in the manifest.

Backend full-suite and PostgreSQL concurrency evidence is inherited, not rerun by this batch: 09B1 documents **7,586 passed, 293 failed, 890 skipped**, matching its documented 293 baseline failures. Its PostgreSQL races and base/previous-head migration rehearsals are described in the contract report. The complete Backend release gate remains failing; baseline failures are not waived. Current browser SQLite bootstrapping is not a substitute for migration rehearsal.

## Browser and phone acceptance evidence

The real-Backend browser checks cover:

- Permanent QR entry without a Personal/Business account, two independent browser contexts scanning the same QR, distinct HttpOnly/Secure/Strict path-scoped cookies, denial of cross-guest reads and missing-Origin writes.
- First and repeat immutable rounds, grouped Malewa plates and preferences, preserved original rounds, separate completed **1500.25 CDF** and active **2.50 USD** amounts, and exclusion of cancelled/rejected/expired amounts.
- Seller acceptance, preparation, readiness and handover; no pickup button before ready, private code only for the authorized ready guest, and removal after handover.
- Stale quote, revised pricing, direct cancellation, preparation-stage cancellation request/approval, rejection and expiry.
- Cookie loss, immediate private-screen clearing, new independent visit and path-specific forgetting without cancelling existing orders; closed visit retains cancellation/read access.
- Closed intake, no eligible window, the actual 40-basket visit cap, rate limiting and temporary failure.
- Lost submission response both after Backend commit and before receipt; reconnect reads first, preserves the original envelope, and produces exactly one canonical round.
- Confirmed submission followed by failed summary read; retained reference/status and hidden stale totals.
- FR 320px, EN 390px, LN 768px and SW 1280px without horizontal overflow; a 390px journey with 200ms latency, 32 KiB/s download and 16 KiB/s upload.

Screenshots contain synthetic establishment/order data and no secret or pickup code: [phone two-round summary](evidence/restaurant-guest-phone.png), [FR 320](evidence/restaurant-guest-fr-320.png), [EN 390](evidence/restaurant-guest-en-390.png), [LN 768](evidence/restaurant-guest-ln-768.png), [SW 1280](evidence/restaurant-guest-sw-1280.png). Phone screenshots were visually inspected for wrapping and readable round/currency presentation. These are Chrome viewport/network emulations, not physical-device or native-speaker acceptance.

## Reproduction

Generate disposable test certificates with a Python environment containing `cryptography`: `python tests/integration/restaurant-guest-tls.py`. They are stored under ignored `.s3a-local/09b2-tls`, expire after seven days and do not install system trust. Start `Backend/venv/Scripts/python.exe tests/integration/restaurant-guest-backend.py`; this fixture blocks non-loopback network access, disables dotenv loading and uses a new database under this website's `.s3a-local`, with test-only seller controls and no provider messages.

Build the website, then start `node tests/integration/restaurant-https.mjs` with `SHIDA_API_BASE_URL=https://localhost:3443`, `RESTAURANT_TEST_TLS_DIR=.s3a-local/09b2-tls` and `NODE_EXTRA_CA_CERTS` pointing to that certificate. Run `node node_modules/@playwright/test/cli.js test --config playwright.restaurant.config.ts tests/browser/restaurant-guest.browser.ts` with `RESTAURANT_ACTUAL_BACKEND=1`, `RESTAURANT_GUEST_BACKEND=1`, `RESTAURANT_TEST_EXTERNAL_SERVER=1`, and `RESTAURANT_TEST_BASE_URL=https://localhost:3014`.

Run supported isolated Backend checks from the website with `Backend/venv/Scripts/python.exe tests/integration/restaurant-guest-checks.py`. This uses the Backend's `scripts/run_platform_validation.py`, relocates disposable evidence into the website workspace, and selects guest visits, guest HTTP, guest migration, R3A2 and Personal API checks. No production database or Backend dotenv is used. Fixture controls and fetch interception are opt-in test infrastructure, never production imports.

## Remaining risks and deployment order

Inherited frontend unit/lint and Backend full-suite failures still block a clean full release gate. Human FR/EN/LN/SW review, physical phones, and the actual production TLS/Origin/cookie/QR configuration require acceptance before rollout. The original seller browser harness has stale control expectations; detailed final results and original-HEAD comparison are recorded in the manifest.

09B1 rate limits use the ASGI peer identity, never forwarded caller headers: 120 requests/minute and 10 visit creations/10 minutes per source. A same-origin proxy shares an egress peer across guests. Assess aggregate capacity and tune the existing operational policy before production traffic; this consumer does not spoof identity or weaken the limit. Synthetic fixture seeds clear only their disposable rate buckets.

There is no persistent offline action queue. If a tab is closed during an uncertain write, the original action envelope is lost; reopening uses public navigation references and current canonical Backend state to recover any committed round. Lost visit creation cannot recover its secret: the UI explains that no order was submitted and permits an explicit new visit. Forgotten/lost authority cannot be recovered with the general QR or order reference.

For a later approved deployment:

1. Apply Backend migration **0138** before guest-aware Backend code.
2. Coordinate any pause through the existing web-intake gates. Upgrade every Backend instance and maintenance process before enabling guest obligations; old workers can misclassify account-free customer orders.
3. Ship this website against that Backend over HTTPS. Verify canonical write Origin, trusted TLS termination, private no-store responses and exact cookie creation/deletion paths with the permanent QR.
4. Complete real phone, localization, lost/reconnect and seller pickup acceptance, then enable only the intended existing intake scopes. This batch changes no gate values.

After guest evidence exists, do not roll back to pre-guest workers/application code. Close new intake and forward-fix. No table setup/delivery, auto-accept, waiter/bar/stock surface, payment recording or new tier gate was added.
