# Transactions and order details — 8 November 2026

## Scope and architecture

The customer transaction list lazily opens the existing authorized Wenze or restaurant order in a responsive detail panel. Standalone routes and the panel reuse the same detail presentation. Other transaction types retain their canonical destinations; seller management remains separate. Account-binding changes discard the selected private record. List counts and pagination continue to use the existing backend aggregation.

The My Space banner uses a lightweight illustration and the approved Lingala slogan. Activity counts are unchanged.

## Evidence and financial semantics

Wenze renders its existing timeline and creation date. Restaurants show creation and the current state, with an explicit explanation when intermediate event timestamps are unavailable. No invented preparation or handover dates are added. Completion does not confirm payment. Restaurant payment labels derive from the canonical receipt's recorded-payment state and distinguish unknown and unpaid states. No refund, escrow or independently verified payment is implied.

Restaurant cancellation uses the shared accessible localized confirmation dialog, existing state-specific action, expected revision and a stable operation key for retries. Failed submissions retain the dialog. Pickup/delivery codes and addresses remain authorized on-demand data and are not requested by receipt-only views. Existing WhatsApp templates and conversations are unchanged. The order DTOs do not expose an authorized direct merchant-conversation handoff, so no invented contact button or public telephone disclosure was added.

## Receipt investigation

The backend customer receipt endpoint authorizes the owner and reconciles the existing document and money allocation. It does not require completed handover. The existing immutable receipt terms and recorded receipts/refunds determine amounts; order completion alone does not mark payment received. PostgreSQL receipt-document and recovery tests pass.

The frontend now uses the receipt endpoint for receipt-only views, supports retry after a failed load, and keeps the financial document readable if optional QR generation fails. The earlier production receipt error has NOT been reproduced in an authenticated live session, and its backend root cause is not established. A public receipt URL configuration problem remains only a hypothesis. Do not describe this batch as a proven repair of that production incident.

## Validation

- 29 focused unit tests passed: restaurant order detail (including completed-but-unpaid in EN/FR/LN/SW), transaction summary, receipt contract and personal transaction helpers.
- 30 browser scenarios passed across 360, 390, 768, 1024 and 1440 pixels, including empty/populated states, filters, pagination, selected details, failure/retry, account switching, focus restoration and cancellation retry. After final layout changes, the four selected-order desktop/mobile scenarios passed again.
- PostgreSQL: 20 receipt-document/recovery tests passed, none skipped. Disposable Docker project `shida-transactions-20261108` was removed after validation.
- Type checking, focused ESLint, production webpack build and diff whitespace checks passed. The subsequent small Wenze date/type change passed type checking and focused lint.
- Evidence retained under `test-results/transactions-evidence`; PostgreSQL validation log: backend `logs/platform-validation/b5611220217741a68926f7e6ffe0921f`.

Performance is structurally bounded: detail modules load only when selected, existing overview pagination remains, and detail loads have bounded waits. No reliable before/after production latency baseline was captured, so no measured speedup is claimed.

## Release and limitations

Website-only release; no schema or backend deployment required. Preserve existing canonical routes and urgent WhatsApp templates. Deploy the validated website commit and correlate Render's live commit with remote main. An authenticated live receipt investigation remains necessary if the reported error recurs. Local browser evidence is not a claim of authenticated production verification.
