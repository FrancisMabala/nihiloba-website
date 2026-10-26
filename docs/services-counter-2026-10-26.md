# Personal Services workspace and Counter — 26 October 2026

Release authorized by the user on 26 October 2026. Requires Backend migration 0204 and its Counter API before website rollout. The backend release preserves its actual deployed baseline; its existing revision 0203 is retained unchanged.

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

Release completed in order: authorized Backend migration 0204, backend release,
then website. Disposable PostgreSQL runtime checks passed before deployment.

## Verified production release — 26 October 2026

- Backend `5321cf7d80a307e3e16ad3bbb677c9bbea1fcfbc`: Render deployment `dep-dbfs22gu01pc73ac0mbg` Live; logs confirm successful migration 0203 to 0204.
- Website `20b85fce91563d40279df4ff044c2ffb08f3ce91`: Render deployment `dep-dbfs406gekts73de113g` Live, verified against its exact source commit. Both application commits were pushed to main and checked against remote SHAs.
- Backend CI run 40392799563 passed: 9,910 passed, 1,044 skipped, zero failures/errors; PostgreSQL 18 migration/concurrency and secret scan gates passed.
- Read-only production smoke: English/French Services pages return 200, the unauthenticated Counter gateway returns 401, and API health returns 200. No live customer transactions or WhatsApp messages were created.
- Render Auto-Deploy remains Off. This final closeout changes documentation only; the live application SHAs above remain authoritative.
- Local release evidence: `C:/NIHILOBA/release-evidence/services-counter-20261026`, including CI results and screenshots of both successful Render deployments.
