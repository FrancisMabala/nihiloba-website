# RM-V11-10F2 - Kitchen and Bar frontend integration

Handoff, 2026-10-10. Consumer: **Personal owner**. Frontend implementation complete; deployment remains held by the migration-head mismatch and existing release gates. No deployment, intake-gate changes, Backend edits, commit or push were performed.

## Contract and repository inspection

Read both frontend AGENTS.md instructions, bundled Next.js client/route documentation, existing owner and assigned Kitchen, 10F1 Service implementation and handoffs, and the completed [10B3 Backend contract](../../Backend/docs/restaurants_rm_v11_10b3_preparation.md). Both frontend trees were clean before editing. Existing Backend work was preserved.

Initial `venv/Scripts/alembic.exe heads` in Backend returned only `0141 (head)`. The final check returned only **`0142 (head)`**: concurrent uncommitted `migrations/versions/0142_restaurant_stock_workers.py` has `down_revision = '0141'`. The accompanying 10B4 report says the 10B3 contract is unchanged. This integration did not add or modify that migration or any Backend file. The requested sole-0141 final condition is no longer true; coordinate the Backend release lineage before rollout. This is an external repository change, not a demonstrated 10B3 contract defect. No blocking preparation API defect was found.

## Delivered behavior

- Organization Owner/Admin and Personal Pro preparation expose separate Kitchen and Bar views, original standalone items and plate components, food preference, station progress and canonical whole-order progress. Mixed work explicitly explains that one ready station cannot ready the entire order.
- Assigned Kitchen includes eligible staff-assisted work using only the Kitchen projection. Business has a separate assigned Bar destination discovered through the worker's current exact establishment assignment; no owner management, Service, handover, contact, receipt or money authority is inferred. Legacy whole-order Kitchen remains usable.
- Start/ready use the station APIs. Every worker station read, detail, feed, action and retry includes the immutable assignment reference and revision in its query, never in its action body. Bootstrap uses the contract's self-only assignment endpoint. The existing legacy proxy allowlist is retained for compatible callers; current preparation screens use 10B3 paths.
- Owners can resolve individual outstanding work through `orders/{O}/preparation/{station}` without paid queue/feed reads. Explicit recovery shows original station work and requires both confirmation and `cannot_fulfill` or `other`; it is never automatic. Recovery of one mixed station leaves the other station outstanding.
- Organization managers have narrow Bar grant and exact-establishment assignment controls. Item routing is always explicit. Saving Bar requires a fresh affirmative supported non-alcoholic-drink declaration; names and categories do not select a station. Revision conflicts reread current configuration and clear the attempted selection before another edit.
- An uncertain preparation action retains its exact URL, method, serialized body, operation key, session binding and detail URL in component memory. Refresh/reconnect never submits it. An explicit exact retry rereads worker authority and current state first. A definite stale write discards that rejected envelope, refreshes, and requires Review refreshed order before a new action/key.
- Private preparation and pending state clear on sign-out, access loss, account/context or assignment-generation change. Late responses cannot repopulate old scopes. Nothing stores preparation details or actions in localStorage/sessionStorage. Existing language/context preferences remain unrelated.
- Visible, online reads use bounded queues/feed limits with one in-flight request and 15-second polling/backoff capped at 120 seconds. Assignment manager/navigation reads use 30-second polling/backoff capped at 120 seconds. Hidden/offline views do not poll. FR/EN/LN/SW labels and responsive controls have at least 44px height, visible boundaries and keyboard focus.
- Service round summaries can display canonical station states while ordering and handover remain in Service. Existing stock and payment workflows remain separate. No cashier, payment recording, alcohol, partial quantity/handover, live transport or second ledger was added. Payment remains unverified.

## Validation evidence

| Check | Result |
|---|---|
| Focused unit checks | 32 passed, 0 failed |
| Full frontend unit suite | 687 passed, 8 failed; exact same failed nodes as pre-edit baseline (674 passed, 8 failed); 0 new failures |
| Production Next build | Passed |
| TypeScript `tsc --noEmit` | Passed |
| Changed TS/TSX/browser files ESLint | Passed, no findings |
| Full repository ESLint | 9 existing errors, 2 existing warnings; matches baseline |
| Translation validation | 46 keys per locale; four-language parity, no duplicates, both consumers match; nine Backend preparation labels match exactly |
| Whitespace | `git diff --check` plus untracked source/document whitespace passed |
| Backend migration head | Initial sole 0141 passed; final sole 0142 fails the requested sole-0141 condition; unrelated 10B4 work preserved |
| Real Backend browser | 1 passed against final production build, loopback HTTPS and fresh durable SQLite fixture |

The full suite failure identities are recorded in [validation JSON](restaurants_rm_v11_10f2_validation.json). Website's inherited failures are in `tests/shida-page.test.tsx` (4) and the existing ignored `.s3a-local/09b2-head-source/tests/shida-page.test.tsx` snapshot (4). Business's 20 inherited failures are in `tests/restaurant-workspace.test.tsx`. These match the documented 10F1 baselines and the pre-edit reruns; they were neither fixed nor waived. Business inherited lint findings remain in inventory/reviews and their existing test warning. Website inherited lint findings remain in unrelated hero, hospitality/editor and checkout files.

Business real-browser acceptance exercises Owner and Admin access, routing declaration and conflict refresh, original assisted Kitchen plate work, absence of worker management reads/recovery, a lost committed start response with exact explicit replay after reconnect, deterministic stale revision and review, mixed independent readiness, Bar-only readiness, grant revocation clearing, regrant with a new assignment reference, all four languages, phone layout and explicit per-station owner recovery. Website acceptance exercises Personal Pro mixed and Bar-only work, legacy whole-order Kitchen, paid-access loss, Free individual work without paid reads, lost committed recovery and exact replay with confirmation/reason, independent recovery of each station, 390px/320px layout, storage privacy and sign-out clearing. Mounted tests also cover 401/403/404 loss, late responses, stale assignment retry prevention, generation remounts and narrow manager revisions.

Local evidence is in `.s3a-local/rm-v11-10f2/` (ignored, intentionally not committed). See the manifest for log names and changed-file inventory. Real-browser checks were run serially. Phone screenshots were inspected; worker preparation action height is asserted in each language. This is synthetic loopback acceptance, not production or PostgreSQL concurrency certification. The fixture extends the existing isolated 10F1 harness, disables dotenv/outbound transport, and never imports fixture controls into production.

## Reproduction

Use Node CLIs directly on this Windows checkout: `node node_modules/vitest/vitest.mjs run`, `node node_modules/typescript/bin/tsc --noEmit`, `node node_modules/eslint/bin/eslint.js <changed files>`, `node node_modules/next/dist/bin/next build`. Read `final-tests.json` for structured failed-node identities; nonzero full-suite/lint exits are inherited, not a green full-repository result.

Start `C:/NIHILOBA/Backend/venv/Scripts/python.exe tests/integration/restaurant-preparation-backend.py` from Website with the existing ephemeral fixture TLS certificates. Use `NODE_EXTRA_CA_CERTS` for that certificate and `SHIDA_API_BASE_URL=https://127.0.0.1:3443` (localhost resolves only IPv6 in this environment), keeping TLS verification enabled. Build and serve Website/Business with their respective `NEXT_PUBLIC_APP_ORIGIN=https://localhost:3014` / `https://localhost:3015` and existing `tests/integration/restaurant-https.mjs` helpers. Certificates are ephemeral, never trusted system-wide.

Run Business with `RESTAURANT_PREPARATION_BACKEND=1 node node_modules/@playwright/test/cli.js test -c playwright.restaurant.config.ts tests/browser/restaurant-preparation.browser.ts`. Run Website separately with the same flag plus `RESTAURANT_ACTUAL_BACKEND=1`, `RESTAURANT_TEST_EXTERNAL_SERVER=1` and `RESTAURANT_TEST_BASE_URL=https://localhost:3014`. Synthetic controls exist only in the disposable fixture process. Never deploy or import that fixture into production.

## Limitations and rollout order

1. Reconcile the concurrent Backend 0142/10B4 work with the requested 0141 release lineage. Preparation needs the completed 10B3 schema/API on every Backend instance before either frontend consumes it. Do not remove somebody else's migration or silently downgrade.
2. Keep existing production intake gates and readiness status unchanged. The inherited frontend suite/lint release gates, human FR/LN/SW review and actual-phone acceptance remain required; this handoff does not waive them.
3. Release both frontend consumers together after Backend readiness is established. Review legacy Kitchen, Personal Free recovery and Organization authorization on the intended release environment before operational activation.
4. An authorized manager explicitly configures each intended Bar item and affirms its supported non-alcoholic-drink status, then grants `bar_work` and assigns the exact establishment to each approved Staff/Recruiter. Existing accepted orders retain captured original routes; existing unconfigured orders retain legacy Kitchen behavior.
5. Perform controlled mixed/Bar-only acceptance and revocation checks before any separately approved intake change. Monitor Backend denial/conflict rates and instruct workers to use explicit review/retry/recovery flows. No intake changes or rollout were performed here.

## Changed files

- `app/api/shida/personal/restaurants/[[...path]]/route.ts`
- `app/components/shida/restaurant-kitchen.tsx`
- `app/components/shida/restaurant-order-screen.tsx`
- `app/components/shida/restaurant-preparation-routing.tsx`
- `app/components/shida/restaurant-preparation.css`
- `app/components/shida/restaurant-preparation.tsx`
- `app/components/shida/restaurant-seller-workspace.tsx`
- `app/components/shida/restaurant-service.tsx`
- `app/lib/restaurant-orders-contract.ts`
- `app/lib/restaurant-preparation-contract.ts`
- `app/lib/restaurant-preparation-copy.ts`
- `app/lib/restaurant-service-contract.ts`
- `app/lib/restaurant-work.ts`
- `docs/restaurants_rm_v11_10f2_preparation.md`
- `docs/restaurants_rm_v11_10f2_validation.json`
- `tests/browser/restaurant-preparation.browser.ts`
- `tests/integration/restaurant-preparation-backend.py`
- `tests/restaurant-kitchen.test.tsx`
- `tests/restaurant-preparation-contract.test.ts`
