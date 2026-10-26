# Personal Services workspace and Counter — 26 October 2026

Implemented locally; not pushed/deployed. Requires Backend migration 0203 and
its Counter API before release. Production migration requires separate user
authorization under the standing repository policy.

- One Share & QR code sidebar destination replaces repeated header, Today and
  Calendar share controls. Copy, native sharing, WhatsApp and QR download remain.
- Calendar retains Calendar and Opening hours.
- Money separates received entries from expenses, including their histories.
  Business totals show explicit inclusive dates and keep CDF/USD separate.
- Bill settings labels the existing display name as the business/professional
  name. New backend bill projections include frozen service/package names.
- Counter selects existing services/packages, quantities, exact prices and one
  currency; customer name is optional. It reviews before committing, handles
  uncertain responses with the same replay key and supports partial payments.
- Walk-in history also appears in Money. Receipts use frozen business/items and
  the balance after that payment, in full-page/58 mm/80 mm layouts. A print portal
  removes unrelated page content. User-operated WhatsApp sharing includes the
  selected itemised document; no message is sent automatically.

Personal gateway session/Origin/privacy enforcement remains; new Counter paths
cannot inject Organization scope. All user-facing copy supports EN/FR/LN/SW.
Backend ownership and monetary authority remain authoritative. No payment
processing, refunds/corrections for Counter sales, tax certification or automatic
customer notification is introduced. The Business Dashboard frontend is unchanged.

Validation: TypeScript and production webpack build passed (the default
Turbopack build rejects this isolated checkout's external node_modules junction).
37 focused unit/gateway tests and 10 browser cases passed, covering Counter at
1440/820/390/320 px, four languages, sharing consolidation and booking receipt
correction with the separate expense view. Print-media checks pass; no physical
thermal printer, live customer session or live WhatsApp acceptance was used.
The final build/check commands and exact commits are reported in the chat.

Release order: authorized Backend migration 0203, backend release, then website;
verify remote commit and Render deployment identity. PostgreSQL runtime checks
are still a backend release gate because the local Docker engine is unavailable.
