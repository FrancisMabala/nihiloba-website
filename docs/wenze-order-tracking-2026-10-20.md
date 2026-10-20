# WNZ-04 order tracking

My orders on the Wenze public page opens an authenticated buyer history with
current progress, items, currency-specific totals and retained estimates.
Buyer ownership is checked by the backend using account ID and public reference.
The gateway accepts bounded pagination only, preserves browser session binding
and rejects identity injection. Private data is not cached.

Personal seller detail adds the current timeline and Preparing action in all
four seller languages. Pickup and delivery paths differ; no timestamp or payment
confirmation is invented. Public buyer pages support EN/FR, matching the site.
Refresh, loading/error/empty states and pagination work on mobile.

Validation: 14 buyer gateway tests; six synthetic mobile browser checks; targeted
lint, TypeScript and webpack production build. Screenshots are under
`docs/evidence/wenze-tracking/`. Requires backend WNZ-04 and migration0187 before
release. Inbox delivery is a subsequent batch, not implied by this timeline.
