# WNZ-11 — Personal seller audit corrections

Saved report formats now populate the schedule editor when switching weekly/monthly schedules. Report statuses and expense categories use the supported seller translations. Report history is presented once, and the separate PDF/Excel actions replace the duplicate combined export control.

Unauthorized or missing-shop responses clear stale shop/product/editor information. Operations also clear previously loaded financial and stock details after 401/403/404 responses; denied access is no longer described as a subscription problem.

The Business repository now mirrors these seller screens behind an Organization-bound API adapter. Backend permissions and the existing operational APIs remain authoritative; this release does not change payment, stock, order or tax policy.

Validation: production webpack build/type checking, targeted ESLint, and four synthetic mobile seller-redesign cases in EN/FR/LN/SW passed. The Business copy's focused schedule test verifies restoration and submission of the stored formats.

No migration or new deployment setting. Physical printer/scanner/native-share acceptance and blocked fiscal prerequisites remain separate from browser verification. The existing buyer clear-cart browser confirmation is outside this seller correction and remains a follow-up.
