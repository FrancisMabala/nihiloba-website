# Services Counter adjustments — 26 October 2026

User-approved scope and deployment: refunds already returned by the provider,
reversal of incorrectly recorded payments, and bill item/customer corrections.

The Counter and Money history now expose an adjustment review screen. It binds
each command to the displayed sale revision and uses the existing session-bound
financial retry mechanism. An uncertain response retains the identical request
and replay key; other Counter actions are locked until it is resolved. Refresh
reloads the selected sale so stale edits can be reviewed again.

Original bills and receipts remain available alongside corrected bills and refund
receipts. Selected snapshot content is used for full-page/58 mm/80 mm print and
explicit WhatsApp sharing. No message or refund transfer is sent automatically.
Copy is localized in EN/FR/LN/SW. Refunds preserve earlier credits and do not
reopen debt; a bill reduction may expose money still due back to the customer.

The gateway permits only POST on the explicit Counter adjustments path, preserving
session, Origin and exact-owner checks. Backend migration 0205 and its API must be
live before website rollout. No new environment settings or dependencies.

Changed files: Services Counter component, new adjustments component and localized
copy, transaction path contract, document/gateway tests, and browser tests covering
four languages, desktop/mobile sizes, original documents, compact printing and
identical-key payment-reversal retry after an uncertain response.

Validation: 12 document/gateway tests and nine browser cases passed. The five
adjustment browser cases were rerun after adding the reversed-receipt annotation.
TypeScript, ESLint and production webpack build passed. Backend rehearsal passed
28 PostgreSQL cases and the additive migration to 0205. Existing agreed catalogue
prices/names survive later catalogue edits. Exact live commits and final CI results
are recorded in the release closeout.
Physical printer/customer acceptance remains manual. Refund-entry editing, partial
reversal of one receipt, automatic money movement and tax certification are not
implemented. Whole mistaken payments can be reversed, then re-recorded correctly.
