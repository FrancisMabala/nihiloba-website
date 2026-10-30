# My Activities design acceptance

The dashboard keeps existing Personal ownership APIs authoritative. It reads active and archived Wenze stores, paginated Personal restaurants and Services profiles/capabilities. Navigation permissions must also load before an empty state can be asserted. Partial failures retain the successful marketplace lists and offer retry. Restaurant pagination uses the reported total; partial counts say “Showing”. Other marketplaces retain their existing WhatsApp management entry rather than inventing per-record data or counts. The Business shortcut requires the existing organization-management permission.

Existing cards precede creation options. New activity exposes marketplace creation without repeating onboarding; job and discovery options remain secondary. Existing approved Cloudinary images are used where the management DTO supplies them, with category icons otherwise. Incomplete and inactive records remain manageable. Published entries link to existing public reference routes. The job-seeker link uses the supported localized candidate command; Offer a job opens the supported localized Employment menu and explicitly tells users to select Personal context. No messages are sent automatically.

All styles are scoped to My Activities. Header, sidebar, account recovery and urgent WhatsApp templates are unchanged. No backend product changes or migration are required.

## Reproduce

Use a backend Python environment with its pinned requirements installed. From the website checkout:

1. `python scripts/activities-acceptance-backend.py <path-to-shida-backend>` starts an isolated SQLite backend on loopback port 8057, with synthetic accounts, real domain records and normal cookie authentication. It disables dotenv loading. It never connects to production or sends provider messages. Stop it after the checks; its temporary database is disposable.
2. `npm run build`
3. `npx playwright test --config playwright.activities-design.config.ts`
4. `npm test -- tests/personal-activities.test.ts tests/services-account-navigation.test.ts`

The acceptance-only Node transport maps one reserved fixture origin to the actual local backend HTTP server. It does not manufacture API responses or override authorization. The browser uses deliberately synthetic local session cookies. No production sessions, credentials or user records are copied. API request routing is mocked only in additional error and regression cases, not in the final empty/one/many layout tests.

The production build is tested at 360, 390, 768 and 1440 pixels with empty, one and multiple activities, including draft/inactive restaurants and multiple marketplaces. Other checks cover locale rendering, failed permission loading, cross-account denial, creation disclosure, public links and exact management references. Keep production smoke results separate from this isolated acceptance evidence.
