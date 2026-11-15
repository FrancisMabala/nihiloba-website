# Wenze mobile expense controls

The expense ledger now uses compact accessible rows. Amounts stay paired with their currency; private notes, audit references and cancellation controls live in a modal detail view. Closing or using Back restores the list and opening control. The native dialog also cycles keyboard focus and scrolls independently in a reduced viewport.

Finance periods and timezone controls are in a disclosure with the current scope visible when closed. CSV remains available under secondary actions. Mobile finance navigation uses a selector containing the existing sections; desktop tabs remain. Totals still come from the existing server summaries, separately by currency.

Cancellation uses the existing reversal endpoint and idempotency handling. Its review explains that the original entry/history remain, the original period is restated, and neither payment refunds nor stock changes occur. Reason values and the optional note remain unchanged (500-character backend limit). Successful cancellation updates the returned original entry in the loaded pages, then refreshes the server total; it does not reset pagination. Permission failures retain the existing data-clearing behavior. Notes are displayed only from the existing finance-authorized API response.

The compatible presentation is mirrored in SHIDA Business's existing Wenze component. Website keeps its existing Kinshasa/Lubumbashi selection; Business keeps its existing UTC report interpretation and explicit refresh. No backend, accounting, API contract, WhatsApp routing or migration changes are required. Other management modules use different finance components and were not changed.

## Focused validation

- Production build and TypeScript, changed-file ESLint, `git diff --check`.
- `tests/wenze-money.test.tsx` and `tests/wenze-personal-gateway.test.ts`: 22 tests.
- `playwright.expenses.config.ts`: 31 expense cases, plus existing expense creation/export and report-pagination regressions. Synthetic local API responses only.
- Four languages (FR/EN/LN/SW), 320/375/390/430/820/1440 CSS pixels, empty/single/long lists, long labels/notes/amounts, CDF/USD, reversed entries, read-only access and rejection, reason/note review, later-page cancellation, correction editor, Back/Escape, focus return/cycling, scroll preservation, separate totals, period/timezone/export, pagination and section navigation.
- A reduced-height viewport checks accessible controls while editing. It does not reproduce a physical phone's keyboard or dynamic browser chrome. No real financial records were modified; the full backend suite was not run.

Screenshots and build/browser reports: `C:/NIHILOBA/release-evidence/wenze-expenses-20261115`. Reused sanitized build roots and shared dependencies; no new worktree or dependency installation.
