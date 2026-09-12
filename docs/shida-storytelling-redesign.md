# SHIDA storytelling redesign

Implemented for `/shida/`, `/en/shida/` and `/fr/shida/`.

## Changes

- `app/components/pages/shida-page.tsx`: server-rendered editorial landing page, eight stories, story navigation, marketplace links, connection journey, compact direct-access explanation and final CTA.
- `app/components/pages/shida-page.css`: scoped styles using the existing ivory, cream, forest, muted and line tokens, Georgia headlines and shared buttons.
- `app/lib/shida-copy.ts`: typed English and French copy, alt text, captions, journeys and CTA labels, following the Home/About/Products copy architecture.
- `app/components/pages/localized-pages.tsx`: exports the new SHIDA component in place of the previous landing-page renderer; removes its unused imports.
- `tests/browser/shida-review.mjs`: production-browser verification and screenshot capture.

## Stories and assets

| Section | Character | Existing image |
| --- | --- | --- |
| Hero | Everyday city life | `/shida/shida-hero.png` |
| Employment | Christian | `/shida/shida-employment-christian.png` |
| Services | Grâce | `/shida/shida-services-braiding.png` |
| Wenze | Mireille | `/shida/shida-business-mireille.png` |
| Housing | Patrick | `/product/products-shida-housing.png` |
| Hotels | Sarah | `/shida/shida-hotel.png` |
| Restaurants | Jean and family | `/shida/shida-restaurant-family.png` |
| Transport | David | `/shida/shida-transport-driver.png` |
| Professionals | Mireille | `/shida/shida-kivu-landscape.png` |
| Closing | River panorama | `/product/products-closing-pont-marechal.png` |

Visual inspection, rather than filenames, determined the two Mireille placements: the business asset shows the female clothing seller; the Kivu asset shows laptop work. The existing bridge panorama provides a genuine wide landscape composition. No images were downloaded, generated or duplicated. Pre-existing user asset additions/deletions were left intact.

## Preserved behavior and content choices

The official `https://wa.me/46769709059?text=Bonjour` URL is unchanged. Six localized marketplace links remain available directly within the relevant stories. Transport and business CTAs use the existing general WhatsApp entry point rather than inventing module URLs. Opening WhatsApp was verified by inspecting the destination; no message was sent.

Shared header, footer, cart, language navigation, page routes, canonical links, OpenGraph and metadata architecture remain unchanged. Marketplace implementations and transaction QR flows were not edited. The previous landing page contained QR explanations and a decorative QR icon, not a functional scannable landing-page QR; the compact replacement explains direct access without fabricating a code.

Characters are illustrative scenarios, identified as such above the stories. Captions are editorial text, not invented first-person testimonials. Copy avoids guaranteed employment or bookings, automatic matching, payment claims, instant transport dispatch and restaurant ordering claims. Housing copy preserves privacy before a visit. Business tools are explicitly described as still in development.

## Mockup interpretation and responsive behavior

Retains the reference's serif headlines, alternating stories, image/caption compositions, fine dividers and restrained journey icons. Uses NIHILOBA's existing deep green rather than the mockup's blue. Keeps the existing shared header/footer, omits unsupported app-store buttons and replaces testimonial quotations with editorial captions. Uses owned assets as supplied even where their subjects differ from the reference.

Desktop stories alternate copy and imagery. Tablet captions move below their images. Mobile stacks each story in reading order, retains captions and four-step journeys, and provides links with at least 44px height. The hero is loaded eagerly; remaining images are lazy loaded with explicit responsive sizes and reserved layout space.

## Validation

- Full lint completed with one unused-import warning, then the import was removed and lint of all changed JavaScript/TypeScript files passed without warnings.
- `npm run typecheck`: passed.
- Final `npm run build`: passed, including TypeScript and all 80 static pages. An earlier build logged a restricted backend network request but still completed; the final build completed without that warning.
- Chrome production review: English and French at 1440, 1024, 768 and 390px; ten images loaded at each size, eight stories, no horizontal overflow, no page JavaScript errors, valid anchors, keyboard focus styling, 44px links and retained header/footer elements.
- All twelve localized marketplace destinations returned HTTP 200. This verifies route availability, not completion of live transactions or backend data availability.
- `/en/shida/` and both languages of Home, About and Products passed route/heading smoke checks.
- Desktop and French mobile screenshots visually inspected; salon and restaurant crops adjusted to preserve faces.
- `git diff --check`: passed.

Evidence: `test-results/shida/verification.json` and `{en,fr}-{1440,1024,768,390}.png`. Reproduce against a running production server with `node tests/browser/shida-review.mjs` (defaults to port 3034; override with `SHIDA_TEST_URL`).
