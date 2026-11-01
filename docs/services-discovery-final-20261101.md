# Services combined discovery — 1 November 2026

## Delivered
Compact Services hero and permanent Lingala slogan in EN/FR/LN/SW. Services and professionals appear together with bounded server-side requests, category/location filters, view-all links and backend pagination. Bottom customer/provider invitations retain existing destinations. Compact responsive cards use uploaded images, category placeholders for missing service imagery and existing provider initials when no profile image exists. No fictional listings, ratings, verification badges or availability were added.

## Audit and reuse
The existing public Services endpoint supports service and professional modes. Its professional query groups eligible supply by provider_profile_id **before pagination**. Public DTO identity supplies the card name and public reference; five services remain separate listings under one profile. Both modes reuse the existing eligible supply and filters. Public storefront, booking availability, packages, quotation requests, shared navigation, account routing and WhatsApp handoff remain in place. No backend changes, migrations, payment changes or notification/template changes.

Provider cards label general commune/city as Location rather than claiming it is service coverage. The directory response does not supply authoritative profile-wide remote/delivery modes or separate credentials; no such badges or controls are fabricated. Existing supported service-location filtering is preserved. Reviews are provider ratings, not invented service-specific reviews. Ranking remains existing publication order, described as discovery rather than popularity.

## Validation
30 focused unit tests passed, including five listings/one professional, no invented ratings, privacy and independent error handling. 35 distinct browser scenarios passed: four locales, widths 360/390/768/1024/1440, category/location preservation, empty/partial failure, storefronts, package prices and stale appointment handling. The last browser assertion was corrected to accept the configured trailing slash and rerun successfully. TypeScript and scoped ESLint passed. Production build passed with `next build --webpack`; local default Turbopack could not resolve the existing node_modules junction outside this checkout. No dependency or deployment configuration changed.

## Release
Website-only release. Verify the pushed SHA against origin/main and Render's source commit and Live status. Rollback baseline: feb47c81a5ff6ab15d7c7ab3741c4ae7e9f9b652. No data rollback is necessary.
