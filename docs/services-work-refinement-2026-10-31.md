# Requests & Jobs refinement — 31 October 2026

## Prior release deployed

Services Today `02ca03bccb8ab3e61ad3607b9e43a3784c307d38` was pushed to main, verified against the remote, and manually deployed to Render service `srv-d9s8g1c9v7es73effevg`. Deployment `dep-dbj0ui7lk1mc73fv99d0` is Live (2m03s). The signed-in production account was inspected: one published service, zero customer requests, zero appointments today and zero ongoing work. No test work was created in production. GitHub combined statuses were empty; local checks and Render build success are verified, not a green GitHub CI claim.

## Audit before implementation

The existing `ServicesTransactions` component owns request, quote, booking, lifecycle, message, bill and customer-history workflows. It uses browser-session binding, server-returned action permissions, revisions and idempotent financial-command retries. These mechanisms remain in place.

Backend sources inspected: `service_work_request_service.py`, `service_quote_service.py`, `service_operator_reservations.py`, `service_reservation_access.py`, `service_operator_access.py`, `service_reservation_lifecycle.py`, `service_message_service.py`, `service_message_access.py`, `conversation/service_message_conversation.py`, and request/quote notification adapters. Available Requests and My Proposals remain in `ServicesOpportunities`, separate from addressed customer work.

- Incoming requests support review and decline, not a generic request acceptance operation. Quote acceptance can link a request to a reservation.
- Quotes have separate draft, sent, accepted and historical states. The request projection exposes current quote, draft reference and whether a new quote can be prepared. Quote details and history remain authoritative.
- Booking response, cancellation, progress, disputes and rescheduling are exposed only by existing backend action lists. Dates retain the existing Services formatting and legacy requested appointment text; no invented appointment timestamps.
- Messages are existing service conversation records, not a complete WhatsApp inbox. Existing reply controls are retained; delivery remains backend-owned. The conversation adapter uses the approved template outside the WhatsApp service window and does not fall back to unrestricted free text. No new direct-phone links or conversation-opening tokens were invented.
- Customer names and broad request location come from existing privacy-safe projections. No additional private address, phone or evidence fields are exposed.

## Batch 1 — Classification and shared workspace

New `services-work-model.ts` classifies records without creating business statuses. New requests are submitted requests without a draft or current sent quote. Quotes to prepare are existing drafts or eligible reviewed requests without a current sent quote. Sent quotes are separately labeled Awaiting customer approval. Requests linked to bookings leave both request-action counts. Closed and expired requests do not inflate them.

The booking summary intentionally says **Bookings to confirm** and counts pending bookings. **Accepted and active jobs** includes accepted, confirmed and in-progress reservations. These two cards are disjoint; completed history is excluded. This adapts the reference's ambiguous labels to actual supported data.

Counts summarize bounded first-page records (20 requests, 100 reservations), clearly described as previews rather than global totals. References are deduplicated. Filters apply only to the current loaded page, with existing pagination retained. No unbounded search or aggregation endpoint was added. Failed sources show Unavailable independently.

## Batch 2 — Presentation and integration

`services-transactions.tsx`, `services-work-summary.tsx`, `services-work.css`, `services-work-copy.ts`, and `services-management.tsx` provide the new compact header, one functional Refresh control, pastel summary cards, existing three tabs, status selector, compact rows, contextual empty states and service/share/calendar guidance. The private detail forms, customer history, quote library, bill panel and operation handlers are reused.

The header refresh respects draft confirmation and is disabled during pending commands. It reloads the selected list and summaries without resetting the filter. Quotation-oriented providers with no booking capability or pending bookings do not get an irrelevant empty booking card. The Bookings tab remains accessible for existing history. Calendar and sharing guidance appears only when the existing capability supports it. No profession-specific dashboard was built.

EN/FR/LN/SW copy follows the existing localization pattern. Statuses have text as well as colors. Tabs remain accessible native buttons with selected-state semantics, keyboard operation and narrow-screen horizontal scrolling. Detail and command behavior remain shared with other Services workspaces.

## Validation and visual evidence

71 focused checks passed (33 unit/gateway and 38 browser), plus targeted ESLint, TypeScript and the production build. The full backend suite was not run for this frontend-only change. Focused unit/gateway checks cover status classification, deduplication, account navigation, request support, ownership gateways and proposal routing. Browser checks cover the existing transaction journey in all four languages: request review, private quote editing, uncertain-save retry with the same command, sending a quote, booking confirmation, message reply and access revocation. Existing provider navigation/account switching, Today deep links and reviewed-request revision tests passed.

Controlled fixtures cover booking-led hairdressing and quotation-led electrical work, multiple services, linked accepted requests, completed history, empty states, page filters, loading, partial errors and header-refresh recovery. No fixtures were inserted into production. Desktop/mobile screenshots were inspected and an inherited row-style conflict and mobile tab wrapping were corrected.

Evidence: [desktop populated](evidence/services-work/populated-1440.png), [mobile populated](evidence/services-work/populated-390.png), [desktop empty](evidence/services-work/empty-desktop.png), [mobile empty](evidence/services-work/empty-en.png), [bookings](evidence/services-work/bookings-1440.png), [mobile bookings](evidence/services-work/bookings-390.png), [empty bookings](evidence/services-work/empty-bookings.png), [messages](evidence/services-work/messages-390.png), [request actions](evidence/services-work/details-1440.png), [filters](evidence/services-work/filtered-390.png), [quotation provider](evidence/services-work/electrician-quotes.png), [loading](evidence/services-work/loading.png), [error](evidence/services-work/error.png). Breakpoints: 360, 390, 768, 1024 and 1440 pixels.

## Release boundaries

This Requests & Jobs release is not deployed. Its brief requires authorization for this specific release. Rollback/base target is `02ca03bccb8ab3e61ad3607b9e43a3784c307d38`. No backend, schema, authentication, matching, notification preference or urgent WhatsApp template changes. No production messages were sent. WhatsApp window behavior was audited in source; real external message delivery was not exercised. A complete analytics total and a new secure WhatsApp handoff would require separately scoped backend support, not a visual-only addition.
