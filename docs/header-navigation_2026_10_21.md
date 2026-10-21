# Shared marketplace header navigation

The website header now has two account controls: a NIHILOBA-green language pill and an account menu. Mon espace and the contextual Mon espace vendeur destination live inside that menu. Menu rows have green hover and keyboard-focus states without decorative arrows. A visible NIHILOBA link above SHIDA returns to the localized main website. The duplicate Wenze landing-page seller link is removed.

Shared personal seller headers use the same pattern. Existing Services customer/provider destinations, WhatsApp authentication, account switching, sign-out, authorization and unsaved-work guards are preserved. This is a website-only presentation/navigation change with no database migration, backend or dependency changes.

Validation: production build and TypeScript, changed-file ESLint, diff whitespace checks, and 14 browser scenarios passed (320, 390, 820 and 1366 pixel header coverage plus Services account navigation in FR/EN/LN/SW). Targeted unit suites had 34 passes and three existing store-layout failures; the same three failures were reproduced with the baseline Wenze source. Browser screenshots are in docs/evidence/header-navigation.

Release: implementation f06ac6d, integrated release 126cd2468c47c00f32a0449739aa272717b98bd4 pushed and verified against remote main. Render reported Deploy succeeded | Live for that exact release. Live Wenze verification confirmed the account destinations, green focus highlight and NIHILOBA home link; see live-account.png. GitHub Actions status was unavailable through the local CLI (gh is not installed).
