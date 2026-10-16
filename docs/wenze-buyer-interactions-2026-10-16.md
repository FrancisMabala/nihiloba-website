# Wenze buyer interactions

Added boutique follows, private boutique/product favourites with a My favourites panel, and public boutique reviews. Reviews require a completed Wenze seller order for the exact signed-in buyer and boutique. Private actions reuse the shared Personal session; guests receive a sign-in panel. Account changes clear private state.

Cart product buttons now display nested stock/currency/shop-readiness errors. A stale cart response refreshes the version without replaying an add, allowing a deliberate retry to succeed.

Validation: production webpack build/TypeScript and focused ESLint passed; 22 buyer-gateway/cart unit tests and 3 Chrome buyer tests passed. Mobile overflow check passed. Screenshots: `evidence/wenze-buyer/desktop.png` and `mobile.png`. Browser-test writes are intercepted locally. A separately authorized live anonymous test added one test shirt successfully (HTTP 200); no order, checkout or WhatsApp message was created. The user's original existing-cart failure was not reproduced.

Deploy Backend before this website; it supplies the new `/api/dashboard/personal/wenze-buyer` and public Wenze review endpoints. No new environment variable, dependency or migration is required. Existing session binding and allowed-origin configuration apply. Until the new Backend is deployed, the page truthfully reports that review/private actions are unavailable.

Backend report: `docs/wenze/WENZE_PUBLIC_BUYER_INTERACTIONS.md`. Backend focused results were 92 passed with one confirmed pre-existing Services relationship failure. A full-suite attempt stopped after 202 passes on a relative migration-fixture path unavailable from the isolated runner. Neither is a clean full-suite result.

Production deployment was not performed during implementation validation. Subsequent Git pushes require explicit user authorization.

Suggested commit: `feat(wenze): add buyer favourites, boutique follows and verified reviews; improve cart recovery`
