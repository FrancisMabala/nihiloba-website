# Restaurant website checkout — RM-V11-04

The public Restaurant detail/menu shows **Order food** only when the Backend's
exact-establishment ordering-options endpoint reports an actionable web
channel. The route remains hidden while `RESTAURANT_WEB_CHECKOUT_ENABLED` is
false. The checkout page loads one bounded public menu page at a time and
keeps fixed dishes and separately grouped Malewa plates in the canonical
selection shape. The customer chooses quantities or seller-allowed monetary
amounts, then pickup or seller delivery, optional food preference, a current
window and, for delivery, a declared zone plus private destination and
instruction. The Backend alone calculates the quote and fee.

The existing Continue with WhatsApp component signs the visitor into the
shared Personal session in place. Anonymous tab-scoped storage holds only
public menu refs, quantities/amount selections and display labels. Once
authenticated, the browser creates/reads the canonical server basket. Basket
and quote references never enter URLs. Delivery address and instruction stay
in component memory and are sent through the protected destination gateway;
they are absent from receipts and browser storage.

Every protected browser call passes the existing HttpOnly Personal session
gateway with Origin checks, binding, exact route/method allowlist, bounded JSON
body and private/no-store response. Stale quotes lead back to review. Explicit
**Confirm order** submits the same quote revision with a stable operation key;
uncertain responses use the existing operation recovery endpoint. Success
means **pending acceptance**, never paid or seller-confirmed.

Authenticated history/detail/receipt pages read the existing customer order
domain and retrieve the current pickup or delivery code only when the exact
customer is eligible. Sellers continue in their current Personal, Business
Dashboard and WhatsApp queues. The checkout does not introduce a second order
table, payment provider, guest identity, reservation, review or offline queue.

Backend migration `0133` and API code must precede this website version.
Leave web checkout disabled until controlled end-to-end acceptance for the
intended establishments. See the Backend
[RM-V11-04 report](../../Backend/docs/restaurants_rm_v11_04.md) for the full
release and privacy contract.
