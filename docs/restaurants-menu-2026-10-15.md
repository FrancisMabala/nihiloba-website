# Personal Restaurant & Malewa Menu — 15 October 2026

Status: **Local Menu implementation complete; release Partial.** No deployment, production intake change, Backend or WhatsApp source edit, commit, or push.

## Menu workflow and contract

The Personal owner Menu now loads the managed item list across pages and shows name, category, exact price and currency, availability, preparation route, explicit stock link, and active or scheduled dated offerings. The list starts with items the current public projection says are available, when that projection can be read. Search and filters show available, unavailable, and setup items. If the public projection cannot be checked, the page says so and shows the saved item setting instead. Route, stock-link, and dated-offering read failures are labeled separately. Visibility loss or offline state marks the list stale and requires refresh before item editing.

Single-item creation starts **temporarily unavailable**. The owner saves name, category, presentation and price, then the saved item opens with its separate revisioned preparation control. The owner explicitly chooses Ready to serve, Kitchen, or Bar. Bar still requires the existing non-alcoholic-drink declaration. The editor refreshes the Backend revision after saving the route before the owner changes availability; route changes wait until item details are saved. The owner can then change availability. New batch-created items also start unavailable; batch updates do not overwrite existing availability. No establishment type, name, or category decides preparation. Legacy routes remain unconfigured until an owner chooses; the route control no longer visually preselects Kitchen for them.

The focused editor keeps availability and preparation close together on phone, tablet and desktop, with links to the existing Stock, Dated offerings, and optional photo flows. Its copy explains the effect of availability on new Selling, public-menu, and WhatsApp selections, the future-order effect of routing, and the limits of stock and dated offerings. Stock bindings remain explicit; this page creates no ingredient consumption or expense.

The Website did not alter Selling, public-menu, or WhatsApp order writers. The existing Backend item and current-public-menu projections stay authoritative. The public projection applies current dated offering and stock availability. New order selection is revalidated at confirmation, and accepted orders keep their captured item details and preparation routes. CDF and USD remain exact separate prices; the Backend still rejects mixed-currency selection. Existing canonical order references, bills, payment declarations, authorization, revisions, and exact operation replay are unchanged.

## Verification

- Seeded Personal browser Menu against the local production build: **16 passed**. Twelve FR/EN/LN/SW list and editor checks at 360, 820 and 1440 px, plus create → explicit Bar route → available, sold-out selection disabled in Selling, and a public-current sold-out result overriding a managed available setting, and failed-read recovery. [Before, list, and editor captures](evidence/restaurant-personal-menu-2026-10-15) use synthetic data. The three FR before captures are copies of the prior committed management Menu evidence.
- Focused Website unit tests: **82 passed** across preparation contract, public restaurant projection, and photos. Final production build, typecheck, changed-file ESLint, and diff whitespace check passed.
- Focused real Backend contract tests on a disposable SQLite database: **28 passed**. They cover public availability and stable references, hidden/sold-out/temporarily-unavailable and mixed-currency quote rejection, WhatsApp stale selection after availability or price changes, ready-to-serve and mixed Kitchen/Bar preparation, and historical order route preservation. No Backend source was changed.

- Broader Website checks remain red on existing unrelated expectations: full Vitest **730 passed, 8 failed** on duplicated SHIDA public-page copy tests, including the ignored `.s3a-local/09b2-head-source` copy. Full ESLint reports **5 errors, 3 warnings** in existing checkout, customer-order, review, and guest-proxy files outside this Menu change. The older management browser case fails at its pre-Menu site-header assertion; this batch's dedicated Menu browser checks pass.

## Release handoff

The canonical pilot, WhatsApp, and main release workbooks are in OneDrive/SharePoint and are not writable from this workspace. [The combined Reservations and Menu tracker delta](evidence/restaurant-personal-menu-2026-10-15/tracker-update.md) is ready to apply without replacing formulas or prior history. Keep release status **Partial**. Authenticated staging against the deployed Website and Backend, real WhatsApp/provider flow, physical phone/tablet interaction, human FR/EN/LN/SW wording review, and frozen final-tree release gates remain open.
