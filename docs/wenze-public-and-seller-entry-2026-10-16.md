# Wenze public design and marketplace seller entry

## Changes

The Wenze directory and shop page previously used large hero bands and sparse, square cards. They now use a compact heading, search/city row, expandable filters, category links preserving the current search, and rounded cards within Nihiloba's forest, cream, sage and gold palette. Shops use a truthful initial/category illustration because the public shop contract has no logo field. No fabricated product images, reviews or promotional claims were introduced.

Shop pages place the catalog beside fulfillment and public store information. Product photography is contained rather than cropped. Mobile keeps two-column browsing for multiple products and gives a single product the available width. Existing cart, negotiation, public URL sanitization, physical-address privacy, category filtering and French/English public routes remain. Seller entry copy supports EN/FR/LN/SW.

Research references: [Etsy search](https://help.etsy.com/hc/en-us/articles/115015627947-How-to-Search-for-Items-and-Shops-on-Etsy), [Baymard listing information](https://baymard.com/research-articles/product-listing-information). These informed search prominence and comparison-friendly cards; Restaurant and existing Nihiloba tokens remain the visual reference.

## Login and seller access

SHIDA uses one Personal identity and browser session across marketplaces. A valid Restaurant session can therefore restore the same person's login in Wenze. Repeating WhatsApp login would authenticate the same identity; it would not establish Wenze seller ownership.

The previous Wenze UI rendered the entire navigation before determining whether this person owned any Wenze shops. The workspace now waits for the authenticated Wenze store listing. No shops means dedicated Wenze setup with explicit shop creation and an archived-shop option. A failed listing stays blocked with retry; it is never interpreted as successful empty discovery. Explicit report/deep links do not bypass this entry check. No shop or registration is created merely by entering the page.

In the current domain, a Personal Wenze shop is the durable seller record; this batch does not invent a second human account or a separate registration table. The gateway still derives the Personal actor from the current server session. Backend store discovery and each operation still check exact durable ownership and Organization isolation. The new UI check supplements those existing authorization rules. The pilot grants feature access, never ownership.

Restaurant already loads its own establishment list and starts creation for an empty eligible list; Services loads its own profiles and capabilities. Neither marketplace's records serve as Wenze seller registration. Those modules were inspected but not modified.

## Validation and release

- Production webpack build and TypeScript passed; focused ESLint passed.
- 56 focused Vitest tests passed: public presentation/privacy/cart, gateway/session binding and preserved search filters.
- 16 Playwright seller scenarios passed, including shared-login/no-Wenze-shop setup, explicit shop creation, failed discovery/retry, deep links, session expiry and four seller languages.
- Public desktop/mobile previews use the local production build and read-only public catalog; no live seller operations, messages or account changes were made. Evidence is in `docs/evidence/wenze-public/`.
- Backend and shared authorization code are unchanged. No migration, environment variable, dependency, worker or template is required. No backend/full-platform suite was run for this website-only batch. Previously recorded backend head was 0168; deployment should check its current head independently.
- Deploy the website through its normal process. Nothing was committed or deployed in this task. Sparse catalogs intentionally remain sparse; shop-photo support would require a separate public media contract.

Changed source: `wenze.tsx`, new `wenze-public.css`, `wenze-workspace.tsx`, `wenze-seller.css`, `wenze-seller-copy.ts`; updated public component/browser tests and this document. No Business Dashboard changes.

Suggested commit: `feat(wenze): refresh public storefronts and check marketplace seller setup`
