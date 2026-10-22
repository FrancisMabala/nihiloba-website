# SHIDA discovery refinement and shared navigation

Implemented in an isolated checkout based on `3e2fe7c`. The active development
checkout, unfinished École work and previously generated evidence are preserved.

## Visual changes

- Wenze uses a tighter breadcrumb/title/tab/search/filter/category rhythm. The
  filter disclosure and reset share a row; opening filters retains every field.
- Mixed-category products use one square image frame, a two-line title region,
  aligned price regions and equal-height cards. Missing images retain their frame;
  missing prices reserve space without inventing a price. A single product occupies
  one grid column, never the whole desktop row. Full names remain accessible in links.
- Primary actions and selected filters share forest green; cream surfaces and gold
  focus/secondary accents remain. Restaurant search fields stack in a clear order
  on phones and retain the dish, city and advanced marketplace filters.
- The language chevron is removed from the shared control. Its disclosure,
  keyboard handling and existing language-change behavior remain.
- SHIDA's footer contains product/help/legal links and copyright, without the
  corporate slogan. A flex page shell uses available viewport height; the footer
  is in normal flow, with no fixed positioning or arbitrary content spacer.
- École/Business keep their SVG illustrations and links, with redundant body copy
  removed. The WhatsApp account action is green and retains the canonical
  `Bonjour` entry into the existing Personal/Business onboarding. The NIHILOBA
  SHIDA story link is a secondary gold-outline action.

## Navigation and boundaries

The shared `ShidaNavigation` replaces My Space's old bottom bar/dialog and reuses
its icons, account labels and native-dialog focus pattern. It has Home, Explore,
Activities, Manage and Menu in EN/FR/LN/SW. Explore targets the homepage's marketplace
section; Activities opens existing My Space, and Manage opens its authorized
activity overview. Menu retains orders, requests, conversations, receipts, account
settings/language, cart, help and the existing Business Dashboard entry.

At 700px and below this is one fixed five-item bar, with safe-area padding and
reserved document space. It hides while editable form controls have focus and
returns after blur, avoiding browser-specific keyboard-resize assumptions. On
desktop/tablet it is an ordinary navigation row below the marketplace header.
The restaurant basket summary sits above the mobile bar, with content clearance.

The existing seller-shell boundary excludes Wenze, restaurant and Services
operational workspaces, including their receipts. Their local navigation and
guarded My Space return links remain. No second permanent bottom bar is mounted.
Public exploration remains anonymous; protected pages still use their existing
session and capabilities. Business remains a separate authenticated organization
context: navigation grants neither membership nor a new Personal-to-Business SSO.
Marketplace header links now retain the current supported language and include
all seven marketplaces.

No marketplace business logic, API contract, authentication protocol, payment
flow, database migration, Business code or onboarding implementation was changed.
No PWA or native application dependency was added.

## Verification

Passed: production build and TypeScript, changed-file ESLint, 46 focused unit/API
tests, 74 Chrome public/personal browser checks, eight mobile WebKit checks and
106 existing operational browser regressions. GitHub Actions currently has no
workflow configured. The fixture network guard logs blocked external image
prefetches; those requests cannot reach production from the fixture server.

Repeatable checks:

```
node node_modules/next/dist/bin/next build
node node_modules/@playwright/test/cli.js test --config=playwright.refinement.config.ts
node node_modules/@playwright/test/cli.js test --config=playwright.refinement-webkit.config.ts --grep "390|320|navigation menu|basket remains"
node node_modules/@playwright/test/cli.js test --config=playwright.phase3.config.ts
```

The refinement suite checks the homepage and all seven marketplaces in four
languages at 390/820/1440px, populated/empty results, search submissions, footer
position, selected routes, language/menu keyboard behavior, anonymous and signed-in
My Space, identity replacement, denied management access, Business entry links,
restaurant basket clearance, and product dimensions at 320/390/820/1440px.
Existing seller regressions exercise Wenze checkout, restaurant counter sales,
Services scheduling and provider management. Focused unit/API checks cover public
contracts, discovery, login and account navigation; build, TypeScript and changed
file ESLint also run.

Browser screenshots are in `docs/evidence/refinement/`. Listing-grid and account
scenarios use isolated synthetic records; the statically built homepage can retain
public listings cached during the production build. The runtime fixture wrapper
permits no external backend traffic. WebKit's local HTTP test
documents omit only `upgrade-insecure-requests` from their response CSP because
that production directive upgrades local assets to nonexistent HTTPS. Production
security headers are unchanged. Browser-engine/mobile emulation does not replace
physical iPhone/Android hardware testing; real OS keyboard and browser-toolbar
behavior remains a manual-device verification limitation.

Final test counts, remote commit SHA and exact Render deployment status are in the
completion report. Production verification is read-only; no orders or accounts
are created for smoke testing.
