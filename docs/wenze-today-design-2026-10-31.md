# Wenze Today dashboard refinement

## Scope and state rules

The existing Personal Wenze Today page now uses compact daily indicators, a contextual setup panel, positive-count operational alerts, recent order rows, community metrics and a stock summary. Existing sidebar, shop selector, session binding, authorization, checkout, inventory, product editing and financial reports are reused. The separate Organization/Business frontend and its access policies are unchanged.

Setup is determined exclusively by explicit `catalog_ready === false` or `order_ready === false`, supplied by the existing backend readiness policy. Catalog readiness concerns name/category/city; order readiness concerns valid fulfillment methods. Neither status, visibility nor zero sales makes a shop incomplete. Missing readiness fields do not imply incomplete setup. A configured shop with zero sales gets normal indicators without onboarding. Product count is not a readiness requirement, so the UI does not invent an “add your first product” requirement. The contextual Add product link opens the existing catalogue; Complete shop setup opens My shop.

Orders awaiting action or in progress, low/out-of-stock inventory, untracked stock and stock awaiting initialization are independently shown when their real counts are positive. Earlier orders remain included. All-clear requires known zero values for every relevant order/stock count; unavailable data never becomes zero. Partial failures retain the successful metrics and show an error with Refresh available.

## Existing data and navigation

- `stores/{ref}/today?timezone=…`: local-day sales union, quantities, followers, new followers today, lifetime review count/rating. Financial access and separate currency totals are preserved. Recorded sales are explicitly not a payment balance. Sold items and profit/expense details remain available in expandable sections.
- `orders?store_ref=…&bucket=all&limit=5`: recent order updates using the existing backend ordering, authorized buyer display names, public references, creation dates, amounts and localized status labels. Counts cover all matching shop orders, not just the five rows. Rows open the existing order detail workflow, with exact-shop verification before displaying the returned detail. View all opens Orders.
- `stores/{ref}/inventory/summary`: in-stock, low-stock, out-of-stock, untracked and uninitialized counts. Low stock can overlap out of stock; no summed distribution or misleading percentage is rendered.
- Existing shop-keyed mounting isolates selections and disposes late responses. Kinshasa/Lubumbashi selection and refresh behavior remain intact.

No migrations, backend changes, new dependencies, environment settings, workers, templates, analytics collection or production sample data are introduced. Urgent WhatsApp template behavior is unchanged. Authentication and Organization permission checks are unchanged; the existing Personal gateway still rejects Organization paths.

## Visual adaptation and data gaps

Cream/forest-green cards, serif headings, compact alert rows, storefront illustration, a two-column desktop layout and stacked mobile layout follow the approved reference. Existing navigation and functional timezone control are retained. Unsupported growth percentages, visits/views and date-range controls are omitted. Customer reviews are lifetime figures; only new followers and sales are labelled daily. The illustration is decorative inline SVG, not a new UI library.

## Validation

- Production build, TypeScript check and scoped ESLint pass.
- Four existing frontend suites: 25 tests pass, covering Personal gateway boundaries, inventory presentation, seller improvements and formatting.
- Browser checks: 42 cases across 360/390/768/1440 widths, EN/FR/LN/SW, new/configured-zero/active/attention/error/partial/restricted states, recent-order navigation, New sale, setup links, shop selection, loading and late previous-shop responses. Existing eight product-editing/shop-management browser regressions are included. Final affected timing checks pass after correcting the test interception to accept the API's trailing slash.
- Browser screenshots are reviewed for desktop/mobile density, readable rows, warning/setup colours and overflow. Fixture transactions remain solely in browser test interception.
- Focused tests against the unchanged backend: 9 pass, 11 fail. All four `test_wenze_seller_redesign.py` checks pass, including local day, exact-store sales/privacy and media migration compatibility. Eleven older `test_wenze_seller_minimal_activation.py` conversation assertions expect WhatsApp setup states/actions, while the current backend routes them to `WEB_MANAGEMENT` / `wenze_orders`. These are pre-existing failures in untouched backend code; this frontend change does not resolve them. An initial pytest temporary-folder permission error was resolved by rerunning with an isolated writable base directory. No full backend suite was run.

## Release

Prepared on `feature/wenze-today-design-20261031`. Production is intentionally not changed: the supplied change brief requires authorization for this specific change set before deployment. After approval, merge validated website changes, verify the deployed commit, and smoke-test real authorized shops, switching, order detail and checkout. No backend deployment or migration is required.
