# Guest QR optional auto acceptance — NIHILOBA consumer

**Local implementation, 2026-10-11.** No deployment, commit, push or intake-gate
change. Backend `0146` owns the exact establishment setting and acceptance.

The Personal Restaurant intake workspace reads and updates the off-by-default
revisioned owner setting through its existing session-bound, Origin-checked,
private/no-store seller proxy. An uncertain response retains its original
operation envelope and offers an explicitly labeled retry. The guest page
reports the canonical submitted state as
accepted or awaiting restaurant confirmation in FR/EN/LN/SW; QR scanning and
visit creation remain read/authority setup only. Existing receipts, pickup
code and unverified payment copy remain unchanged.

Local verification: production build and typecheck passed; focused guest and
proxy tests passed. The real-Backend HTTPS Chrome guest run passed 17
scenarios, including off/on/off submission and all four locales; the added
Personal owner control passed in a separate real-Backend Chrome run. Existing
unrelated full-unit baseline is 375 passed / 4 page-presentation failures
(excluding the pre-existing `.s3a-local` snapshot); full lint has 9 errors /
2 warnings in unchanged files, as documented in the 09B2 handoff.

Deploy after Backend migration `0146` and all Backend processes use the new
service. Exercise a controlled real phone with off/on/no-stock/off rounds,
private cookie loss, manual seller acceptance, Kitchen/Bar, pickup proof and
four-language human review before production release. See the
[Backend contract](../../Backend/docs/restaurants_rm_v11_guest_qr_auto_accept.md).
