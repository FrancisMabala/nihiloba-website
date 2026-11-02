# Combined Restaurant & Malewa discovery performance

Keep the approved combined homepage. Establishments are fetched once (six per
page); dishes use the independent backend `/api/public/shida/restaurant-dishes`
endpoint (six per page), with `dish_page` separate from establishment `page`.
No full-menu requests are made for previews. Both requests start together and
the dish section streams through Suspense, so slow/failed dishes do not delay
the establishment cards. Errors remain scoped to their existing sections.

Explore dishes continues browsing across matching establishments. Establishment
cards open that establishment's restaurant page; menu and dish-selection links
retain their full-menu destinations and filter-return context. No basket,
plate-composition, checkout or ordering code is changed.

Publication and media revocation remain backend-authoritative with no-store
requests. Parent/item references are checked before rendering. Existing lazy
image delivery and missing-image placeholders remain; no private image caching
is introduced. Selection wording in EN/FR/LN/SW now accurately describes matching
establishments rather than only establishments on the current list page.

Deploy the additive backend endpoint first. Validation includes a delayed-dish
streaming regression, one-establishment-request assertion, filtering and parent
integrity tests, the Restaurant regression suite, typecheck, lint and production
build. Measure public list/dish/menu and HTML arrival before/after; health alone
does not establish recovery or deployment identity. Streaming HTML measurements
exclude browser paint and image downloads.
