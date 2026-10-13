# Restaurants & Malewa customer redesign — local handoff

**13 October 2026, Europe/Stockholm.** Local Website implementation only. No deployment, commit, push, production data, intake setting, or Backend source change.

## Implementation

- The public marketplace now places restaurant and dish search, city, supported type and service-mode filters directly below a compact heading. The decorative marketplace banner is removed. Cards render only API-published establishments, with consented location, supplied service modes, hours status, optional review summary and approved photos or a decorative fallback. One or two results retain bounded card widths on desktop.
- The restaurant route and its `/menu` route both lead with the public menu and the canonical account-free guest ordering component. Category chips link to nearby dishes. Dish cards use optional approved public photos, a non-photo fallback, existing price/currency formatting, availability, and the existing guest selection controls. Add stays disabled until a valid private visit and basket exist; unavailable or unpriced items remain non-orderable.
- The same guest visit, pickup window, table QR, basket, Backend quote, confirm, repeat round and uncertain-response recovery remain in use. A phone basket bar shows selection count and shows a total only after the Backend supplies a current quote. It does not calculate a browser estimate or combine CDF and USD. During quote review and visit summary, the menu cards move out of the way.
- Opening hours, reservations, SHIDA continuation actions, and reporting text sit in the practical-information panel. The establishment route retains ownership, description and reviews below the menu. The seller area remains discoverable from the marketplace.
- Existing public photo URL allowlisting, revocable Backend photo delivery and lazy image sizing remain unchanged. The design adds no delivery promise, travel estimate, fee, promotion, ranking or location eligibility claim.

## Local validation

| Check | Result |
| --- | --- |
| TypeScript, changed-file ESLint, production build | Passed. |
| Marketplace, guest and photo unit suites | 80 passed. |
| Checkout, pickup and delivery-verification unit suites | 18 passed. |
| Disposable real-Backend HTTPS browser run | New marketplace → menu → two items → basket → quote → confirmation → visit summary passed. In the combined guest run, 20 of 21 passed initially; the sole failure was an obsolete seller-workspace `Edit` selector after concurrent navigation changes. That test was updated to the current navigation and passed in a focused rerun. The other cases covered general and fixed-table QR, private visits, repeat rounds, CDF/USD separation, closed or empty intake, replay, stale quotes, cancellations, four locales at 320/390/768/1280px, and a constrained connection. This was not a single clean rerun of all 21 after the test correction. |
| Isolated public fixture browser run | Detail/discovery: 15 of 16 passed initially; the desktop sparse-listing test exposed a card spanning the full row. The grid was bounded and that case passed in a focused rerun. Checks included long names, no photo, unpublished/unavailable menus, search/filter/pagination, four locale routes and no horizontal overflow. This was not a single clean rerun of all 16 after the CSS correction. |

Screenshots from the disposable real Backend were visually inspected: [phone marketplace](evidence/restaurants-customer-redesign/marketplace-phone.png), [tablet marketplace](evidence/restaurants-customer-redesign/marketplace-tablet.png), [desktop marketplace](evidence/restaurants-customer-redesign/marketplace-desktop.png), [phone menu](evidence/restaurants-customer-redesign/menu-phone.png), [tablet menu](evidence/restaurants-customer-redesign/menu-tablet.png), [desktop menu](evidence/restaurants-customer-redesign/menu-desktop.png), [phone quote](evidence/restaurants-customer-redesign/basket-quote-phone.png), and [phone visit summary](evidence/restaurants-customer-redesign/visit-summary-phone.png). The captures use synthetic establishments without photos. No physical device, live provider, real seller-uploaded photo, or native-language acceptance is claimed.

The existing Backend Restaurant release validation workbook was updated with a `CUX01` partial local check and a 13 October run-log entry. Its six sheets, formulas, validation rules, conditional formats and earlier statuses were preserved. Manual journeys and launch steps remain open.

## Remaining release work and order

1. Confirm the approved Backend public restaurant, photo and guest proxy versions, current migration head, and secure ingress in staging. No Backend contract change was required for this redesign.
2. Deploy the compatible Backend and maintenance processes before the Website update, following the existing Restaurant release runbook. Keep new intake closed until the existing launch gates are accepted.
3. On a populated staging restaurant, verify seller-uploaded establishment and dish photos, sold-out and unpriced foods, long names, mixed currencies, pickup eligibility and account-based delivery eligibility. Run the full Restaurant browser gate on the exact release revision.
4. Complete real phone/tablet and FR/EN/LN/SW human wording review, actual QR handoff and live-provider checks. Record these separately in the existing tracker before controlled intake or rollout acceptance.

The full platform suites and live release gate were not rerun in this Website-only task. Existing Backend/Business release blockers remain governed by the pilot release validation runbook.
