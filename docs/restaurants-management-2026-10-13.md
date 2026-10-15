# Restaurant management workspace — 13 October 2026

Local implementation; no deployment, commit or push. Restaurant readiness remains **Partial** until the release gates below close.

## Result and scope

The founder's screenshot showed authenticated work inside the public-site shell: public navigation/cart/footer, a large establishment title, two language controls, a global photo banner and two rows of task links. The Personal seller routes now have a dedicated SHIDA shell with a marketplace exit, one four-language menu and separate working account actions. One establishment opens Orders, zero starts private setup, and multiple establishments require selection. No speculative daily totals were added.

The compact identity bar displays the establishment and publication status. Native expandable navigation groups organize Orders, Preparation, Service, Stock, Money, Reservations, Menu and Settings. On phones/tablets the navigation expands through an accessible button; actions remain keyboard accessible. Capability responses govern advanced destinations; existing-obligation Orders remain available when intake is closed. Setup and adding another establishment remain available.

Restaurant photos sit beside identity in Settings. Menu items have a thumbnail/empty-photo state and their own photo action. Batch entry sits beside Add item. The protected photo editor, preview/consent, immutable retry operations and item removal remain intact. Restaurant-photo removal is not offered. Business retains its existing Organization shell, with the same Restaurant task groups, entry behavior and one shared language menu; unrelated Business areas were not redesigned. Business's existing photo workflow was not expanded in this batch.

## Backend policy and preservation

During the explicitly requested pre-purchase period, the Backend Restaurant bundle resolver allocates implemented Personal Pro to eligible Personal owners and implemented Restaurant Business to eligible Organization owners/admins. Commercial subscription resolution remains separate. No synthetic subscription, member grant, payment, order or stock transaction is created to grant access. Organization-only tables/team boundaries, exact ownership, current membership/role, activation, staff grants/assignments, revisions and intake allowlists remain enforced at the existing service/API boundaries.

The stock policy gives owners without a subscription a fixed pre-purchase generation boundary (13 October 2026 UTC), requiring a fresh count/binding and exact staff assignment where applicable. Existing holds are retained. The patch does not claim SHIDA payment verification or modify transaction attribution/idempotency.

Two preservation defects discovered during validation were also corrected: a Next route's unsupported helper export was moved unchanged to a library module; a WhatsApp public-menu resume import shadowed the public menu function and now uses an alias. Restaurant migration tests now assert the already-existing schema head 0152; no migration was added. The foundation conversation test now traverses the existing optional-photo step.

## Evidence

Screenshots use synthetic authenticated API fixtures against production builds, not a live operator account. They include a long establishment name and truthful empty Orders. Personal screenshots cover FR/EN/Lingala/Swahili at 360, 820 and 1440 px; matching menu screenshots show contextual item photos. Business screenshots cover 360, 820 and 1440 px.

- [Personal phone](evidence/management-fr-360.png), [tablet](evidence/management-fr-820.png), [desktop](evidence/management-fr-1440.png)
- [Menu phone](evidence/management-menu-fr-360.png), [menu desktop](evidence/management-menu-fr-1440.png)
- [Business phone](evidence/management-business-fr-360.png), [tablet](evidence/management-business-fr-820.png), [desktop](evidence/management-business-fr-1440.png)

The browser checks exercise zero/one/multiple establishments, language/account controls, real logout endpoint invocation through fixtures, session loss, capability-hidden destinations, menu/profile photo placement, protected upload consent and exact retries. See the final validation register below for counts and limitations. No live messages or operational records were created.

## Subscription transition and existing obligations

Keep `RESTAURANT_PREPURCHASE_ACCESS` enabled until Restaurant subscriptions can actually be purchased and the reviewed purchase rollout is ready. Do not treat temporary access as a purchased entitlement or backfill subscriptions. Validate commercial resolution, subject boundaries, duplicate-subscription rejection and the new purchase journey before switching the policy.

Give operators clear notice of the transition, supported purchase/recovery routes and the effective date. Switching back must stop only newly unavailable work. Preserve accepted orders and their fulfillment/cancellation, exact money/receipt recovery, stock holds, reservations, audit history and durable QR identities. Use the existing downgrade/recovery paths, never duplicate an order/payment to finish an obligation. Test both subscribed and unsubscribed owners, stale/revoked staff grants and exact worker assignments. On renewed stock access require the existing fresh count/binding/assignment generation rules. Never silently discard pending operations or allow a replay under stale authority.

## Rollout order and remaining acceptance

1. Review Backend authorization and transition diff; close the consolidated final-tree Restaurant pilot gate. Apply no new migration from this batch; the repository already contains head 0152.
2. Deploy Backend policy first in staging, preserving all existing Restaurant intake/allowlist settings. Confirm eligible unsubscribed Personal and Organization access and denial for wrong owners, inactive Organizations and ungranted staff.
3. Roll out the Personal Website and scoped Business Restaurant changes after Backend compatibility checks. Verify shared login, logout, switching, menu/QR and uncertain-write recovery with controlled test accounts.
4. Obtain physical phone/tablet and Lingala/Swahili copy acceptance; then authorize the staged pilot separately. This work does not authorize deployment or widen intake.

Production/staging authenticated smoke, physical-device testing and a consolidated final-tree gate run remain separate acceptance items. Browser screenshots validate synthetic sessions only. Business's broader browser suite still contains older profile-first assumptions and needs follow-up migration to the new navigation before claiming that entire suite green.

## Validation register

| Check | Result |
| --- | --- |
| Personal production browser checks | 60 passed; includes 15 management cases and 8 protected seller-photo cases |
| Business responsive browser checks | 3 passed, including the shared language menu; synthetic sessions |
| Website scoped unit tests | 353 passed in 34 files |
| Business Restaurant/capability/authentication unit tests | 297 passed in 25 files |
| Backend temporary access, intake and future commercial transitions | 185 passed |
| PostgreSQL default pre-purchase/ownership/intake checks | 90 passed |
| Backend scoped SQLite pilot diagnostic | 2,691 passed, 113 failed, 21 skipped before corrections |
| SQLite corrections | All observed failures resolved: 89 passed in the first recheck, 1 foundation-photo journey passed separately, 42 Restaurant shard-0 cases passed, and all 16 shared migration cases passed |
| PostgreSQL pilot diagnostic | 460 passed, 2 failed on stale schema-head assertions, 4 documented skips |
| PostgreSQL corrections/additions | The entire affected assisted-order group passed (15); all 4 photo concurrency cases passed. Equivalent distinct gate coverage: 466 passed, 4 documented skips |
| Skip manifests | Zero unexpected skips in both dialects after explicit photo classification and PostgreSQL execution |
| Production builds | Website and Business passed with webpack, including TypeScript validation |
| Static checks | Modified frontend files lint clean; 57 modified Backend Python files compiled; cross-repository diff checks pass |

The SQLite diagnostic's 113 failures were 55 stale head assertions, 53 pre-purchase/commercial expectation mismatches, one outdated optional-photo journey and four locales exposing the public-menu resume bug. Assertions for authorization, exact retries, data preservation and commercial downgrade recovery were retained. No tests were removed or silently skipped. The PostgreSQL gate now selects the previously omitted photo races, and its offline/current-head checks track the existing 0152 schema.

These are a complete diagnostic plus focused correction reruns, **not a new uninterrupted full gate run on a frozen final tree**. The full platform suite was not run. The initial broad Website browser invocation also selected public-photo tests requiring a separate server fixture; those were not valid in the synthetic seller-only preview and are not counted as passing. The final 60-test command explicitly selects the seller scope. Full Website public/guest and Business browser acceptance remains separate.

[Exact changed-file manifest](evidence/management-changed-files.json). Main implementation files are Website `site-chrome.tsx`, `site-document.tsx`, `restaurant-seller.tsx`, `restaurant-seller-workspace.tsx`, `restaurant-seller.css` and management copy; Backend bundle/entitlement/inventory/assignment services, the public conversation alias, policy/transition tests, migration assertions and pilot scripts; Business Restaurant workspace/CSS, its scoped use of the shared language menu, and tests. Guest cookie code was moved unchanged into `restaurant-guest-cookie.ts`. The manifest excludes the user's pre-existing Services edits.

Historical tracker evidence is retained. Current pilot rows and MGT01 explicitly remain Partial where the complete final-tree/browser/staging evidence is still outstanding. No new schema migration, runtime environment setting, dependency, worker, cron job or message template was introduced.

Suggested commit message (not executed): `Redesign Restaurant management and enable scoped pre-purchase access`.

## Seller workflow correction follow-up — 13 October 2026

Status: **Partial, local Website, Backend and Business work only; no deployment, commit, push or intake change.** This is the current release-tracker update for the founder's six live-screen concerns. The six screenshot files were not available in this workspace; the reported live behavior was compared with the local Website, Business and Backend source and the handoff above. The previous management and pre-purchase changes remain local, so their absence on the live site is a deployment-state gap.

| Area | Local Website correction | Remaining release or contract work |
| --- | --- | --- |
| Orders | Starts with active work, names the next action, removes duplicated heading and empty pagination, explains closed intake and links authorized owners to intake settings; history and accepted orders remain reachable. | Deploy Website after Backend compatibility and owner testing. |
| Statistics | Uses “Statistiques des commandes”; explains that handed-over value is not a payment, loads coverage first, and places the activation explanation/action before date controls. | No historical backfill or verified-revenue claim. |
| Preparation | Kitchen/Bar queue is the Preparation destination; per-item routing sits under Menu as “Où préparer chaque article ?” on Website and Business. | Confirm live station grants. Bar remains non-alcoholic only. |
| Service | Paid owners enter assisted visits. Exact-reference bill recovery has a separate Finances entry on Website and Business; unpaid existing obligations remain reachable when paid access ends. | Confirm real two-round/receipt flow. |
| Counter | Menu appears before basket creation; first item creates a canonical basket. Selected lines, separate CDF/USD running estimates, exact quote and handover remain distinct. After handover the seller sees the existing canonical bill, selects a configured payment method and currency, records the actual amount through the existing money endpoint, and can reopen the bill from recent POS receipts. | Backend counter finalize now creates one closed service bill link in the same stock/order transaction, returns `bill_group_ref` on handover and replay, and reuses existing bill/payment/receipt/refund and idempotent recovery rules. Old counter receipts have no fabricated historical bill. External payments remain `payment_verified: false`. Deploy Backend before either frontend. |
| Finances | Owner navigation exposes daily operations, declared expenses, cash counts, reports and exact bill recovery. The daily overview now separates linked order value, recorded net collections, outstanding balance, expenses and cash variance for CDF and USD. | Backend daily projection now supplies read-only `bill_summary` totals from canonical linked orders and allocated money. Older report payloads without this field remain readable. Existing historical counter sales without a linked bill are excluded; neither external payment verification nor profit is inferred. |
| Reservations | Shows the request flow, current intake state and prerequisites; separates receiving requests from accepting one and hides empty pagination. | Verify controlled live intake and Business parity. |

The Backend source has `RESTAURANT_PREPURCHASE_ACCESS = True` locally. A read-only HTTPS request to `https://api.nihiloba.com/api/dashboard/capabilities` reached the deployed server with valid TLS and returned HTTP 401 without a seller session. The authenticated deployed owner/Organization capability response therefore remains unverified; local source and synthetic fixtures cannot establish production policy. Keep MGT01 and pilot launch **Partial** until authenticated deployed Personal-owner and Organization-owner/admin responses confirm the expected Restaurant POS, Kitchen and finance capabilities, with negative checks for wrong owners, inactive Organizations and ungranted staff.

The canonical workbook `Backend/docs/evidence/restaurants_whatsapp_2026_10_12/release_validation_tracker.xlsx` has updated P07, P08 and MGT01 evidence and remains **Partial**, preserving six sheets and twelve formulas. Website and Business production builds/typechecks pass. Website focused units passed 138; Business focused units passed 40. The authoritative frontend gate passed Website units/build/typecheck/lint and Business build/typecheck; a Business access-test timeout in that concurrent run passed all ten cases when rerun alone. Business responsive browser checks passed 3/3. The new Website workflow browser suite passed 12/12 against a production preview, including the canonical counter bill and a recorded payment at 360/820/1440. The earlier 36 management/seller browser checks passed. The static Backend gate passed on the final tree. A disposable PostgreSQL pilot gate passed 466 tests with four documented skips and zero unexpected skips before the final counter/daily contract additions. Focused post-change SQLite money, Service, daily and POS regressions passed 113/113; the new counter bill and pre-subscription finance cases passed 2/2 each. Six targeted post-change PostgreSQL cases passed. The broad SQLite gate completed with 2,809 passed, 21 documented skips, zero unexpected skips and one stale commercial-expectation test failure. That test now opts into the commercial-transition fixture and passed on exact rerun. The broad gate started before the final counter/daily additions, so a frozen final-tree full rerun remains open. These are synthetic and local checks, not staging or deployment acceptance.

New Website phone/tablet/desktop captures at widths 360/820/1440 cover `workflow-orders`, `workflow-counter`, `workflow-counter-bill`, `workflow-counter-paid`, `workflow-reservations`, `workflow-preparation-kitchen`, `workflow-preparation-bar`, `workflow-service`, `workflow-finances`, `workflow-empty-closed`, `workflow-empty-statistics` and `workflow-empty-reservations` under `docs/evidence/`. They use synthetic seeded responses: open and closed intake; pending and accepted orders; waiting/active/ready station work; food and a supported non-alcoholic drink; a selected basket; two assisted rounds; separate CDF/USD recorded payments; a CDF expense and cash variance; a pending reservation; and empty states. Business management captures remain at `management-business-fr-{360,820,1440}.png`. The Finance day preview now leads its entry form with CDF/USD cash receipts, declared expenses, balance and variance, plus recorded method totals. The Kitchen/Bar queue names start/ready actions and hides empty pagination. Counter menu pagination appears only when needed, and sold-out items stay unavailable after basket creation. These are local fixture checks, not a deployed Backend or physical-device acceptance. Human French wording review, Lingala/Swahili review, actual phone/tablet acceptance and staging smoke remain open.

The next Personal Finances batch and its revised source-coverage labels, daily task layout, tests and remaining gates are documented in [the 15 October handoff](restaurants-finances-2026-10-15.md). Release status remains **Partial**.
