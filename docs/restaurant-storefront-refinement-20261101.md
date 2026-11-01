# Restaurant storefront refinement — 1 November 2026

Compact restaurant identity header, category navigation and menu rows now share the existing plate-selection and basket flow. Desktop basket and mobile sticky entry use the same selections. Opening hours remain distinct from ordering availability. Existing save, follow, reporting, reviews and WhatsApp handoff remain intact.

The decorative cloche uses a CSS viewport over the supplied approved reference PNG; illustrative listings are not inserted into production data.

Validation: 61 focused unit tests, 33 restaurant browser tests across four languages and five widths, targeted ESLint, TypeScript and production Webpack build passed. Tests cover plate grouping, quantities, removal, dialog focus, parent restaurant association and checkout error recovery. No backend, migration, payment verification or urgent-template changes.
