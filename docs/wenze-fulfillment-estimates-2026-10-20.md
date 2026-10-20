# Wenze fulfillment estimates

Pickup and delivery settings now include optional preparation and delivery time
fields, with plain examples in EN/FR/LN/SW. Existing unsaved-change handling and
revision-safe saving remain in use. Public shop/product fulfillment and the cart
show supplied estimates. Seller order details display the saved order estimate.
Older responses without estimates remain supported.

The backend stores an immutable estimate snapshot for each fixed order and
negotiated request. Estimates are not guaranteed completion or payment evidence.

Validation: 24 public/commerce adapter tests, four mobile language save checks
(390px, no horizontal overflow), targeted ESLint and webpack production build
passed. Mobile evidence is in `docs/evidence/wenze-fulfillment/`.
Deployment requires backend migration 0186 first; production authorization and
release evidence are recorded in the existing Wenze implementation tracker.
