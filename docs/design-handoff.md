# Espace vendeur — Le carnet du malewa

A revised visual proposal for NIHILOBA, responding to the user's feedback that the first seller mockups looked generic and AI-generated.

Status: new design proposal for review, not approved application implementation. Earlier files remain unchanged. All menu content, prices and account states shown are demonstration data.

## What changes

The actual NIHILOBA identity leads: tree logo, light ivory header, forest text, restrained gold accents and existing navigation. The seller area lives inside the website rather than becoming a separate dark-header admin product.

The establishment and its menu take priority. The authenticated home opens on useful menu content instead of a grid of generic shortcut cards. Horizontal text navigation replaces the large sidebar. Fine rules, modest type sizes and square controls echo a clearly written menu sheet.

A small original cooking-counter illustration gives the sign-in page character. The authenticated workspace largely uses text and controls, preserving a light experience for daily use.

“Le carnet du malewa” is the design direction's name, not a mandatory new product name or slogan.

## Three revised screens

- [Connexion](01-connexion.png): light NIHILOBA header, original cooking illustration and direct WhatsApp sign-in on the page.
- [Le menu au centre](02-comptoir.png): establishment identity, menu-first workspace, local portion names, exact prices and simple navigation.
- [La fiche portion](03-portion.png): a clear Pondu editor for configured monetary portions, adapted to mobile.

Each board includes desktop and mobile. The fixtures use “Chez Ya Mado” as an illustrative name familiar from the user's public demo; none of the illustrated private state, menu entries or prices is asserted to be real account data.

The user requested that the sign-in artwork be integrated. Use the supplied [standalone Malewa-counter illustration](assets/malewa-comptoir.png), with its [integration notes](assets/README.md), rather than regenerating the image or cropping the webpage mockup.

## Local character

The concrete references are the user's own Malewa ordering examples, dishes such as fufu, pondu, madesu and Thomson, the Lemba/Kinshasa context, and a menu/sign vocabulary.

This is a contemporary design interpretation, not a claim that all Congolese or Kinshasa businesses share one aesthetic. No invented Lingala slogans, generic continent motifs, unrelated textile patterns, masks or borrowed artist compositions are needed.

The illustration is original generated artwork, not a photograph of an actual establishment or seller. No searched image is reused as a site asset.

Limited contextual references reviewed:
- [Kuku's own Kinshasa restaurant site](https://www.kukugrillades.com/) — a local restaurant branding reference, not a template to copy.
- [Spécial Malewa cultural coverage, 19 August 2015](https://www.adiac-congo.com/content/art-culinaire-special-malewa-offre-une-vitrine-la-gastronomie-congolaise-37113) — context for the variety of Congolese cuisines, not evidence for a single national visual style.
- The user's actual NIHILOBA screenshot, local logo asset and website CSS tokens.

## Implementation rules after selection

1. Keep the real NIHILOBA logo asset and existing global navigation. Do not retype or redraw the logo from a generated image.
2. Keep display lettering restrained. Names, amounts, form fields and buttons remain ordinary accessible text. Long establishment names must wrap.
3. Reuse existing fonts, API contracts, controls and locale handling. Do not ship the mockup itself as a webpage image.
4. The five desktop sections are Mon menu, Plats du jour, Horaires, Ma fiche and QR & partage. On mobile a compact Menu / Du jour / Horaires / Plus arrangement may expose the same sections. Creation, selection, preview and publication must remain reachable.
5. A menu-first home needs proper no-establishment, empty-draft and empty-menu states. Do not manufacture rows to make a screen look populated. It should load only data required for its actual screen and preserve pagination.
6. The sidebar's removal is a layout decision, not a deletion of capabilities. Keep category management, fixed dishes/components, unknown prices, configured amounts, CDF/USD constraints, hidden/temporarily unavailable states, dated offerings and exceptional closures.
7. Fiche publiée means publication only. It does not mean open, verified, stocked or entitled to new features.
8. Keep the exact WhatsApp authentication sequence: create a browser-bound challenge, have the user SEND the prepared message, then return to that browser. No OTP/Business gate or new auth system.
9. Preserve existing revisions, stable retry keys, exact Personal establishment/item binding, saved-versus-uncertain states, access-loss handling, gateway origin protection, private/no-store responses and account-switch/logout behavior.
10. Preserve backend-provided public and QR destinations. Prepare QR only on request. Do not replace a WhatsApp destination with a fabricated web-menu URL.
11. These screens do not add orders, reviews, analytics, billing, staff roles, mandatory installation, persistent offline storage or screen-awake controls.
12. Retain FR/EN/LN/SW routes and honestly report fallback coverage. Generated French copy is a layout reference; all shipped strings must use the existing translation system.

## Price presentation

- Fufu: 1 000 CDF / boule — a unit price.
- Pondu: 500 or 1 000 CDF — configured monetary portions, no inferred weight.
- Thomson: 500 CDF / morceau — a unit price.

These are fictional examples from the product discussion, not claims about current market prices.

Keep decimal precision, supported currencies, UNKNOWN pricing and backend validation. The owner is configuring a menu; no customer order composer or automatic quantity inference is introduced.

## Low data and acceptance

One small optimized original illustration may be used on desktop sign-in. Mobile may omit it or request a much smaller appropriate asset; hiding a downloaded large image is not a data saving.

Authenticated screens need no decorative photographs, animation, chart package or map. Use ordinary CSS for fine rules and colour. Do not apply heavy paper-texture backgrounds behind form text.

Before release, verify 390/768/1440px layouts, keyboard use, at least 44px targets, contrast, long names, all supported locale routes, empty states, slow/error/reconnect behavior and revision conflicts. Keep auth rollout/acceptance separate from visual review.

## Generation record

Mode: built-in image-generation tool, one substantive redesign/edit call per screen. Inputs: each corresponding previous seller board, actual NIHILOBA logo and actual website screenshot. The logo/screenshot are references; source files are not edited. Exact prompts and reference paths are in [prompts.md](prompts.md).

All three final images were visually inspected before delivery. The set includes the light NIHILOBA header, coherent establishment/menu navigation, legible demonstration prices and mobile treatments. Raster mockups are visual proposals, not tested browser implementations.

Implementation refinements: retain the exact existing logo asset rather than the generated approximation; keep all four locale choices accessible even when a mockup hides them under the menu; reserve serif/display lettering for headings and use the existing sans font for dense prices and controls where it improves reading. The small hand-painted slogans in the artwork are optional decoration, not approved product copy or a new brand. Do not repeat them across every working screen. Preserve concise contextual help without making general quality claims about a seller's food.
