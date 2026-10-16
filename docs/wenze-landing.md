# Wenze marketplace introduction

The main Wenze directory now shares the Services visual language: a split introduction, a compact shopping illustration with an asymmetric rounded corner, existing search/category controls, and a seller invitation below the results. English and French copy are included. Mobile uses a short image and stacked content. Boutique detail pages and cart behavior are unchanged.

Asset: `public/images/wenze-shopping.webp` (750 × 562, optimized WebP). Replaced with the user's supplied boutique illustration (`codex-clipboard-aabed925-0ed7-46d1-a58c-5ff4c110cc3e.png`). No image regeneration or compositional edits; the existing responsive frame crops it at display time. English and French alternative text describe the fabrics and customer interaction.

Validation: production build, focused lint, English/French Chrome desktop and mobile checks for image loading, overflow, seller destination, search and category preservation. Evidence is saved under `docs/evidence/wenze-landing/`. Browser API calls are mocked; public directory reads use the configured catalog.

Release: website only. No migration or new environment variable. Deploy through the usual website release process after push authorization.
