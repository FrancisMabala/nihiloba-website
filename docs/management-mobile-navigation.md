# Marketplace management on mobile — November 2026

The existing personal Wenze, Services and Restaurants workspaces share a responsive bottom-navigation component below 1024px. Public marketplace navigation is unchanged. No apartment, hotel or transport management area is created.

Mappings:
- Wenze: Aujourd’hui, Commandes, Produits, Finances, Boutique. Counter sales stay in the Today secondary navigation; stock/imports stay under Products; existing money subpages remain under Finances. Unavailable online orders are not exposed.
- Services: Today, Requests/work, Calendar, Finances and More, filtered by the existing capability response. Services/pricing, opportunities, counter and activity remain in More when permitted. Finance templates/documents and proposals retain their existing nested selections.
- Restaurants: Today, Orders, Menu, Finances (or the existing invoice destination when POS is unavailable), More. Sales, stock, reservations, statistics, reviews and establishment management remain accessible. Menu and establishment subpages retain their existing secondary tabs.

Desktop sidebars remain. Mobile identity rows, secondary fullscreen controls and language/account controls use the existing visual system. The native More dialog supports Escape, focus return and background scroll locking. Measured bottom padding and offsets protect checkout controls and final actions; safe-area insets and focused-input visual-viewport changes are handled. Navigation invokes the existing callbacks and unsaved-form guards.

Validation: focused unit checks, TypeScript, changed-component ESLint and production build. Synthetic browser fixtures cover all four languages at 320/375/390/430/820/1440px, primary destinations, More, nested selection, long names, permission filtering and a cancelled unsaved product edit. Keyboard viewport reduction and text enlargement are simulated; real iPhone/Android browser-toolbar and keyboard behavior is not claimed as verified.

Run `playwright test --config playwright.management-mobile.config.ts` with an isolated production server on port 3013. Optional SHIDA_MOBILE_EVIDENCE_DIR, SHIDA_MOBILE_OUTPUT_DIR and SHIDA_MOBILE_REPORT choose retained evidence paths. Fixtures do not change real customer accounts or financial data.
