# My Transactions refinement — 1 November 2026

## Audit and scope

My Transactions is a Personal customer index, not a seller ledger. Reused the existing private gateway, backend `personal_transactions.overview`, account-bound session, domain detail routes, SpaceIcon, sidebar, EN/FR/LN/SW copy and `/images/shida/transactions-empty.svg`. The shared top-level breadcrumb was already removed in release 57de696; no second removal or routing change was needed.

| Category | Existing authorized sources |
| --- | --- |
| Orders | Wenze buyer fixed-price and negotiated orders; Restaurant customer orders |
| Requests | Restaurant reservations, Jobs applications, Services posted/direct requests and bookings, Hotel bookings, Transport requests, Housing inquiries/visits |
| Documents | Protected Restaurant order receipts; latest issued or void Service bill version accessible to its customer |

Ownership uses canonical customer/requester identifiers. Organization management rights do not grant Personal transaction access. Seller sales, expenses, Counter receipts and reusable templates are not imported. Restaurant retention rules remain intact. Converted Service requests and superseded Housing interests are excluded by the existing backend. Bill revisions count as one document, and drafts do not count. Documents are not proof of payment. A seller with no purchases can legitimately have three zero counts.

Backend counts are calculated before pagination. This release does not infer totals from rendered rows. Wenze seller receipts are not a supported customer document source in this index. Hotels, Housing and Transport retain their safe read-only disclosures and existing WhatsApp management rather than invented detail routes.

## Implementation phases

- Layout: retained compact heading and breadcrumb-free shared shell.
- Summary: reusable category controls with green/blue/amber accents, large authoritative counts, chevrons, keyboard focus and selected states. Stack cards below 1000px to avoid compressed tablet text.
- States: preserved illustration, existing empty-state destinations and mixed-record presentation. Deduplicate document previews by canonical ID.
- Integration: reject inconsistent empty claims, malformed pagination, wrong kind/category combinations, duplicate page rows and unexpected detail fields. Failed requests remain errors with retry; unknown counts stay dashes.
- Localization: reuse existing four-language labels and domain-specific status translations, exact amounts/currencies and routes.

## Limitations

The existing backend returns one atomic overview from a database union, not independent per-marketplace success/error results. A source failure therefore remains an explicit overview error. No fabricated partial counts or speculative per-source aggregation was introduced. Changing that response contract is separate backend work.

## Validation

28 focused frontend tests; 7 backend transaction tests against a disposable SQLite database; 24 browser tests across 360/390/768/1024/1440px, with real fixture APIs for empty/single/mixed accounts, EN/FR/LN/SW, counts, pagination, keyboard filters, summary navigation, account switching, document/reservation navigation, failure/retry and loading evidence. Failure tests deliberately intercept errors. No production records were created or modified.

TypeScript, scoped ESLint, production webpack build and diff checks pass. Browser screenshots are under `test-results/transactions-evidence/`; the review copy is in the task workspace `outputs/transactions-refinement/`. Desktop empty/populated, mobile empty/populated and error views were visually inspected. The 768px review exposed crowded cards and prompted the stacked tablet adjustment before final validation.

## Changed files

- `app/components/shida/personal-transactions.tsx`: summary component and document preview deduplication.
- `app/components/shida/transactions-design.css`: responsive semantic cards and empty-state proportions.
- `app/lib/personal-transactions.ts`: stricter response validation.
- `tests/personal-transactions.test.ts`, `tests/transactions-summary.test.tsx`: contract and localized controls.
- `tests/browser/transactions-design.browser.ts`: tablet breakpoint, category navigation and state screenshots.

## Release

Frontend only; no migration or backend deployment required. Authentication, payment systems, seller Money and urgent WhatsApp templates are unchanged. This new brief requires authorization for its specific production release: implementation is committed locally for review, not automatically deployed. Baseline is website 57de696; rollback after release would revert only this task's commits via a normal forward commit, never rewrite main.
