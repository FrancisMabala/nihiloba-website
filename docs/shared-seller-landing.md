# Shared SHIDA web seller landing

Wenze, Restaurants and Services now use `SellerLanding`, the same responsive signed-out entry presentation. These are the three implemented web seller workspaces. The component is reusable when additional marketplace workspaces are introduced; this change does not invent routes for marketplaces without a seller workspace.

The page uses a focused, image-free column with a marketplace-specific heading, introduction and the existing WhatsApp sign-in component. The content is centered within a 560px maximum width, without a surrounding card. A secondary navigation links all three seller areas, preserving EN/FR/Lingala/Swahili. Mobile puts the heading and entry action first, without artwork pushing sign-in down the page. Localized personal-account guidance and the requirement to send the prepared WhatsApp message remain visible. Session restoration, logout, authorization, registration and authenticated workspace components are unchanged.

Services now uses the same standalone seller chrome as Wenze and Restaurants, without the public shopping header/footer. This also applies inside its authenticated workspace; the management component itself is unchanged.

Design research: [Etsy seller entry](https://www.etsy.com/sell) for seller storytelling with a clear entry action; [Shopify setup guidance](https://help.shopify.com/en/manual/intro-to-shopify/initial-setup) for keeping the setup path focused. The implementation retains Nihiloba cream, green and gold, serif headings and restrained spacing. Public marketplace imagery is unchanged.

The previous seller-community illustration is retained as an unused asset; seller entry pages no longer render or preload it.

Validation: production build/TypeScript, focused lint, existing seller/session unit checks, and Chrome checks for all three marketplaces in all four locales. Browser checks exercise absence of landing imagery, active marketplace link, mobile overflow and sign-in visibility, mocked WhatsApp challenge creation and cancellation. No real WhatsApp message or account mutation is performed. Previews are in `docs/evidence/seller-landing/`.

Release: website-only deployment. No migrations, environment variables or backend changes. Local commit only until push is explicitly authorized.
