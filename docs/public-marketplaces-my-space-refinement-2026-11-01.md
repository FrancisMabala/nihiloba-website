# Public marketplace and My Space refinement — 1 November 2026

## Scope and data audit
The restaurant flow retains canonical guest cookies, account bindings, stable assiette/line keys, quote recalculation and idempotent submission. Menu selection is now a focused dialog. Quantity edits invalidate old quotations. Browsing estimates use exact decimal arithmetic and omit totals for unknown prices, missing menu pages or mixed currencies. Opening hours remain independent from ordering permission. Selection telemetry fires on the actual add action, rather than opening customization.

Landing breadcrumbs use a shared explicit landing context; detail navigation is retained. Wenze, Services, Jobs, Restaurants, Apartments and Hotels are covered. Transport uses its existing public introduction and had no MarketplaceBreadcrumb caller to remove. URLs, structured metadata and history are unchanged.

Wenze uses the existing product taxonomy, including its parent fields, rather than a new category dictionary. Main categories appear first; child categories follow the selected parent, and all categories remain available in a collapsed browser. Search and location filters survive category changes; continuation cursors reset. The backend sorts by publication (with optional area priority), not popularity, so the heading is Discover products / Découvrir les produits. The approved French/Lingala slogan is exact. The hero is CSS and existing SVG icons, not fictional product photographs. Existing cart, negotiation, variants, reporting and shop-review behavior remain intact. Long shop descriptions are expandable.

My Space separates Wenze individual-selling identities from shops. Service offerings group only by the backend provider_ref, using professional_profile for the public identity; unrelated providers and legacy unlinked offerings remain separate. Each profile links to the canonical Services management and public profile routes. Mixed offering statuses are labeled explicitly. Counts come from loaded authorized data; failed sources show a dash and paginated restaurant counts show a plus. Jobs navigation does not supply reliable listing counts, so no invented zero job counter is added. Account binding, organization access, transactions, messages and recovery remain intact.

## Validation and accepted limitation
The user instructed us to implement the batches and let them check the result live after the isolated localhost server was repeatedly rejected with `blocked by policy`. This changes the earlier pre-release screenshot requirement; it does not constitute a passing browser check. No alternate mechanism bypassed that restriction.

Focused frontend suite: 204 tests across 18 files, with failing assertions corrected and affected files rerun. Old assertions matched generic wording such as "private" (also present in reporting privacy copy), obsolete markup, and the now-removed landing breadcrumbs. Privacy tests now assert unique private fixture values. TypeScript, scoped ESLint and production webpack build pass. The restaurant backend's earlier 208 focused tests remain applicable; no backend code or migrations changed.

Browser interaction, five-width screenshot inspection and controlled complete-order browser acceptance remain unverified. No production test orders or account changes were created. The user will review the live interface; do not describe the visual work as screenshot-verified.

The approved My Space person-at-laptop illustration is available only in the composite reference. No independent matching asset was found in public assets. The new hero has the exact slogan and New Activity action; the existing empty-state illustration is preserved. The approved independent illustration is still required to finish that visual detail.

Urgent WhatsApp templates and response-time measurement configuration are unchanged. No new reviews, financial claims, notifications, payment confirmations or production sample data were introduced.

## Release
Website-only release, after focused checks; existing backend remains in place. Before push, inspect outgoing task-only commits and verify remote main. Rollback baseline: a1f959b634323f6e8eb101f1cc28ddc65f3c7b36. Deployment success requires exact commit verification, not merely a healthy HTTP response.
