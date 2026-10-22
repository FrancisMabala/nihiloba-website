# Complete Wenze program — 23 October 2026

Working report; not a production-release claim. Backend companion:
`shida-backend/docs/wenze/COMPLETE_PROGRAM_2026_10_23.md`.

## Existing released foundation

Delivery integration and Quick Sell were verified live on 22 October. Preserve
their canonical APIs, private delivery snapshots, order lifecycle and exact Personal
or Organization authorization. See `quick_sell_batch_2.md` for release evidence.

## Batch 3 — locally validated

My Space → Manage now offers My listings / Mes annonces. Existing individual
contexts no longer appear as full shops in the Personal activity list. The existing
Quick Sell route hosts status-filtered listings, saved drafts, published-photo
management, hide/show, archive/restore, public links and the canonical orders area.
No separate dashboard or identity was created. Filters operate over all retrieved
listing pages, not just the first twenty items.

Explicit draft saves reuse protected backend workflows and a 24-hour lifetime;
reload restores the details and ordered photos. Final confirmation remains required
for publication. The existing session boundary clears private state on sign-out or
account change. New provenance labels distinguish actual completed SHIDA orders,
seller-reported outside sales and unknown historical zero stock. No label asserts
verified payment. Price, media and lifecycle actions retain canonical backend checks.

Validation: production build/TypeScript and scoped ESLint passed; 22 gateway/activity
unit tests passed; 12 Chromium browser cases passed across FR/EN/LN/SW at 390, 768
and 1280 pixels. These cover draft save/reload/resume, long names, upload failure,
ambiguous publication retry, session loss and horizontal overflow. Screenshots:
`evidence/wenze-program/`. Images in these previews are synthetic fixtures.
Backend focused suite: 83 passing tests. Physical-device and provider acceptance
are not claimed. Candidate backend migration 0199 must precede website deployment.

Batch 4, Batch 5, final cross-batch checks, capability inventory, deployment and
École handoff remain in progress.
