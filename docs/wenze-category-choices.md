# Category-guided Wenze product choices — 21 October 2026

Quick add and detailed add remain available. Detailed add and conversion of an existing
product offer category suggestions, selectable sizes/colours, custom values and generated
combinations (up to 3 dimensions / 20 choices). Other dimensions are available under
Other options. Each combination has its own stock; saved option_attributes preserve the
selected dimensions. Editing a free-text label clears stale dimension metadata.

Conversion shows the authoritative stock total and requires an exact allocation. Server
errors distinguish active customer activity, stock reservations, an open stock count,
and a stale revision. Existing sales and receipt history are retained. Reversing an older
aggregate sale after conversion needs a destination variant, so this unsupported path is
explicitly blocked before stock changes. No receipt sending or DGI functionality added.

Validation: production build with webpack (local node_modules is a junction, which
Turbopack rejects), TypeScript and focused ESLint; Playwright production-server tests at
390, 820 and 1366 pixels in EN/FR/LN/SW, plus four existing seller UX scenarios. API fixtures
are used for browser tests; backend persistence, authorization, migration, replay and
rollback are tested separately. This is viewport emulation, not physical device testing.
Screenshots are in docs/evidence/wenze-category-choices/. Live release checks are recorded
in the existing SHIDA_Wenze_Implementation_Tracker.xlsx.