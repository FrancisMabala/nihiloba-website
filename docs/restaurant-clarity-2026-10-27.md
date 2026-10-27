# Restaurant workspace clarity — 27 October 2026

The restaurant workspace now has one shared establishment name. Public preview is available from Ma fiche instead of appearing above every task. Publication state remains in the profile. The establishment switcher, fullscreen controls and home-screen preference remain available.

Orders has aligned desktop column labels, responsive clickable rows and a short explanation. The redundant Go to Selling action was removed from the heading; the empty-state shortcut is retained.

Receiving orders explains how to enable pickup and delivery. Saved settings and edit actions stay visible; channel diagnostics, schedules and customer windows are expandable. Reservations starts with a short purpose statement, retains the detailed acceptance limitations and removes duplicated reception warnings/settings actions.

Statistics keeps available totals visible, replaces a wall of unavailable metrics with one honest empty state, and moves methodology and breakdowns into disclosures. A failed or stale load is still unavailable, never presented as zero or insufficient data. Privacy thresholds, data collection, order/payment semantics and all backend authorization remain unchanged. Copy is supplied in EN/FR/LN/SW.

## Validation

- Production Next.js build including TypeScript: passed on Node 24.19.0.
- Targeted ESLint: passed. Targeted Vitest: 2 files, 5 tests passed.
- Responsive Playwright suite: 43 passed across EN/FR/LN/SW and 360/820/1440 px, covering orders, insights, intake error/recovery, and reservation list/calendar.
- Fixed a stale Swahili label in the test navigation helper; the application already uses Maagizo in both menus.
- Desktop orders, mobile statistics and the compact intake screenshot visually inspected; the added intake disclosure/edit-action regression passed (1 additional browser test). Existing screenshot evidence refreshed by the browser tests; additional intake capture is in evidence/restaurant-clarity-2026-10-27.
- Web/WhatsApp review: channel availability and source distinctions remain in expandable details; no WhatsApp messages, authentication paths, backend mutations or public customer routes were changed. Tests cover web/QR, WhatsApp, counter and assisted order sources.
- No production database operations or migrations.

## Release verification

Push and deployment results are reported in the task completion message. Public GitHub commit status/check/deployment endpoints are checked after push. Browser deployment verification previously stopped because Computer Use could not establish the current browser URL; this release uses terminal access where available and does not claim deployment from HTTP health alone.
