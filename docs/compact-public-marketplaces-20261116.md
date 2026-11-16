# Compact public marketplaces — 16 November 2026

Scope: public Jobs, Wenze, Restaurants & Malewa, Services, Apartments, Hotels and Transport. No management modules, backend contracts, monetary calculations, authentication permissions or production data changed. This batch is local only; do not push or deploy it without a subsequent instruction.

## Confirmed causes and changes

- Jobs had a high-specificity mobile rule turning the search wrapper into a vertical flex column inside the shared two-column form. Removed that conflicting rule. Wenze had a separate higher-specificity two-column form rule with an automatic second column; restricted it to desktop.
- Shared mobile forms now place the query across the available width, with a native submit button integrated on its right. City and the filter disclosure align beneath it. Opening filters keeps the disclosure as a full-width grid item, avoiding the browser's native `details` content wrapper squeezing fields into a column. Native GET submission, query parameters and location semantics remain intact.
- Consolidated collection spacing, normal-weight Lingala slogans, sans-serif controls/card titles, restrained headings, useful image dimensions and adaptive product columns. Existing slogans are unchanged. Titles wrap, including uninterrupted strings.
- Jobs categories remain available in the filter panel; desktop category browsing remains. Offer-type tabs and result counts use the existing server-backed filtering. Supported save links enter the canonical authenticated offer-save flow, with the specific offer preserved; the list does not assume a save succeeded.
- Wenze retains all category families, product attributes, pricing modes, cart/negotiation actions and shop routes. Its full category selection opens below a compact strip.
- Compact collection header keeps cart, notifications, language and account access. The selected market is revealed by scrolling only the horizontal market strip. Bottom navigation retains its permission-dependent destinations and keyboard handling, with a pale-green active state.
- Secondary creation invitations are compact on mobile. Empty collections have an explicit localized empty message. Hotels keep the complete availability caveat in a disclosure with a concise visible warning to confirm availability. Transport keeps its existing prepared-message destination and the visible instruction that opening WhatsApp does not submit a request; instructions start collapsed.

## Validation

Focused checks, using existing dependencies and isolated synthetic fixtures:

- TypeScript: `tsc --noEmit --incremental false`.
- ESLint on changed TypeScript/TSX files, including browser checks.
- 140 passing focused Vitest checks across Jobs, marketplace components/pages, discovery, Services and Restaurants.
- 14 passing Chrome touch browser scenarios in `tests/browser/compact-marketplaces.browser.ts`, followed by eight passing affected-scenario rechecks after the final disclosure correction: 320, 375, 390, 430, 768 and 1440 CSS-pixel widths; all seven markets; full-width search; non-overlapping, aligned location/filter controls; selected market visibility; complete initial Jobs card/Wenze row at 390 × 844; all four locales at enlarged text; 200% text and uninterrupted titles; simulated reduced keyboard viewport and bottom-content reachability.
- Interaction coverage includes search/Enter submission, advanced filters, canonical category selection, all Jobs offer-type tabs and counts, refresh/back, guest offer/save access, Wenze Products/Boutiques switching, product navigation/back, empty/error recovery, other market searches, and the Transport prepared-message URL and disclosure.
- No backend suite or live WhatsApp messages were used.

Screenshots and machine-readable unit results are retained outside Git at `C:/NIHILOBA/release-evidence/compact-markets-20261116/`. The `*-390.png` images are 390 × 844 viewport captures; other widths are also retained. Jobs/Wenze baseline captures are `before-emplois.png` and `before-wenze.png`.

## Limits and retained resources

- Chrome desktop touch emulation is not physical iPhone Safari verification. Real keyboard animation, browser toolbar movement and device safe-area behavior remain unverified; the reduced visual viewport check is simulated.
- Synthetic products include missing-photo fallbacks and several category families. The Restaurant fixture exposes its existing partial dish-load failure, which is shown truthfully; no live listing completeness or live authentication/WhatsApp transaction is claimed.
- No fresh production build was run: C: had less than 1 GB free. Type checking, linting, targeted unit tests and browser compilation/rendering were used without creating another large build or installing dependencies.
- Reused the sanitized local server folder `C:/Users/mabal/AppData/Local/Temp/shida-web-mobile-website-tqoj0z0o`, with a junction to shared dependencies. Keep its `node_modules` target and all unfinished work. Disposable browser outputs use the prefix `shida-compact-markets-run-` under the user's Temp directory. The development server was started by the user after automatic approval review blocked agent server startup; it remains available for review.
- Automatic approval review rejected removal of the five disposable `shida-compact-markets-run-a` through `shida-compact-markets-run-e` directories with “blocked by policy”. No deletion succeeded. These exact directories may be removed manually; acceptance screenshots and reports are retained in the evidence folder above. The final `-f` and `-g` browser-output directories are also disposable after review. Do not delete the running server folder or shared dependency target.

No migration or deployment configuration change is needed. Deployment has not been performed.
