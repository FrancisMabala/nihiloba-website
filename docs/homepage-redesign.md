# Homepage redesign

The English and French homepages now use a spacious editorial layout with the existing NIHILOBA cream, forest green, Georgia serif and sans-serif type system.

## Files

- `app/components/pages/home-page.tsx`: server-rendered homepage sections and marketplace links.
- `app/components/pages/home-page.css`: homepage-scoped styles and responsive layouts.
- `app/components/pages/localized-pages.tsx`: re-exports the new homepage; other page implementations retained.
- `app/lib/home-copy.ts`: typed English/French homepage copy and image descriptions, following the existing locale-keyed dictionary convention.
- `app/lib/i18n.ts`: homepage search/social descriptions updated for web and WhatsApp access; existing titles, canonical URLs, language alternates and OpenGraph images retained.
- `tests/browser/homepage-review.mjs`: repeatable local browser validation.
- `docs/evidence/homepage/`: eight production screenshots and `verification.json`.

## Implementation

Sections: split hero; numbered real-life approach; connected name/baobab story; SHIDA with seven compact marketplace tiles; people and organisations; secondary planned Education strip; image-supported contact invitation. Existing header and footer remain intact.

Reuses `ButtonLink`, `ArrowRightIcon`, `localizedPath`, the official WhatsApp constant, `SiteDocument`, `Header`, `Footer`, cart provider, container and Education styles, and existing design tokens. No dependencies or fonts added. The homepage uses `next/image`, responsive sizes, reserved image ratios, localized alt text, eager/high-priority hero loading and lazy loading below the fold.

Uses all 12 supplied assets, without substitutions: `hero-kinshasa.png`, `built-around-real-life.png`, `baobab-tree.png`, `employment.png`, `services.png`, `wenze.png`, `housing.png`, `hotels.png`, `restaurants.png`, `transport.png`, `people-organization.png`, and `contact-city.png`, all under `public/home/`.

Desktop combines an asymmetric split hero, approach/name columns and a three-column marketplace grid. Tablet moves the name story below the approach and the marketplace below its introduction. Mobile stacks the major sections, uses wider image crops and a two-column marketplace grid, and retains readable serif headlines and at least 44px CTA heights.

## Validation

- Before implementation: `npm run lint` and `npm run typecheck` passed.
- After implementation: `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Build generated both localized homepages successfully. It logged a caught `fetch failed / EACCES` from an existing remote marketplace fetch under restricted networking; exit status was 0. The homepage does not fetch remote data.
- `npm exec vitest run tests/button-link.test.tsx`: 2 tests passed.
- Start production with `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3022`, then run `node tests/browser/homepage-review.mjs` (or set `HOME_TEST_URL`).
- Production browser validation passed in EN and FR at 1440, 1024, 768 and 390px. It checks all 12 optimized images and original asset URLs; one H1; locale and metadata; seven marketplace links; all internal homepage CTA responses; header navigation, cart and language-switch visibility; mobile menu; keyboard skip link; no horizontal overflow; and no page runtime errors.
- Screenshots were visually reviewed for desktop and mobile composition. No Core Web Vitals field measurement was performed.

## Assumptions and limits

- The supplied attachment contains only the written brief. No mockup image was available, so exact visual differences cannot be assessed. Headline wrapping responds naturally to viewport and language.
- Transport has no public browsing route in the repository and opens the official WhatsApp entry point. Employment uses `/shida/emplois`, housing uses `/shida/appartements`, and other tiles use existing marketplace routes with the existing locale helper.
- Approach and name links lead to About; the people/organisations link leads to SHIDA. Education retains its existing restrained visual treatment with an explicit planned label.
- Business/management statements are qualified by marketplace availability because existing SHIDA content describes further business capabilities as planned. The requested name copy is presented as brand symbolism.
- Internal destination pages responded successfully, but marketplace data availability depends on the external backend. No WhatsApp message was sent.
- Existing unrelated restaurant changes and supplied untracked assets were left intact. No deployment or commit was performed.
