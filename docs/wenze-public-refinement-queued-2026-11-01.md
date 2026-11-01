# Queued Wenze public refinement and shared navigation batch

Requested 1 November 2026. Execute after completing and validating the Restaurants public refinement. Do not mix its release with unfinished restaurant work.

Source brief: attachment 5c22f63c-f2a0-4b07-954c-02c363e87d7d. Sequence: shared landing-page breadcrumb cleanup as a separately validated batch, then Wenze hero/category hierarchy/cards and responsive checks. Preserve detail/storefront/cart/order contextual navigation, URLs, search parameters and structured metadata.

Preliminary read-only audit:
- MarketplaceBreadcrumb and MarketplaceSectionBreadcrumb are the existing shared primitives. Wenze and Jobs use the section primitive; Services and Restaurants also construct landing breadcrumbs directly. Apartments and generic marketplace detail pages use the same breadcrumb primitive, so changing it indiscriminately would remove useful detail navigation. Audit remaining landing routes before introducing an explicit landing/detail distinction.
- WenzeCatalog consumes getWenzeProducts and the existing category JSON. Reuse these, ProductCard, existing cart actions, public image validation and Products/Shops/My Orders routes.
- Verified backend query_public_wenze_product_candidates_db in app/database/wenze_repository.py: optional area priority, then created_at descending and id descending. This is NOT popularity ranking. Use “Découvrir les produits” and localized equivalents; do not add a popularity claim or unsupported sort controls.
- Exact approved slogan: “Teka, somba, solola prix, nyonso na Wenze!” Graphic baseline must use lightweight CSS/SVG/icons, not generated product photos or the reference screenshot. Actual eligible listing photos remain data-driven.

Status: audit only. No shared navigation or Wenze implementation changes made yet. Restaurants browser validation remains blocked: automatic approval review again rejected the unchanged isolated test-server launch with “blocked by policy”. Do not treat automated unit/build success as visual validation or deploy the unfinished restaurant changes. Urgent WhatsApp templates remain unchanged.

## Implemented 1 November
The queue is now implemented in the same task-owned checkout: explicit shared landing breadcrumb policy, localized CSS/SVG hero, real taxonomy parent/child navigation and collapsed all-category browser, compact product cards and accurate discovery heading. See public-marketplaces-my-space-refinement-2026-11-01.md. Browser verification remains outstanding under the user's latest instruction to review the results live.
