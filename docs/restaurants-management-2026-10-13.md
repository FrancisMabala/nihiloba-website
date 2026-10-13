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
