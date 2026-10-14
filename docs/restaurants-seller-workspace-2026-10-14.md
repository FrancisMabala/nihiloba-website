# Restaurant & Malewa seller workspace — 14 October 2026

Local implementation only. No deployment, production intake change, commit, or push. Backend ownership, grants, tier checks, payment ledger, and temporary pre-subscription access remain Backend decisions. Concurrent Services marketplace work was left untouched.

Interaction references: [Square for Restaurants](https://squareup.com/us/en/point-of-sale/restaurants) and [Toast Kitchen Display System](https://pos.toasttab.com/hardware/kitchen-display-system). The screens use SHIDA's own visual language and workflows.

## Before and after

| View | Before | After |
| --- | --- | --- |
| Phone entry | [Orders-first prototype](evidence/restaurant-workspace-before-360.png) | [Today with seeded work and money](evidence/workflow-today-360.png) |
| Phone Menu | Repeated routing destination in the old navigation | [Kitchen/Bar beside the item](evidence/management-menu-fr-360.png) |
| Phone selling | Separate Service, counter, and Point of sale entries | [Counter basket and quote](evidence/workflow-counter-360.png), [canonical bill](evidence/workflow-counter-bill-360.png) |
| No work | Large Orders-only blank area | [Closed intake and honest unavailable reads](evidence/workflow-empty-closed-360.png) |

The same seller flows were captured at [820 px](evidence/workflow-today-820.png) and [desktop](evidence/workflow-today-1440.png). Website FR/EN/LN/SW screenshots use `evidence/management-{locale}-{360,820,1440}.png`; Business uses `evidence/management-business-{locale}-{360,820,1440}.png`. Orders, Kitchen, Bar, service, reservations, finances, counter handover, and empty states also have `evidence/workflow-*.png` captures at all three widths.

## Changed files and journeys

- Website: `app/components/shida/restaurant-today.tsx`, `restaurant-item-routing.tsx`, `restaurant-seller-workspace.tsx`, `restaurant-preparation.tsx`, `restaurant-seller.css`, and `app/lib/restaurant-management-copy.ts`.
- Business: matching `components/restaurant-today.tsx`, `restaurant-item-routing.tsx`, `restaurant-workspace.tsx`, `restaurant-preparation.tsx`, `restaurant-workspace.css`, and `lib/restaurant-management-copy.ts`.
- Browser coverage and fixture updates: Website `tests/browser/restaurant-management.browser.ts`, `restaurant-workflow.browser.ts`, `restaurant-service.browser.ts`, `restaurant-money.browser.ts`; Business `tests/browser/restaurant-management.browser.ts`, `restaurant-service.browser.ts`, `tests/restaurant-workspace.test.tsx`, and `tests/restaurant-kitchen.test.tsx`.

Today opens for a selected establishment and shows pending orders, preparation, active visits, reservation requests and upcoming dates, low stock, and authorized money reads. Missing reads show an unavailable state. Paginated counts use a `+` when the current page cannot prove an exact total. Closed intake has an owner action to its setting. A 360 px quick navigation and grouped full navigation place counter and table selling together; setup and recovery remain in secondary sections. Menu item routing is saved beside each item with an explicit Bar declaration, saved selection, conflict refresh, and same-envelope retry. Kitchen and Bar now show elapsed time since order submission alongside quantities and readiness actions.

The seeded flow covered an owner entering a counter basket with food and a non-alcoholic drink in separate CDF/USD currencies, quoting, attesting handover, reading the canonical bill, recording actual payment, and seeing linked bill collections in Finances. A quote is labeled as an estimate, and the Today finance card explicitly limits its summary to linked service bills. The real Backend flow also covered stale quote recovery, station preparation, grouped rounds, handover, payment retry/recovery, and an Organization service worker with an exact establishment grant. Reservation copy states that the seller confirms a request and that it creates no order, assigned table, or payment.

## Validation

| Check | Result |
| --- | --- |
| Website scoped Restaurant/shared units | 320 passed, 0 failed, 0 skipped |
| Business scoped Restaurant/shared units | 350 passed, 0 failed, 0 skipped |
| Website seeded browser checks | 29 passed; FR/EN/LN/SW at 360/820/1440; keyboard and inline routing save included |
| Business seeded browser checks | 12 passed; FR/EN/LN/SW at 360/820/1440 |
| Real local Backend, Website Personal | 3 passed: service/quote/handover, recorded money/finance, counter handoff |
| Real local Backend, Business Organization | 1 passed: owner/admin and assigned service worker, grant loss/renewal and replay |
| Production builds, typechecks, changed-file ESLint | Passed in both apps |
| Backend scoped Restaurant SQLite gate | **Failed:** 2,763 passed, 58 failed, 21 expected skips, 0 unexpected skips; see `.s3a-local/restaurant-workspace-gate-2026-10-14/summary.json` |

The Backend gate ran against the concurrent local Backend tree. Forty-nine failures assert the old Alembic head `0152` while the actual head is `0156`; six exercise a guarded service-bill downgrade that requires history review, one expects a different guarded-downgrade message, and two find Service draft-template index drift or a Wenze downgrade interrupted by the new guard. Exact nodes and traces are in the shard summaries. No Backend policy was changed to obtain a green screen.

The existing Excel tracker was updated with a new 14 October run and the red gate status. The spreadsheet artifact importer exited while reading this workbook, so a narrow `openpyxl` edit was used. A full cell/style/validation/formula comparison found only the intended 23 existing cell changes and one appended run; all 12 formulas were preserved. Native Excel rendering was unavailable in the headless logon session. The canonical workbook matches the verified output byte for byte.

## Contract gaps and rollout

No new Backend endpoint was required. Today uses existing exact-establishment order, reservation, service group, inventory, order configuration, and daily preview reads. Service groups, reservations, and inventory expose paginated pages rather than exact cross-page actionable counts; Today displays a lower bound with `+` when needed. The daily preview's `bill_summary` is linked-bill coverage, so it is not presented as all sales or verified provider payment.

Before any rollout: (1) triage and rerun the red scoped Backend gate on a frozen combined tree; (2) run the full Website and Business Restaurant browser inventories against staging with shared sign-in; (3) have native speakers review FR/LN/SW wording and complete physical phone/tablet workday acceptance for owner and assigned staff; (4) release the apps with Backend capabilities and intake policy unchanged, then make any pilot intake decision separately. The release tracker is `Backend/docs/evidence/restaurants_whatsapp_2026_10_12/release_validation_tracker.xlsx`.
