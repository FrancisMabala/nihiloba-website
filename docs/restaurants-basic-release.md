# Restaurant basic release adoption

The existing public and Personal Restaurant surfaces now adopt C1-G flexible monetary
portions and C1-I basic statistics. See the [shared Backend closure report](../../Backend/docs/restaurants_basic_release_closure.md)
and [verification manifest](../../Backend/docs/evidence/restaurants_basic_release.json)
for domain definitions, complete results and release blockers.

Existing establishment/menu/dates/hours/intake/order/counter/receipt/history
components remain in place. Item editors explicitly send `amount_mode`,
`minimum_amount` and optional `amount_step`; switching modes clears incompatible
pricing fields. Counter selections use the same server quote/finalize contract.
No browser total, phone number or hidden button grants authority.

The existing `order-summary` request now displays per-currency completed food
value and average, separate delivery fees, canonical state/fulfillment/source
counts, completed quantities by food name, and measured response/preparation
samples. No metric verifies payment. Today/7-day/30-day shortcuts use the
establishment calendar; custom boundaries are still resolved by the Backend.
Refresh failure retains the prior result with stale/applied-period information.
No background statistics polling, chart dependency or private persistent cache.

FR/EN/LN/SW copy is present; Restaurant Lingala accents were corrected and dates
use numeric formatting. Native-speaker acceptance remains separate.

Final unit results: 296 passed, four unrelated baseline failures reproduced on the original HEAD.
Production build passes. Synthetic Chrome checks cover four locale/viewport pairs
(320, 390, 768 and 1280 pixels), with retained C1-E retry/privacy paths. These are
not physical-device or live provider results.

Ship the Backend summary extension before this consumer. Keep the C1-F release
gates unchanged; no rollout, new environment variable, dependency, worker,
payment integration, C2, M1 or M2 is introduced. No Git commit was created.
