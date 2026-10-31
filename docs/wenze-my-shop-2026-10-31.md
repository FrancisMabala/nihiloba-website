# Wenze My Shop — implementation review, 31 October 2026

## Result and reused architecture
My Shop uses the existing Personal Wenze workspace, protected store API, photo upload pipeline, fulfillment API, payment preferences component, plan usage API, lifecycle confirmation, unsaved-work guard and shared seller navigation. No duplicate shop settings or registration/location architecture was added. Business UI is unchanged; shared backend authorization remains covered by organization/manager/isolation tests.

## Batches
| Batch | Delivered |
|---|---|
| 1 Audit | Existing store fields, photo limits, fulfillment modes, privacy consent, lifecycle/revision checks, payment capabilities and moderation audited. |
| 2 Header | Actual image/placeholder, name, category, deduplicated location and status; public link only for active, visible, catalog-ready shops. Selector preserved. |
| 3 Details/photo | Readable normal summary; explicit Edit, Save and Cancel; full existing fields retained. Existing 8 MB JPG/PNG/WebP upload/replace/remove pipeline. |
| 4 Fulfillment | Selectable pickup/delivery cards, preparation/delivery sections and public-address consent. Delivery-only remains available because it is supported. |
| 5 Fees/zones | Existing fixed/free controls, conditional currency/amount and newline delivery areas. No automatic fee/coverage policy. |
| 6 Settings | Trust, visibility, payment and actual access/usage sections. |
| 7 Trust | Calm seller commitment; actual `suspended` status produces a restriction notice. Existing policy link. No fabricated warning counter or expiry. |
| 8 Visibility | Active/Hidden/Archived selection cards, actual selected state, existing confirmation and revision API. Suspended/unknown status cannot be changed. Restore remains hidden. |
| 9 Payments | Existing backend capability selections and save. Card/PayPal remain disabled when unavailable. No payment collection or confirmation implied. |
| 10 Access | Actual product usage and limit; pilot information only when returned by existing plan source. Loading linked to selected shop/settings. |
| 11 Mobile | Existing Wenze navigation and sticky editor actions retained; 360, 390, 768 and 1440 px verified. |
| 12 Localization/accessibility | New copy EN/FR/LN/SW, text status, labeled native controls, radio groups, focus handling and confirmation dialogs. |
| 13 Visual review | Inspected browser-rendered details, editing, photo, fulfillment, settings, restriction, mobile and failure-state screenshots. Fixed older style overrides affecting photo and fulfillment cards. |
| 14 Regression | Focused unit/browser/API tests; controlled local records only. No production shop data created or edited. |

## Policy audit and narrow backend correction
The existing moderation service supports administrator suspension, restoration, removal and audit history. No Wenze three-confirmed-violation/30-day rule or owner-facing warning count/reason/appeal endpoint was established. The UI links the applicable acceptable-use policy and shows only actual status. Lingala/Swahili link the existing French policy; no untranslated policy was invented.

A confirmed backend bypass let owners restore suspended shops, or archive then restore them. The companion backend change rejects seller mutations of a suspended shop in the existing shared service. Existing administrator restoration still works. Sanction thresholds and review rules are unchanged. The correction applies to callers on both channels. No other moderation behavior was redesigned.

## Files
- `app/components/shida/wenze-workspace.tsx`: summary, details, fulfillment and lifecycle integration.
- `app/components/shida/wenze-shop-design.css`: scoped responsive design.
- `app/components/shida/wenze-shop-trust.tsx`, `app/lib/wenze-shop-copy.ts`: truthful status/policy and localized copy.
- `app/components/shida/wenze-payment-preferences.tsx`: styling hook only; existing behavior retained.
- `tests/wenze-shop.test.tsx`, `tests/browser/wenze-shop-design.browser.ts`, `playwright.wenze-shop-design.config.ts`: focused regression and visual evidence.

## Validation
27 unit tests passed (shop copy/status, seller improvements, Personal gateway, management formatting). 14 browser scenarios passed against a production build, covering four viewport sizes, photo replace/remove, selected-shop isolation, saving and discarding details, supported payment saves, unavailable choices, confirmed lifecycle transitions, suspended restrictions, pickup/delivery-only, fixed/free fees, consent, EN/FR/LN/SW, failed save preservation, and loading/empty states. Build/type check/targeted lint and diff checks passed. Backend focused suites passed: 33 initial cases plus 17 moderation cases (five overlap), including authorization, photo API, fulfillment and buyer-facing payment capabilities. Full backend suite not run.

## Visual comparison and limitations
Cream surfaces, green actions, serif headings, photo/summary card, three tabs and grouped forms follow the supplied reference. Normal details intentionally remain readable until Edit, as requested. Existing supported delivery-only mode and full location fields remain. No sample shop data was added to production. Local screenshots use intercepted controlled fixtures; they do not prove production changes. Native keyboard focus indicators and the existing mobile fixed action/navigation bars are retained. Warning counts, suspension expiry and complaint explanations are not exposed by the existing seller API, so the screen cannot display those details. No camera integration or drag-and-drop promise was invented; the accessible native file picker is used.

## Release
Previous Money commit `482f45f585125a609c83b5e179429d8618dee38e` verified Live on Render deployment `dep-dbit2uu7bikc73dprkb0`, with signed-in read-only financial overview verification. Actual incomplete cost coverage remains clearly marked partial. My Shop requires the specific approval requested by its brief; automatic deployments are currently disabled on both services. Deploy the companion backend correction first, verify its live commit, then this website. No migrations (backend head `0213`), dependencies, environment changes, jobs or WhatsApp template changes.

Rollback: redeploy website Money commit `482f45f` if presentation fails, retaining the backend suspension guard. Do not roll back the guard casually because that reopens the confirmed bypass. After approval, smoke-test authenticated shop details/settings read-only and confirm exact Render commit identities. Do not mutate real sellers or payments for validation.
