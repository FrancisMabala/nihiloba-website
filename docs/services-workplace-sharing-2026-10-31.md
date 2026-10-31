# Services workplace, sharing and Counter — 31 October 2026

## Architecture audit and phased scope

The existing SVI professional identity is shared by SVC service listings. Personal accounts retain the five-active-service limit and can use permitted different categories. Organization ownership, grants and its separate Dashboard are unchanged. A professional trading name is not company registration or professional verification.

Services Counter has immutable SCS sales, SCR payment receipts and append-only adjustments. Wenze has separate product sales, stock movements, purchase-cost snapshots and reversal rules. There is no explicit authorized SVI-to-shop association or canonical mixed-sale transaction. Two independent writes would risk partial success and duplicate financial attribution. Mixed sales, product selection/public product tabs and combined Money totals are therefore intentionally deferred under batch 13's safe-integration exception. No duplicate catalog, invented stock or financial aggregation was added.

## Implemented phases

A: nullable professional_settings JSON on the existing profile. Work modes are independent multi-selections (workplace/customer/remote); Counter defaults on for existing users, independently of physical premises. Workplace address uses the existing ISO/location normalization and Kinshasa commune dictionary; quartier remains manual because no complete authoritative dictionary exists. General preferences do not rewrite service booking rules or locations. Settings use the existing owner authorization, profile lock, revision compare-and-set and replay ledger. Organization edits via this Personal endpoint are denied.

Public address requires an explicit consent boolean and workplace mode. Withdrawing consent removes the structured workplace from the public DTO. Exact saved workplace values are also redacted from public free text. No address is added to QR URLs or receipt snapshots. Only the owner projection returns private settings.

B: the existing QR generator now accepts profile/service targets. The profile target resolves the existing SVI canonical page with at least one eligible published service; the service target retains the SVC booking URL. No identifiers are regenerated. Browser share/copy/WhatsApp/download actions remain user initiated; no Meta template delivery is added.

C: Counter gains distinct New sale/History navigation, compact quantity controls, a confirmed-success panel and a contextual Wenze destination. Existing service prices, supported agreed/manual prices, single-currency validation, partial payments, idempotency, immutable receipts and adjustments remain authoritative. Counter disable blocks new creations after replay lookup, while historical reads, receipts and legitimate payments/adjustments remain available through Money.

F: existing authorized WhatsApp provider handoff includes localized links to work preferences and profile/service sharing. Detailed setup remains on the web; no longer registration conversation or new identity is created. EN/FR/LN/SW messages, saved locale, Organization boundaries and login checks remain intact. Urgent WhatsApp templates are unchanged.

## Financial boundaries and remaining work

Existing bill_display_name overrides and legally required issuer presentation are retained; new documents fall back to shared professional identity, old snapshots remain unchanged. Printing remains full/58/80 mm and browser Print/Save PDF; receipt sharing uses the existing explicit WhatsApp action. No unsupported card gateway is shown.

Services records payment allocated to the bill (not cash tender above the balance). Durable cash tender/change and private sale notes are not currently stored; adding a calculator that silently discards tender/change would be misleading. Those fields and their immutable receipt snapshots remain a separate financial extension alongside mixed transactions. No cash-change or mixed-product acceptance result is claimed.

Required integration before mixed sales: explicit profile/shop association; actor/context/grant revalidation; one canonical sale reference and atomic service/product line records; Wenze variation/stock locks and price/cost snapshots; replay-safe financial attribution without double counting; append-only reversal/restoration tests; CDF/USD separation and missing-cost disclosure. Products and inventory stay in Wenze meanwhile.

## Migration and rollout

New head 0214 adds one nullable JSON column after 0213; no backfill or existing-record rewrite. Existing Counter remains enabled when null. Apply 0214 only with explicit production migration authorization, then deploy backend before website. This new batch is not deployed. No new environment variables, workers, cron, templates or dependencies.

Prior approved Professional Identity release: backend 33b03723 deployed before website d52afc4; both exact commits verified Live in Render, and the signed-in production profile/service page loaded successfully. GitHub status API returned no status records, so this is not claimed as green CI.

## Validation evidence

Focused isolated backend suite: 76 collected, 71 passed, 5 PostgreSQL-only concurrency tests skipped on SQLite. Covers identity, settings, profile privacy, schedule/QR, Counter and adjustments. Migration 0214 round trip preserves prior data and compiles PostgreSQL offline; exactly one head. Additional WhatsApp handoff/localization checks and final UI results are recorded in the completion report. No production customer records were created or modified.

The website uses a production webpack build because the installed dependency junction is outside Turbopack's root. TypeScript and scoped lint are run. Gateway/Counter unit tests: 31 passed. Browser fixtures cover four languages, phone/tablet/desktop sizes, consent states, mobile/remote work, QR targets/download, sale/receipt printing, corrections/refunds and uncertain-response retries. Initial tablet QR CSS conflict was corrected; final results recorded below.


## Final validation and file manifest

Final browser run: 14 passed across EN/FR/LN/SW and 320–1440 px widths. Gateway/Counter unit tests: 31 passed. Production webpack build (including TypeScript) and scoped ESLint passed. Additional WhatsApp checks: 37 passed. Final workplace/privacy suite after QR-name sanitization: 17 passed. These overlap earlier runs and are not a unique-test total. Five PostgreSQL-only concurrency checks remain unexecuted in the SQLite environment; run them against isolated PostgreSQL before production rollout. Full backend suite was not run, in accordance with focused testing policy.

Task files in this repository:

- `app/api/shida/personal/services/[[...path]]/route.ts`
- `app/components/shida/services-counter.css`
- `app/components/shida/services-counter.tsx`
- `app/components/shida/services-management.tsx`
- `app/components/shida/services.tsx`
- `app/services/shida/public-client.ts`
- `app/types/shida-public.ts`
- `tests/browser/services-counter-adjustments.browser.ts`
- `tests/browser/services-counter.browser.ts`
- `tests/services-management-gateway.test.ts`
- `app/components/shida/services-professional-work.tsx`
- `app/components/shida/services-sharing.tsx`
- `app/components/shida/services-workplace.css`
- `app/lib/services-workplace-copy.ts`
- `docs/services-workplace-sharing-2026-10-31.md`
- `playwright.services-workplace.config.ts`
- `tests/browser/services-workplace.browser.ts`
