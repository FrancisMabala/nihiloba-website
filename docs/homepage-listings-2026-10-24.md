# Homepage public listings refinement — 24 October 2026

The homepage public feed now sits directly on the cream page background. White individual cards, colorful discovery tiles and existing navigation remain. Emplois and Services use stronger serif headings with right-aligned browse links. Job titles sit beside decorative category icons; employer and public location follow below. Dates and detail links share a compact footer. Cards stretch only to their grid row's content height, without fixed minimum heights. Homepage Services retain their shared marketplace component and all existing public information, with tighter spacing.

Only homepage markup and scoped presentation changed. Public API projections, private-address handling, marketplace search, authentication, ownership and navigation are unchanged. Job rendering still selects only city, commune and area; Services retain the existing public location projection.

Validation: production build, targeted ESLint, 24 existing unit tests and 24 Chromium/WebKit browser cases across EN/FR/LN/SW at 360, 820 and 1440 pixels. Browser cases cover transparent parent surface, icon/title alignment, long text wrapping, equal desktop job card heights, dates, keyboard access, preserved category navigation and absence of private address/landmark sentinels. Fixture data is isolated to explicit test commands. Screenshots in `evidence/home-listings-20261024/` show desktop, tablet and mobile. No backend or database changes.

Reproduce: build with the repository's isolated Services fixture environment and `node --import ./scripts/home-listings-fixture-fetch.mjs node_modules/next/dist/bin/next build`, then `node node_modules/@playwright/test/cli.js test --config=playwright.home-listings.config.ts`.

Release verification will be recorded after the task commit is pushed and Render reports its status. Existing dependency audit reports 8 vulnerabilities; dependency upgrades are outside this presentation change.
