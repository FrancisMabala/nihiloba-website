# Restaurant & Malewa solo Orders and WhatsApp handoff — 14 October 2026

Status: **Local implementation; release Partial.** No deployment, production intake change, commit, or push.

## Workflow matrix

| Order and item flow | Acceptance and preparation | Next seller action | Customer status and money |
| --- | --- | --- | --- |
| Customer QR/web or WhatsApp, all items explicitly ready to serve | Confirm availability by accepting. The canonical order becomes ready and stock reservation is consumed. | Verify pickup, dispatch delivery, or attest table handover when it actually happens. | Ready is visible; pickup and delivery proof remain private. Receipt does not prove payment. |
| Customer order, made after ordering | Accept, then start and finish the required food or drink work in the order detail. | Confirm handover only after readiness. | Preparing and ready are distinct from completed and paid. |
| Mixed ready to serve and made to order | Ready to serve lines need no Kitchen or Bar action. Each configured preparation part must finish before the whole order is ready. | Finish the remaining part, then perform the actual handover check. | One canonical order, bill, receipt and separate CDF/USD amounts. |
| Assisted table order | The seller confirms the order and finishes only the required preparation. An all ready to serve order is immediately ready. | Attest physical handover separately. | No handover or payment inferred from food readiness. |
| Counter sale | Existing immediate counter sale contract. | Selling records the actual counter transaction. | Retains the canonical counter bill and money evidence. |
| Cancellation or terminal history | A pending order can be cancelled; later cancellation requests need seller resolution. Historical snapshots remain intact. | Review request or open receipt. | Completed, cancelled, rejected, expired and failed orders remain distinct. |

## Contract change

The item preparation route now accepts `serve` alongside `kitchen` and `bar`. The value is set explicitly per item in the Personal Website menu. Unconfigured items retain the historical Kitchen behavior. Route changes are refused while a pending order references that item, so an outstanding submitted order cannot silently adopt a new route. Accepted and historical orders keep their original route snapshot. Migration `0158` changes only the item route and order snapshot constraints; it adds no data backfill.

For an order whose accepted lines are all `serve`, the existing canonical acceptance path records accepted then ready, consumes its stock reservation once, and issues a pickup code only for eligible customer pickup. An assisted ready to serve order moves to ready under the same canonical service. Mixed orders use the existing Kitchen/Bar progress and become ready only when every required station is ready. Handover, cancellation, payment, receipts, and the money ledger remain separate. Organization worker station permissions and assignments remain on their existing routes.

The Personal Website places preparation inside the order detail and removes the separate Kitchen entry from its navigation. The Orders queue and selected detail show the full `order_ref` and next action; item routing and owner labels cover FR, EN, LN and SW. WhatsApp reads the same Backend state and shows the Personal owner a ready to serve explanation after acceptance; customer status, codes and receipts still come from the canonical order.

## Verification and remaining acceptance

Fresh disposable SQLite migration to sole head `0158` and both migration tests passed. The affected Backend preparation, WhatsApp journey and order suite passed `371` tests; a further `2` assisted-table ready-to-serve cases and `71` existing automatic acceptance, assisted order and table cases passed separately. This includes four-language WhatsApp owner/customer interactive and numbered fallback journeys. Website typecheck, production build, changed-file lint, `103` focused unit tests and `50` seeded production-server browser checks passed. The browser checks cover Orders, ready-to-serve detail, closed intake, history, cancellation and stale acceptance at 360, 820 and 1440 px in FR/EN/LN/SW. Before and after captures are in [Orders evidence](evidence/restaurant-orders-2026-10-14/).

The broader Backend gate remains red in the release tracker (`2,763` passed and `58` failed at its prior recorded run). Authenticated staging, a real WhatsApp phone, physical devices and human language acceptance remain open. The local seeded browser fixture is not live customer evidence. Release remains **Partial** until those acceptance steps complete.
