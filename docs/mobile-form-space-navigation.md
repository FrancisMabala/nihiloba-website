# Mobile product creation, My Space and Manage

## Confirmed causes and changes

The product wizard inherited `.wp-step-actions { position: sticky; bottom: 74px }` from the older bottom navigation. It remained inside the form scroll flow, while the newer management navigation had a variable measured height. The footer could float across the fields and coexist with navigation. The wizard now uses a dedicated fixed footer at the visual viewport bottom, measures its actual height with ResizeObserver, and reserves that height plus keyboard inset in the wizard. VisualViewport resize/scroll and focus events keep controls and associated inline errors clear. Safe-area padding is included in the measurement. Normal bottom navigation is hidden only while the wizard exists and restored on cancellation/completion. Other editors and checkout footers are unchanged. Existing validation, submit payloads, draft and leave guards remain intact.

The desktop My Space sidebar was `display:none` below 700px without an alternative. The same entries and selected-state function now render the existing desktop sidebar and a mobile details selector under Mon espace. Escape closes and restores focus; leaving the selector closes it. Existing URLs, leave checks and browser history remain in use.

Safari follow-up: null focus loss must not close the selector before a tapped link receives its click. Actual outside pointer presses and keyboard focus leaving to a known control dismiss it. The fix and destination-content regression checks are documented in `space-selector-safari-20261116.md`.

The global Manage tab previously opened `view=management`, which is the personal Mes activités page. It now opens the dedicated `view=manage` selector. Mes activités stays in My Space, with its shortcuts and creation flow unchanged. Signed-in accounts can open the empty management state too.

## Desktop/mobile section mapping

Both use the same array in `space-sidebar.tsx` and the same conditions:

| French label | Destination / nested selection |
| --- | --- |
| Vue d’ensemble | `space?view=overview` |
| Mes activités | `space?view=management` |
| Mes annonces | `space?view=listings`; individual-only accounts retain the existing replacement rule; job-offer selects this section |
| Ma recherche d’emploi | `space?view=job-search`; candidate selects this section |
| Mes transactions | `space?view=transactions`; orders, requests and receipts select this section |
| Notifications | `space?view=messages` |
| Mon compte | `space?view=settings`; recovery/support select this section |
| Aide et questions | `space?view=questions` |

Labels and URLs retain French, English, Lingala and Swahili equivalents. The global My Space tab remains selected for personal sections. `view=manage` alone selects Manage.

## Management access

The selector consumes the existing authenticated store, restaurant and service management lists. It lists each Wenze store, each restaurant/Malewa establishment and each canonical service provider workspace (legacy standalone service records remain individually reachable). Server-linked offerings of the same provider share their actual workspace; separate providers and shops stay separate. Exact existing `store`, `establishment`, `provider` or legacy `offering` parameters are retained. Duplicate source rows are deduplicated. Restaurant pagination is exhausted for this selector. Failed sources show an error/retry, never an empty success. Account changes invalidate data through the existing session binding.

Business remains a separate existing handoff only when `organization_management` permits it; it is not a fabricated organization card. No apartment, hotel or transport management module was added. Existing creation entry points remain in Mes activités. All destination APIs continue to enforce authorization.

## Focused verification

Passed: production build, TypeScript, changed-file ESLint, 30 route/activity/mobile-navigation unit tests and 35 focused browser tests. Browser tests use isolated fixtures and intercept every API request. They exercise all four creation steps, required-field errors, expansion, upload, single submission, cancellation/retention, restoration of normal navigation, keyboard viewport simulation, landscape/enlarged text, shared navigation parity, nested links/back, zero/one/multiple/duplicate/denied sources. Widths: 320, 375, 390, 430, 820 and 1440. Four languages checked. Evidence is retained outside the repository under `C:/NIHILOBA/release-evidence/mobile-form-space-20261115`.

These are Chrome viewport simulations. Physical iOS Safari/Android keyboards and browser toolbar animation have not been tested; no real user account or production write is used in browser checks. No backend suite, migration, new dependency or Business deployment is required.
