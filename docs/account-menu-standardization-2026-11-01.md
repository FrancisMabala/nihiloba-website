# Shared account menu and management header — 1 November 2026

## Audit and implementation
The website already shared MarketplaceControls between public pages and the WenzeHeader used by Personal Wenze, Services and Restaurants. Its enhanced public style was opt-in and depended on authentication CSS. Business had an older copy. All website callers now use the canonical menu. Business mirrors the same component, icon and CSS contract without a new package dependency. Keep those three files aligned when changing the contract.

Identity comes from the existing session display name; these contracts do not supply a permitted profile photograph, so initials remain the fallback. Personal/organization labels and close controls are translated in EN/FR/LN/SW. Business uses its selected context type, preserves scoped Messages and offers Change account when multiple authorized contexts exist. Personal Change account retains existing sign-out/reauthentication. No new switching or authorization mechanism.

The entire seller-space-return row and its CSS were removed from WenzeHeader. Children, page toolbars, shop selectors, sidebars and deeper Back links remain. Business contextual organization toolbar is retained. Public marketplace links/cart remain public-only.

Menu contract: 310px cream dropdown, viewport bounds, 44px close control, semantic links, logout/users/settings/message/briefcase icons, Tab/Enter/Space, arrow navigation, Escape and close restore focus, outside click and focus departure close without trapping focus. Authentication forms remain separate. No backend, migration, payment, notification or urgent WhatsApp changes.

## Validation
Production builds and TypeScript passed in both frontends with Next 16.4.3 and Node 22.22.0. Focused ESLint and diff checks passed. Website: 76 browser tests (11 routes at 360/390/768/1024/1440 plus 21 authentication tests covering WhatsApp round trips in four languages and controlled passkey behavior). Business: 5 responsive browser tests and 18 component/session/shell tests, including personal-only, multiple organizations, revoked membership omission, authorization/session failures, guarded navigation and existing logout. Updated a stale navigation mock and scoped organization assertions to the selector.

Screenshots: playwright.account-menu.config.ts produces test-results/header-evidence. Review gallery is in task outputs/header-standardization/index.html. Reviewed desktop/mobile public, My Space, Wenze, Services, Restaurants and Business menus. Browser data is isolated; no production records changed. These tests do not constitute a new security audit of unchanged backend authorization.

## Release and rollback
Previous My Transactions release de512ec0da29740297791e673512bec3beb33ccc verified Live in Render on 1 November 2026. Header release explicitly authorized. Verify each frontend exact source SHA and Live state. No backend rollout/migration required. Rollback targets: website de512ec0da29740297791e673512bec3beb33ccc; Business 00594b9. No data rollback needed.
