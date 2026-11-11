# Public SHIDA marketplaces

Wenze, Restaurants & Malewa, Services, Jobs, Apartments, Hotels and Wewa / Transport share the Jobs heading scale and the four registration languages. Marketplace headings and header navigation use the same names. The permanent slogan stays in Lingala. Public descriptions and actions use the route language; sellers’ and providers’ own text is preserved.

The public language control retains the path, submitted query and fragment. For an unprefixed public entry, the browser restores a guest’s last choice or reads the signed-in account’s preferred language. Explicit localized links open in their own language. Account changes use the profile revision and session binding used by account settings. A rejected save keeps the current page open.

A welcome invitation requires a successful, unfiltered, empty catalogue. Wenze distinguishes shops from products. Services checks the existing provider and service responses; Restaurants checks dishes and establishments and continues to stream dishes when places are already available. A failed request never establishes an empty marketplace. Transport keeps its WhatsApp ride request and driver onboarding.

Browser regression: run the registration-enabled build with local fixtures, then run Playwright with `playwright.public-market-languages.config.ts`. The fixture environment requires no real accounts, listings, or WhatsApp messages. The guided Swahili registration case at 390px in `playwright.registration.config.ts` also checks the profile preference write and subsequent public visit.
