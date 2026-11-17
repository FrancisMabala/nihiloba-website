# Restaurants order header: mobile-only adjustment — 17 November 2026

Scope: `/fr/shida/seller/restaurants/?establishment=<reference>&tab=orders` (and existing localized equivalents), rendered by `RestaurantSellerWorkspace` → `RestaurantOrderScreen`.

The title/actions header and refresh status were separate block rows. A queue-only wrapper now groups them into a wrapping mobile row at the existing 700px breakpoint. The timestamp stays left; refresh and page options stay right. The existing heading remains in the accessibility tree, visually clipped on mobile. Desktop retains the original visible heading and two-row layout. No request, timestamp, translation, order, filter, navigation, identity or menu logic changed.

Changed files:
- `app/components/shida/restaurant-order-screen.tsx`: wrapper only.
- `app/components/shida/restaurant-orders-mobile.css`: scoped responsive header layout.
- `tests/browser/restaurant-orders-mobile.browser.ts`: hidden accessible heading, row alignment, 44px controls, enlarged text and configurable screenshot destination.

Validation:
- 16 Playwright Chrome browser scenarios passed against real local Next.js pages with synthetic API responses. Viewports: 320, 375, 390, 430, 820 and 1440 CSS pixels; four locales at 200% root text size.
- Verified refresh loading/success/failure and preserved last-successful timestamp, retry, options/keyboard closing, simulated supported and unsupported Wake Lock, order detail/back/forward navigation, filters/search/counts, direct links/reload, final-card navigation clearance and no page overflow.
- Focused ESLint, TypeScript `tsc --noEmit --incremental false`, and `git diff --check` passed.
- Baseline and updated screenshots captured at the identical 390×844 viewport. Header reduction moves list content approximately 30px upward. Desktop and enlarged-text screenshots inspected.
- Browser checks used the existing reusable website runtime on loopback port 3000, existing Chrome/dependencies, a temporary Playwright config enabling development CSP bypass and Chrome local-network access, and no backend/database mutations. No installation or new Docker resources. The generic local environment check encountered a stale backend checkout path (`account-security-backend`); the independent website fixture launcher worked.

Evidence preserved in `C:/NIHILOBA/release-evidence/restaurant-orders-header-20261117/`: `before-390.png`, `after-390.png`, `after-820.png`, `after-1440.png`, `enlarged-320.png`.

Limits: Chrome touch emulation, not physical iPhone/Safari or native screen-reader verification. Wake Lock was simulated. No production build, full backend suite, push or deployment. Other attached UX batches were outside this focused request. Unrelated pre-existing database deletions were preserved and excluded from the commit.
