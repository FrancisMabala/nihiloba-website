# Shared marketplace UX release

Approved reference: Services public/provider design and the 21 October 2026 public/workspace mockups.

## UX-SHARED-01 — shared chrome

- Compact language dropdown, forest initials avatar and a persistent localized “Mon espace” entry.
- Account menus open one at a time and close on outside interaction, Escape, focus leaving, or selection. Personal-session changes clear the previous identity/menu.
- Web public pages share SHIDA marketplace navigation. Wenze, Services and Restaurant personal workspaces share the same controls; Business shell and Wenze use the same control implementation.
- Public Mon espace is a navigation hub, not an authentication bypass. Inbox opens existing Services-request and Employment-application conversation destinations. Organization Services links use the existing capability-protected message workspace. This is not a new aggregate message API, and does not add Wenze or Restaurant chat.
- Existing WhatsApp verification, cookies/session restoration, draft guards, organization permissions, stock/sales and receipt behavior remain authoritative. No migration needed.

Validation: production webpack build and TypeScript; targeted lint (no errors); browser checks at 320/390/820/1366 px for language/account menus, sharing, drafts and centered dialogs. Website also verifies WhatsApp code entry, expired/switched accounts and failed sign-out recovery. Synthetic data; no live transaction writes. Evidence: `docs/evidence/shared-chrome/`.

Platform tracker: SHIDA_Platform_Master_Tracker.xlsx, Milestones UX-SHARED-01 through 03. Release SHA and deployment checks are recorded there after push.

## UX-SHARED-02 — public marketplace surfaces

Public SHIDA pages share the warm Services palette, compact query/city search strip, one header language selector, light footer and card treatment. Mobile navigation retains the cart link. Wenze product discovery keeps category, condition, price and variant filters in its advanced panel; store scope is preserved. Corporate pages and print styles remain separate.

Validation: production webpack build/type checking and scoped ESLint pass. 24 browser journeys cover seven discovery routes plus six detail/entry destinations at 390, 820 and 1366 px, including filter submission, language changes and horizontal overflow. Evidence: `docs/evidence/shared-public/` (synthetic fixtures; employment/product search includes empty-state coverage). Four focused presentation suites pass 86 tests. The wider presentation run passes 113 and reports three pre-existing Wenze store markup assertions; both the assertions and WenzeStorePage are unchanged from the batch starting commit. No database or live inventory mutations.

## UX-SHARED-03 — seller/provider workspace surfaces

The personal Wenze, Services and Restaurant workspaces share warm paper surfaces, light navigation and readable dark active states. The shared layer is screen-only, preserving printed output. Wenze's previous dark-sidebar rules are overridden explicitly to retain readable inactive labels. Existing controls, inventory, sales, draft guards and permissions are unchanged.

Validation: production webpack build/type check, scoped ESLint and 16 browser journeys pass. Coverage includes phone (320/390), tablet (768/820), laptop (1366/1440), Services in four languages, Restaurant Today/Orders/menu/portion editing, public Inbox navigation, and Wenze account dismissal, preserved edits and centered confirmation dialogs. Screenshots use isolated synthetic fixtures in `docs/evidence/shared-workspaces/`. Restaurant assertions now target its actual navigation rather than a duplicate inside the closed tools dialog. Inbox layout assertions wait for route rendering to settle. No migration required.

### Public search final live-smoke correction

The final live smoke inspection exposed legacy input selectors winning the border cascade. The common primary-search rule now includes all public wrappers and matches the input-type exclusions with sufficient specificity. 21 search journeys pass at phone/tablet/laptop widths, including explicit border checks, filter submission and language-query retention. Production build/type checks and scoped lint pass. Follow-up screenshots: `docs/evidence/shared-public-final/`; earlier evidence preserved.
