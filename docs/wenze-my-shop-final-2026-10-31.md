# My Shop final refinement — 31 October 2026

## Implementation

1. Identity and photos: larger real shop image, actual status/category/location/presence, integrated three-tab navigation, choose/replace/remove controls and upload guidance. Shop information is read-only until Edit; existing save/cancel and dirty-form protection remain.
2. Pickup and delivery: supported modes use clear option cards. Timing, public pickup location and delivery fees/zones are grouped separately. Pickup-only hides delivery fields; delivery-only hides pickup fields, including in the saved summary. Existing values and revision-aware writes are retained. Public pickup-address consent remains mandatory.
3. Settings: semantic icons/colors distinguish voluntary visibility, payment preferences and seller trust. The general commitment is informational, not a violation notice. Actual suspension remains clearly labeled and cannot be removed by owner visibility changes. Sharing tools have their own heading. Available offline methods remain separate from disabled future methods.

## Files and reuse

Frontend: app/components/shida/wenze-workspace.tsx, wenze-shop-design.css, wenze-shop-icons.tsx, wenze-shop-trust.tsx, wenze-payment-preferences.tsx; app/lib/wenze-shop-copy.ts. Existing workspace, editor, WenzeShopTrust, WenzePaymentPreferences, WenzeShareShop and account access data are reused. No new backend endpoints, migrations, payment collection, trust enforcement or dashboard metrics.

The existing profile-photo upload/attachment/removal, fulfillment, lifecycle and payment-preference APIs retain their permission and revision checks. EN/FR/LN/SW copy is included. Organization dashboards are not redesigned; backend account-boundary coverage was run.

## Access calculation

Usage is used / limit * 100, clamped to 0–100 for rendering. 1 / 1000 = 0.1%, not 1%; 3 / 200 = 1.5%. Zero usage gives zero fill. Invalid/nonpositive limits yield unavailable progress. No minimum visual fill exaggerates low usage. The existing native progress calculation was already proportional; the refinement makes the percentage explicit and styles it consistently.

## Validation

- Production build and TypeScript: passed, 130 pages.
- Targeted ESLint and git diff --check: passed.
- Shop unit tests: 5 passed.
- Browser tests: 17 passed on the final build. Widths 360, 390, 768, 1440; shop switching, details editing, photo replacement/removal and invalid uploads, pickup/delivery/free fees, consent, visibility confirmations, suspension, payment persistence, failed-save retention, loading/empty/denied states, four languages and 0.1% progress.
- Backend targeted regression: 14 passed, 11 deselected. Store authorization, organization admin discovery, exact-actor payment preferences, unsupported payment methods, suspension protection, photo upload/attachment/removal and stale revisions. Full backend suite was not run.
- Screenshots reviewed per tab on desktop/mobile, including pickup-only, delivery-only, suspended, editing and low usage. Controlled browser fixtures only; no production records were created or edited.

## Reference comparison and limits

Uses the references' prominent identity card, integrated tabs, photo management, organized information and subtle semantic accents. Retains three separate tabs instead of stacking all management on one page. Omits redundant quick statistics, illustrative values and invented ratings. Existing selected-shop data drives all content. No drag-and-drop promise, camera capture or new photo API was added. The API does not supply warning counts, suspension reasons or expiry, so the UI does not invent them or assert good standing from missing data. Fixed navigation can appear mid-image in full-page mobile screenshots; it stays at the viewport edge in use.

## Release

Previous Money & Receipts commit 62f2d4d4d79555c2322413fc4e1fbaf2f8e607f7 was manually deployed and verified Live on Render deployment dep-dbivb52jnfac73bnmnd0 (website service srv-d9s8g1c9v7es73effevg). Signed-in receipt page verified without writes, including seller-recorded-payment caveats.

New My Shop changes are validated for release but not deployed. The task brief states: “Do not deploy to production until authorization for this specific release is confirmed.” Auto-deploy remains disabled. After approval, deploy the website commit and verify its live SHA and signed-in My Shop tabs read-only. No backend deployment or migration is required. Rollback target is website 62f2d4d4d79555c2322413fc4e1fbaf2f8e607f7. Urgent WhatsApp templates are unchanged.
