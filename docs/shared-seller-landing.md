# Shared SHIDA web seller landing

Wenze, Restaurants and Services now use `SellerLanding`, the same responsive signed-out entry presentation. These are the three implemented web seller workspaces. The component is reusable when additional marketplace workspaces are introduced; this change does not invent routes for marketplaces without a seller workspace.

The page pairs a seller-community illustration with a marketplace-specific heading, introduction and the existing WhatsApp sign-in component. A secondary navigation links all three seller areas, preserving EN/FR/Lingala/Swahili. Mobile keeps a compact image above the entry action. Localized personal-account guidance and the requirement to send the prepared WhatsApp message remain visible. Session restoration, logout, authorization, registration and authenticated workspace components are unchanged.

Services now uses the same standalone seller chrome as Wenze and Restaurants, without the public shopping header/footer. This also applies inside its authenticated workspace; the management component itself is unchanged.

Design research: [Etsy seller entry](https://www.etsy.com/sell) for seller storytelling with a clear entry action; [Shopify setup guidance](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup) for keeping the setup path focused. The implementation retains Nihiloba cream, green and gold, serif headings and locally relevant imagery.

Asset: `public/images/shida-sellers.webp`, optimized 1300 × 867 WebP, created using the built-in imagegen tool. Decorative aspirational artwork, not photos of actual listed sellers. Generation prompt: Warm premium editorial illustration of a cohesive Kinshasa neighborhood courtyard with a woman boutique seller arranging blue and ochre wax-print fabrics, a restaurant cook in a forest-green apron behind a small counter with pots, and a woman hairdresser helping an adult client. Dignified contemporary independent sellers, cream walls, plants and warm sunlight; landscape 3:2 composition with central subjects, no text, logos or UI.

Validation: production build/TypeScript, focused lint, existing seller/session unit checks, and Chrome checks for all three marketplaces in all four locales. Browser checks exercise image loading, active marketplace link, mobile overflow and sign-in visibility, mocked WhatsApp challenge creation and cancellation. No real WhatsApp message or account mutation is performed. Previews are in `docs/evidence/seller-landing/`.

Release: website-only deployment. No migrations, environment variables or backend changes. Local commit only until push is explicitly authorized.
