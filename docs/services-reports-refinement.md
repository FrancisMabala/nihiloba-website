# Services Reports dashboard — 31 October 2026

## Implementation
Two report tabs, operational summary cards, current pending and reliably dated completion metrics,
creation-event trends, bookings-by-service distribution, service filter, current publication details,
selected-currency financial cards, received/expense trends, category breakdown, descriptive surplus,
CSV exports and independent section errors. Shared SpaceIcon and existing Money/report date helpers
are reused. Lightweight accessible charts include exact data tables; negative effects remain signed.

Money and Reports use the same backend provider_period_totals calculation. No duplicated ledger,
profit engine or fabricated product integration. No speculative growth percentages. Income-by-service
is explicitly unavailable because partial Counter payments cannot reliably be allocated across lines.
The existing Money page retains reconciliation details. Reports links use the real work/finance routes.

## Dates, scope and compatibility
Filters explicitly select UTC days for creation/completion events, including both selected dates.
The API receives an exclusive end date. Financial effective calendar dates retain Money semantics.
As-of timestamps display Kinshasa time with the zone named. Completed legacy work without completed_at
is excluded and disclosed. Pending means current unexpired SUBMITTED/IN_REVIEW requests regardless
of the historical period. No historical pending snapshot is claimed.

Optional offering_ref applies only to operational JSON/CSV; currency applies only to financial JSON/CSV.
Gateway rejects provider/organization scope injection, duplicate filters, invalid currency and wrong-kind
filters. Backend revalidates exact ownership; Organization Admin finance remains denied. CSV only:
PDF/Excel are not implemented. No migrations or WhatsApp template changes.

## Verification
- 13 focused period/filter unit tests passed; focused lint and production webpack build/typecheck passed.
- 10 browser tests: EN/FR/LN/SW, finance capability restriction, retry, export, retained successful sections,
  currency isolation, signed adjustments, populated/empty states and 360/390/768/1024/1440px without overflow.
- Backend focused selection: 28 passed, two PostgreSQL-only concurrency skips; final reporting selection 6 passed.
- Browser fixtures are isolated and illustrative. No production records were created.

## Release
Previous Workplace/Sharing/Counter release is live: backend feaf54f9 (migration 0214), website 001bf182,
backend before website. Render exact commits verified. The refreshed signed-in SHIDA session expired,
so fresh private account-data smoke remains unverified; no production mutations were attempted.

This Reports batch is validated on feature branches and awaits specific release authorization required
by the supplied brief. Deploy backend before website. Roll back website to 001bf182 and backend to
feaf54f9 if needed; no database downgrade required. Monitor report latency for large providers because
financial charts reuse up to twelve bounded canonical totals calls. Urgent WhatsApp templates unchanged.
