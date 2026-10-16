# Personal Website Receiving orders and Selling — 16 October 2026

Implemented locally; no deployment or commit created by this task. Release remains Partial.

The [shared implementation report](../../Backend/docs/restaurants_receiving_return_2026_10_16.md) records the prior stale-state bug,
exact refreshed/draft/quote/uncertain-write behavior, preserved authorization,
privacy, changed files, test commands/results, migration head and release limits.
Production browser evidence is in [the local capture directory](evidence/restaurant-return-2026-10-16/).

Reproduce production verification with:

```powershell
node node_modules/next/dist/bin/next build --webpack
npx playwright test -c playwright.return.config.ts restaurant-return.browser.ts
```

The test configuration starts an isolated local production preview with synthetic
API fixtures. It does not sign into a live seller account or place live orders.
Physical-device and native-language acceptance remain open.
