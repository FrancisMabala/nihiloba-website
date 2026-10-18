# Transport and Business public pages

English: `/shida/transport/`, `/shida/business/`. French: `/fr/shida/transport/`, `/fr/shida/business/`.

Both are public, server-rendered information pages using the marketplace visual design and existing shared site navigation/footer. The home and SHIDA Transport links open the informational page in a new tab. The SHIDA Business link opens its informational page; its dashboard button opens https://business.nihiloba.com in a new tab. No automatic WhatsApp navigation is performed. Dashboard authentication and access rights remain unchanged; WhatsApp may still be used for verification after the user chooses to sign in.

Transport is explicitly under construction. Wewa journeys are explained, while company services and subscriptions are clearly planned. No booking, payment, fleet or subscription functionality is added. Business explains organisation creation/claim, details and access to enabled modules without promising access or unfinished tools.

Each page includes localized metadata and sitemap entries. Existing illustrations are delivered as compressed WebP assets. At mobile widths, the hero, feature cards and business steps stack vertically.

## Validation

Production build and TypeScript passed. Scoped ESLint and sitemap tests passed. Microsoft Edge browser checks passed for both pages in EN/FR at 1440, 768 and 360 px, including image rendering, no horizontal overflow, entry-link destinations, new-tab targets and language switching. Desktop and mobile screenshots were visually reviewed. No backend changes or migrations are required.
