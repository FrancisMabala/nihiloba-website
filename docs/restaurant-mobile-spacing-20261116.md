# Restaurants marketplace mobile spacing

Scoped to `.restaurant-discovery .rd-search` inside the existing 760px mobile media query. No markup, copy, route, data, or desktop changes.

The shared chip selector added 8px vertical / 12px horizontal padding to the label surrounding an already padded 44px chip span. Its specificity overrode the existing padding reset. Combined with the closed filter summary's 8px bottom margin, grid gap, and category margins, this produced a 32px visible controls-to-chips gap and 32px visible inter-chip gaps.

The restaurant-only rules remove the redundant label padding and closed-summary bottom margin, explicitly left-align non-growing chips with an 8px gap, and give the form a 16px bottom margin. The original chip spans, icons, styles, touch targets, and horizontal scrolling remain intact.

## Focused validation

- Chrome touch emulation at 320, 375, 390, and 430 CSS pixels: 16px controls-to-chips, 8px between visible chip surfaces, 16px chips-to-results; 44px chip height; no page overflow.
- At each width: tapped all four category radios and the open-now checkbox, reached offscreen chips by scrolling, opened/closed filters, entered query/city/dish, submitted search, and verified restored values, selected category, query parameters, and the location in the results heading.
- 320px with 200% root text: all chips remained reachable and unclipped; filter inputs remained accessible; no page overflow. Existing heading/filter-label wrapping at this extreme size remains unchanged.
- Desktop 1440px: identical measured element geometry using the actual original and modified runtime stylesheets.
- `vitest run tests/restaurants-marketplace.test.tsx tests/restaurant-combined-discovery.test.tsx`: 42 tests passed.
- `git diff --check`: passed.

Evidence: `C:/NIHILOBA/release-evidence/restaurant-spacing-20261116/`, including `before-390.png` and `after-390.png` at the same 390x844 viewport, other viewport screenshots, browser scripts, and measurements.

Browser checks used the reusable local server with synthetic fixtures, including its existing partial dish-loading error state. They verify UI interactions and form submission, not live backend filtering. Physical iPhone/Safari and real browser-toolbar behavior were not tested. No backend suite or production build was run for this scoped CSS change. No push or deployment.
