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
