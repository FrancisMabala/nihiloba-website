# Shared Personal seller workspace — 17 October 2026

The authenticated Wenze, Restaurant/Malewa and Services areas now follow the
Services management design. Scope is the existing Personal seller/provider web
areas only, as clarified by the user. Public marketplaces, the separate Business
Dashboard and marketplaces without an implemented seller workspace are outside
this change.

## Presentation

- Shared cream canvas, forest-green active navigation and primary actions, gold
  keyboard focus, warm paper cards, serif headings and consistent form controls.
- A reusable marketplace identity, SVG icons and navigation component; desktop
  uses a 218px sidebar with a bounded scroll area for longer menus. At 760px and
  below all three use horizontally scrolling navigation with native buttons.
  Keyboard and direct-link selection reveal the active destination without
  scrolling the page.
- Wenze and Restaurants use the same page heading, responsive content width,
  cards, table treatment and 44px minimum buttons / 46px form fields. Long
  establishment names occupy a full row on phones, above publication/actions.
- Wenze and Restaurant setup invitations/forms use centered paper surfaces.
  The existing Services setup and detailed publication/bill designs remain.
- Restaurant destinations are directly visible rather than nested inside a
  separate accordion. Existing capability checks still determine which items
  appear; counter/table selling stays within Selling. Wenze retains all ten
  sections, and Services retains all seven sections and mounted draft panels.

The reusable implementation is `app/components/shida/seller-workspace.tsx` and
`seller-workspace.css`. CSS is scoped under `seller-design`, present only on
the three seller route containers. Existing module components continue to own
their data, forms and operations. Future seller workspaces can reuse these
presentation components once their own working destinations exist.

## Preserved behavior

One Personal session does not grant another marketplace's management authority.
Each workspace still waits for exact profile discovery, handles failed/denied
reads as failures and offers explicit setup only after a valid empty result.
No account or provider is created merely by visiting the page.

No API contracts, plan policies, domain lifecycle, publication rules, money
semantics, authorization or backend executable code changed. Existing unsaved
draft protection, immutable uncertain retries, revision conflicts, session
replacement and capability revocation remain in the owning components. CDF/USD
stay separate. The shared navigation takes an explicit disabled state from the
Restaurant editor and does not bypass its existing action guard.

## Focused validation

The final production build (including TypeScript) and focused ESLint checks pass.
All 177 focused browser cases pass: 24 Wenze, 131 Restaurant/shared-access and 22
Services. The selected unit command passes 129 tests across six loaded files.
Desktop and phone screenshots were visually reviewed; this caught and corrected
long Restaurant headings squeezing beside action buttons on narrow screens.
The selected gate includes only affected web management areas and shared access:

```text
node node_modules/next/dist/bin/next build
node node_modules/@playwright/test/cli.js test --config playwright.wenze.config.ts
node node_modules/@playwright/test/cli.js test --config playwright.seller-workspace.config.ts
node node_modules/@playwright/test/cli.js test --config playwright.services.config.ts services-provider.browser.ts services-workspace.browser.ts
node node_modules/vitest/vitest.mjs run tests/restaurant-seller.test.ts tests/wenze-personal-gateway.test.ts tests/services-management-gateway.test.ts tests/services-bill-statement.test.tsx tests/services-imp18c.test.tsx
```

The browser checks exercise EN/FR/Lingala/Swahili, desktop/tablet/phone layouts,
keyboard navigation, setup, ownership discovery, session changes, Wenze stock
and expense operations, Restaurant menus/orders/settings and Services publication
and bill previews. Retired sign-in/accordion/receiving test selectors were aligned
with the existing current UI without weakening the access or operation checks.
Visual evidence is isolated in the [preview gallery](evidence/seller-workspace/README.md);
12 representative captures are committed and earlier design evidence remains
historical. Synthetic data is used; this is not live-account,
physical-device, WhatsApp-delivery or deployment acceptance.

## Release

Website-only deployment. No migration, new dependency, environment variable,
background worker or backend deployment is required. No full platform/backend
test suite is requested or run. This task is committed locally; pushing requires
the user's separate authorization. Module readiness and outstanding live/human
language acceptance gates are unchanged.
