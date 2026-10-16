# Wenze marketplace introduction

The main Wenze directory now shares the Services visual language: a split introduction, a compact shopping photograph with an asymmetric rounded corner, existing search/category controls, and a seller invitation below the results. English and French copy are included. Mobile uses a short image and stacked content. Boutique detail pages and cart behavior are unchanged.

Asset: `public/images/wenze-shopping.webp` (1200px, optimized WebP). Created with the built-in imagegen tool. This is an illustrative shopping scene, not a photograph of a listed seller.

Generation prompt: Create a premium natural editorial photograph for the Wenze local shopping marketplace by Nihiloba. Landscape 3:2 composition. A contemporary independent boutique in Kinshasa: a Congolese woman shopkeeper and adult woman customer warmly examining a cream linen shirt on a wooden hanger, small tasteful rack of clothing and neatly arranged woven bags in the background. Natural window light, warm cream walls, wood, subtle forest green details and restrained ochre accents. Authentic contemporary everyday shopping, dignified and relaxed, realistic faces and hands, uncluttered composition, medium shot. No text, no logos, no watermarks, no collage. Image will be cropped as a compact website introduction beside a headline; keep faces and shirt within central area.

Validation: production build, focused lint, English/French Chrome desktop and mobile checks for image loading, overflow, seller destination, search and category preservation. Evidence is saved under `docs/evidence/wenze-landing/`. Browser API calls are mocked; public directory reads use the configured catalog.

Release: website only. No migration or new environment variable. Deploy through the usual website release process after push authorization.
