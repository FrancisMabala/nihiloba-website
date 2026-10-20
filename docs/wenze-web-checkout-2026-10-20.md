# Wenze direct web checkout — WNZ-05

The existing cart now offers website ordering with a Personal sign-in, explicit
pickup/delivery choices per boutique, and a durable My orders destination.
The buyer still may continue through the existing WhatsApp handoff instead.
After web ordering, the configured WhatsApp link opens the existing order-list
command. Its copy explicitly asks the buyer to press Send with the same account.
No automatic delivery, payment or fiscal certification is claimed.

The same-origin gateways forward HttpOnly cookie authority and a bounded
idempotency key. Backend validation remains authoritative for variants, stock,
prices, currencies and fulfillment. Failed requests preserve retry identity.
Price/stock conflicts refresh the cart's existing explicit resolution controls.
Cart mutations are disabled during submission. Session changes suppress stale
confirmation results. Login wording is specific to ordering.

EN/FR buyer pages retain Nihiloba colors, stacked mobile fields and per-shop
choices. Tests use synthetic data only: gateway authority/error/privacy checks
and four 390px pickup/delivery retry flows. Screenshots are under
`docs/evidence/wenze-checkout/`. Final validation and exact deployment evidence
are maintained in the authoritative implementation tracker.

Deploy backend before website. No new dependency, setting or migration.
WNZ-06/07 owns unified notices and proactive WhatsApp confirmation eligibility.
