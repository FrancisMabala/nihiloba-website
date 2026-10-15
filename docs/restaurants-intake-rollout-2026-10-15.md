# Restaurant environment-wide intake rollout — 15 October 2026

Receiving orders now describes a service-wide closure in FR/EN/LN/SW.
The Backend uses `RESTAURANT_ORDER_INTAKE_ENABLED` alone for environment-wide
rollout. It defaults false. True admits eligible existing and future establishments
without registering references. `RESTAURANT_WEB_CHECKOUT_ENABLED` remains a separate
website customer-checkout gate, including guest QR checkout. Seller configuration,
authorization, publication, menu, stock, hours, fulfillment and payment checks remain.

For the test environment set `RESTAURANT_ORDER_INTAKE_ENABLED=true`; also set
`RESTAURANT_WEB_CHECKOUT_ENABLED=true` to exercise website customer/guest checkout.
The obsolete per-establishment allowlist setting is no longer read. Integration
fixtures enable the switches without collecting establishment references.

Restart every Backend instance with matching settings and source version; settings
are loaded at startup. The protected no-store intake diagnostic now contains only
`global_enabled` and `intake_released`. Neither boolean proves seller readiness.
No Render values were changed. Deploy Backend and Website together; do not mix old
allowlist-dependent Backend instances with the new rollout semantics. Close the
environment-wide switch before rollback and retain order-compatible code/schema.
Existing submitted orders, receipts and fulfillment remain accessible.

Remaining gates: deployed staging acceptance, PostgreSQL concurrency, actual
WhatsApp phone, physical devices and human FR/EN/LN/SW review. Local test results
are recorded in the Backend batch report. No production release is claimed.

Validation: 27 focused unit tests passed, TypeScript checking passed, and the
receiving-orders browser regression passed (release closure, missing setup,
expired periods and exceptional closure; local development server, mocked API).
Backend: 709 passed with one stale migration-head assertion failure; the corrected
migration check passed separately, as did 8 final language rechecks. Full details:
`C:/NIHILOBA/Backend/docs/restaurants_intake_rollout_2026_10_15.md`.

Deployment scope: if the environment already has intake enabled, this code admits
all eligible establishments immediately; an old reference list no longer limits
that scope. No deployed Render values were inspected or changed.
