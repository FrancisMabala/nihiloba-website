# SHIDA Wenze website cart

## Architecture and token persistence

The website uses a same-origin Next.js BFF for commerce. The backend's opaque guest-cart token is stored in the `nihiloba_shida_cart` cookie with `HttpOnly`, `SameSite=Lax`, production `Secure`, high priority, and the narrow `/api/shida/cart` path. Browser code never receives or reads the cart token. The cookie contains no customer profile, address, phone, payment data, or order details.

All private cart responses use `Cache-Control: private, no-store, max-age=0`. Mutating BFF routes reject cross-site requests. References and quantities are constrained before forwarding. The BFF does not log tokens or backend payloads and returns sanitized error codes rather than backend exception text.

Product images and public detail links are not present in the backend cart DTO. The BFF therefore enriches cart lines from the existing public Wenze product endpoint. Prices, stock, quantities, seller grouping, and totals always remain the commerce backend's response; the website does not calculate authoritative commerce values.

## Integrated commerce endpoints

- `POST /api/v1/carts` (lazy guest-cart creation)
- `GET /api/v1/carts/{cart_token}`
- `POST /api/v1/carts/{cart_token}/items`
- `PATCH /api/v1/carts/{cart_token}/items/{item_reference}`
- `DELETE /api/v1/carts/{cart_token}/items/{item_reference}`
- `DELETE /api/v1/carts/{cart_token}/items`
- `POST /api/v1/carts/{cart_token}/validate`
- `POST /api/v1/carts/{cart_token}/accept-price-changes`
- `POST /api/v1/carts/{cart_token}/handoff`
- `GET /api/public/shida/wenze/products/{ref_or_slug}` for public-only cart presentation enrichment

The website intentionally does not call checkout or confirmation endpoints. Delivery or pickup selection and final confirmation remain in WhatsApp.

## Public API audit

All public marketplace browse/detail APIs for Jobs, Services (including providers, availability, and reviews), Apartments (including owners), Hotels, and Wenze are already integrated in their corresponding website pages.

| Backend endpoint or capability | Website status | User value | Priority | Decision |
| --- | --- | --- | --- | --- |
| `PUT /carts/{token}/fulfillments/{store}` | Not integrated | Delivery/pickup details | V1 deferred | The approved flow completes fulfilment in WhatsApp and the website must not collect addresses. |
| `POST /carts/{token}/checkout` and `/confirm` | Not integrated | Final order creation | Do not expose in website V1 | WhatsApp owns confirmation and seller notification. |
| `GET /orders/{token}`, QR, cancellation | Not integrated | Post-order status and cancellation | Future feature | Requires a separately designed secure order-return experience. |
| Seller-order actions/details | Not integrated | Seller operations | Private/business only | Must not be exposed on the public website. |
| Hotel check-in and Wenze pickup token pages | Backend-owned entry pages | Fulfilment verification | Keep backend-owned | Token-specific operational pages are outside public marketplace browsing. |
| `/go/{public_token}` public entry redirect | No website route in this branch | Branded entry links | Small safe follow-up | Independent of the commerce cart and should be implemented/tested as a dedicated redirect change. |
| Privacy-safe cart analytics events | Not integrated | Funnel measurement | Future | No approved analytics abstraction exists in this repository; no provider was introduced. |

## Environment

`SHIDA_API_BASE_URL` remains the only API configuration. Production defaults to `https://api.nihiloba.com`; deployments should set it explicitly. No public browser environment variable or cart secret is required.
