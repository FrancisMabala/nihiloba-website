# Restaurant receipts and compact orders — 21 October 2026

Approved scope: compact order rows open the full detail; held baskets remain distinct from submitted orders and are directly visible in Vendre. After recording payment, sellers may print, display only a receipt QR, view the receipt, or finish without printing. Phone, tablet and desktop use the same transaction rules.

## Receipt boundary

The user explicitly approved anonymous receipt QR access. This is a narrow extension of the earlier protected-receipt-only policy: a domain-separated HMAC capability grants read-only access to one receipt, never order management, contact details, private notes, delivery destinations, other group orders, or account access. The capability stays in the URL fragment and is submitted in a POST body; receipt responses and errors are private/no-store and no-referrer. Reads are rate-limited. Existing retention applies; key rotation invalidates links. Anyone given the receipt link can read that receipt.

The receipt retains the immutable purchased foods, portions and extras, plus current allocations from the canonical money ledger. The displayed short reference is the existing unique order suffix, not a new fiscal serial. Paid means recorded as paid in the restaurant ledger, not provider-verified settlement. Cancelled/refunded receipts show an adjustment status. The reserved TVA area is separate from the working SHIDA receipt QR and makes no tax-invoice claim.

Thermal output supports 58/80 mm layouts. Digital output is a downloadable A5 PDF. Printer selection, drivers and actual roll width remain browser/OS settings; no physical printer was available for validation. No automatic print dialog opens after payment.

## Online delivery

One-order online checkout reuses the canonical service-group/money ledger under existing current seller authority, establishment locks and revision checks. Recorded full payment queues a durable customer_receipt notice in the same transaction. Payment replay does not queue another notice. Delivery revalidates recipient and paid state and uses existing WhatsApp transport/window rules. It sends a receipt link with PDF download, not a PDF attachment. Outside the eligible window the notice is deferred; no unrelated template is used. Anonymous QR guests see the receipt in their existing visit; without a contact identity no outbound message is claimed or attempted.

No new migration, dependency, environment variable, cron, worker or Meta template. Existing PUBLIC_BASE_URL must be a configured HTTPS backend origin; existing dashboard signing pepper is reused with domain separation. Alembic remains 0196. Physical printer and real WhatsApp delivery are operational follow-ups, not simulated live verification.

## Validation

Focused service and HTTP tests cover receipt-only capability, wrong-token/cross-order denial, money allocations, four PDF languages, escaped content, seller-only online payment access, revision checking, payment replay and durable notification dispatch/defer. Browser checks cover counter payments at 320/390/820/1440 pixels, optional printing/QR, lost responses, compact rows and detail navigation. See release notes for final command results and deployment commits.

Final website checks: production build and focused ESLint passed; 70 browser cases passed across initial run and corrected rerun (52 + 18). Receipt route/body contract test passed. Full Vitest: 549 passed, 8 existing unrelated failures across marketplace-components, wenze-cart-page and shida-page. Changed restaurant code is not involved in those static markup expectations.
