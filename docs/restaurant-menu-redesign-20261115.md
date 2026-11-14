# Mon menu redesign

Personal and Organization management use the same compact menu, scoped search,
category/status filters and 20-item pagination. The editor keeps price modes,
portions, supplements, stock and schedule destinations. Merchant text is retained.
Photos reuse staging, processed preview and explicit attachment; opening photo
editing from a dish fixes the target to that dish. No identifier is shown in its
selection label.

New items start hidden and unavailable internally. **Save for later** leaves them
there. **Save and make available** completes item, preparation and eligibility
steps, retaining operation keys and any saved item across uncertain failures.
Restaurant publication is independent. Ready-to-serve and preparation-needed
choices map to existing `serve` and `kitchen` routes; existing `bar` is preserved.
They do not create the mockup's unsupported advance/on-demand modes. Existing
orders, public menu, WhatsApp and POS keep their established snapshots and rules.

Validation: 27 menu browser cases across FR/EN/LN/SW and 320/375/390/820/1440px,
including three lost-response stages, hidden save, validation, filters, stock
restriction, refresh failure and POS availability. Eight focused photo/bulk
browser cases cover upload retry, explicit attachment, removal, scope/session
failure and responsive forms. Nine Web photo/query contract tests and 21 Business
gateway tests passed. Backend overview/batch API: 114 tests passed in isolated
SQLite. Type checks, affected lint and production builds passed. No PostgreSQL
concurrency claim or production-data mutation was used for acceptance.

Screenshots are retained under
`C:/NIHILOBA/release-evidence/restaurant-seven-20261114/menu-*.png`.
LN/SW wording still benefits from native-speaker review. Camera selection uses
the browser's supported file/capture behavior; physical-device camera permission
behavior was not tested. Deployment is recorded separately with exact commits.
