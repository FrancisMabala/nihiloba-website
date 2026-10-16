# Wenze product detail redesign

The product page now pairs a bounded, uncropped gallery with a product information and purchase column. Mobile stacks a short gallery immediately before the name, seller, price and purchase controls. The previous full-width hero and oversized photo are removed. Nihiloba's cream background, serif titles and forest-green buttons are retained.

Reference: [COS linen shirt product page](https://sa.cos.com/en/buy-oversized-short-sleeved-linen-shirt-black-dark). The implementation uses a restrained fashion product layout without copying COS assets or branding.

Existing shared gallery behavior supplies thumbnails, swipe navigation, keyboard navigation and an accessible full-screen viewer. Styling is scoped to `.wzp-product`; Services and other gallery consumers are unchanged. Product descriptions, delivery information and boutique details are grouped below the buying controls. Private favourites, variants, negotiation and fixed-price cart logic use existing components.

Validation: production build/TypeScript, focused lint, relevant cart/gallery unit tests and English/French Chrome checks. Browser checks cover gallery navigation/lightbox dismissal, adjacent desktop purchase panel, mobile overflow, reachable cart controls and a mocked cart addition. Public product data is read from the existing test shirt; browser API mutations are intercepted. Screenshots: `docs/evidence/wenze-product/`.

Release: website only; no migration or new environment variables. Commit locally and deploy only after explicit push authorization.
