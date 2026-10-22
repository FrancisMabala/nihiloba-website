# Delivery workflow integration — 22 October 2026

The backend capability matrix is in shida-backend `docs/delivery_workflow_audit_2026_10_22.md`.
This batch reuses canonical orders, per-seller snapshots and protected destination reads.
No migration, authentication/onboarding change or restaurant release-flag change.

## Website

Wenze checkout forwards the existing quartier, landmark and private instruction
fields and shows the saved seller-specific fee. Delivery requires city, commune/
area and a precise description; formal numbers/GPS are not required. Pickup does
not require a destination. Edits require another explicit save before confirmation.
Checkout and private history now support all four languages; the header cart link
preserves LN/SW. Session restoration finishes before fields become editable and
private form/history state is discarded on account changes.

Buyer history retrieves the destination only through account-bound order detail;
list responses do not acquire private addresses. Unknown legacy values stay unknown.
Wenze Personal and Business screens label the destination and show canonical fee
status. Restaurant operator screens label existing protected destination fields.

Restaurant checkout restores the backend destination after refresh, including
private instructions; it stores no address in local/session storage. Whole-commune
areas accept an optional quartier. Review includes country/city/commune/quartier.
Street/building OR a precise landmark continues to satisfy the existing rule.
Stale responses after account changes are rejected, and textarea labels remain
stable when a saved value is restored. Terminal Restaurant destination retention,
verification codes, attempt limits, expiry and exceptional resolution are unchanged.

## Evidence

- Website focused unit run: 34 passed, including four-language destination labels and escaping.
- Website browser matrix: 28 passed (all four languages, 390px/1280px, pickup,
  delivery, retry with the same key, Restaurant restore/sign-out, private buyer history).
- Personal seller delivery browser matrix: 8 passed, all four languages at 390px/1280px.
- Business seller delivery browser matrix: 8 passed, all four languages at 390px/1280px.
- Business focused regression run: 17 passed (delivery verification, preferences, Wenze R6).
- Both production builds, TypeScript checks and scoped ESLint pass. Staged diff
  whitespace/scope verification is performed before commit. Screenshots under `docs/evidence/delivery-workflow/`.
- API data is synthetic and intercepted locally; SSR Restaurant fixtures refuse
  external network access. No uncontrolled production orders were placed.
- Screenshots were inspected. Browser emulation is Chromium, not physical iOS/
  Android certification. No real WhatsApp message or live delivery was sent.

## Limitations and release

Fixed Wenze completion remains seller-attested (no new customer OTP). Negotiated
Wenze handoff and Restaurant delivery verification retain their existing controls.
Guest Restaurant QR remains pickup-only. No GPS, SHIDA delivery network, address
book, paid transaction engine or post-acceptance address editing is introduced.
Restaurant terminal destinations remain intentionally hidden/erased under existing
retention rules. Country inference for Wenze only covers known canonical cities.

Deploy the backend before frontend commits. Verify pinned Render commits, not just
HTTP. No database action is needed. Frontend rollback does not remove order
snapshots; an older backend restores weaker validation and needs incident review.
Registration and Phase 4 settings remain unchanged. Release SHA/status is reported
in the task completion and can be matched to Render deployment history.
