# Personal Restaurant Orders work queue — 14 October 2026

Status: **Local implementation, release Partial.** No deployment, production intake change, commit or push.

The follow-on solo seller batch adds explicit ready-to-serve item routing, mixed-order truth, and the matching WhatsApp owner path. See the [solo Orders and WhatsApp handoff](restaurants-solo-orders-2026-10-14.md). The report below records the earlier Orders queue baseline.

## Scope and Backend contract

The Personal owner follows customer QR/web and WhatsApp orders, assisted orders, and completed counter sales in Orders. New counter and table orders remain in Selling. Today and Selling screens, Stock and Finances were not redesigned.

The existing Backend order contract was inspected before implementation. Pending orders permit accept or reject until the response deadline. Accepted and preparing orders with preparation routes require their separate Kitchen and Bar actions; the Backend rejects whole-order `start` and `ready` actions for them. `ready` means prepared and remains distinct from pickup verification, delivery dispatch and verification, or assisted physical handover. Terminal orders include completed, rejected, cancelled, expired, uncollected, and delivery failed. Backend stock reservation, cancellation, handover, receipts, and payment rules were not changed.

## Orders changes

- Four bounded, paginated task sections: decision, preparation, handover, and history. The existing unfiltered order feed prompts a refresh of all four lists after changes; the Backend supplies authoritative counts and rows.
- Every available projection shows the full canonical `order_ref` with a copy control, source, food preview, submitted time, fulfillment method, status, and next permitted step. The existing full order remains the place for instructions and actions. An unavailable legacy food preview explicitly directs the owner to open the order.
- Response deadlines and cancellation requests stand out. Routed preparation identifies the next Kitchen or Bar part. The order detail retains the existing authorized station actions, with simpler owner wording. Bar drinks require their own Bar step. Readiness alone never records a handover or payment.
- Compact states distinguish no orders yet, no active work with history, and closed new-order intake. Authorized owners can open the intake setting and Selling.

## Before and after evidence

The same seeded set includes a pending QR/web pickup, a cancellation request on a web delivery, an assisted order with Kitchen and Bar work, ready pickup, dispatched delivery, a completed counter sale, and a cancelled WhatsApp order. The original screen shows the four active records behind one filter. The new screen shows all seven records by task. These are local fixture screenshots, not live customer data.

| Width | Before | After |
| --- | --- | --- |
| Phone, 360 px | [old Orders](evidence/restaurant-orders-2026-10-14/before-realistic-fr-360.png) | [work queue](evidence/restaurant-orders-2026-10-14/after-fr-360.png) |
| Tablet, 820 px | [old Orders](evidence/restaurant-orders-2026-10-14/before-realistic-fr-820.png) | [work queue](evidence/restaurant-orders-2026-10-14/after-fr-820.png) |
| Desktop, 1440 px | [old Orders](evidence/restaurant-orders-2026-10-14/before-realistic-fr-1440.png) | [work queue](evidence/restaurant-orders-2026-10-14/after-fr-1440.png) |

After captures also cover [EN](evidence/restaurant-orders-2026-10-14/after-en-360.png), [LN](evidence/restaurant-orders-2026-10-14/after-ln-360.png), and [SW](evidence/restaurant-orders-2026-10-14/after-sw-360.png) on a phone, with 820 and 1440 px captures for each language in the same directory. See [closed intake and no orders](evidence/restaurant-orders-2026-10-14/after-empty-closed-360.png) and [stale acceptance](evidence/restaurant-orders-2026-10-14/after-stale-en-1440.png).

## Checks and release status

| Check | Result |
| --- | --- |
| Website production build and typecheck | Pass |
| Changed-file ESLint | Pass |
| Scoped Website Restaurant tests | 308 passed across 30 files; the focused order, POS and preparation subset passed 135 tests |
| Production-server seeded browser checks | 44 passed: populated queue, closed intake and stale acceptance in FR/EN/LN/SW at 360/820/1440 px, plus history-only, cancellation/routing and existing Today/Selling workflow checks |
| Backend scoped Restaurant gate | **Existing red gate, not rerun for this UI batch:** 2,763 passed, 58 failed, 21 expected skips. See [seller workspace gate report](restaurants-seller-workspace-2026-10-14.md). |

The canonical release tracker records this run as Partial. The browser checks use local seeded responses. Owner station actions inside the order detail retain their existing component and Backend contract; a new live authenticated station run, native-language review, and physical phone/tablet acceptance remain open. The Backend gate failures are tracked separately from these Website checks.
