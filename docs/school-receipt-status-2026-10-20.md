# School Receipt status page — 20 October 2026

The public SHIDA École status page reads only the Backend's status-only Receipt
verification endpoint. Routes follow the existing SHIDA receipt family:
`/shida/school-receipts/{receiptRef}` and
`/{fr|en|ln|sw}/shida/school-receipts/{receiptRef}`. The page is dynamic,
uncached, and excluded from indexing. Server fetches use `no-store` and do not
send browser cookies to the Backend. Only the opaque Receipt reference, Receipt
number and current School-recorded/reversed/refunded status appear. Failed API
requests are shown as temporarily unavailable, separately from unknown or demo
references. The API response is rejected if it includes extra private fields.

No outward link, printable final Receipt, amount, School/pupil/contact detail,
WhatsApp delivery or provider-confirmation claim is released by this slice. The
pilot School still needs to approve the Receipt sample before those flows are
enabled. The existing nonprofit Education page is unchanged.

Focused validation: `tests/school-receipts.test.ts`, typecheck, targeted ESLint
and webpack production build. No new environment variable or dependency. The
existing `SHIDA_API_BASE_URL` is used with the HTTPS default; no migration.
