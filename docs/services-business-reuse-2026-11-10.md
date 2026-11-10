# Services UI reuse by SHIDA Business

Personal Services remains the source for the shared Today, work-summary, report, template, invoice-presentation, publication and icon/model/copy UI. Business keeps its own Organization shell and protected API adapter. The Business repository documents the full page-by-page matrix in `docs/services-alignment-2026-11-10.md` and synchronizes 19 named files using `scripts/sync-services-ui.mjs --source=/path/to/nihiloba-website [--check]`.

This avoids introducing a cross-repository runtime dependency or an unrelated package release system. When changing a mirrored component, run the Business sync check and both relevant regression suites. Host-specific API paths, team permissions, publication confirmation and financial context notes are not shared by copying the Personal shell.

The Personal changes are deliberately small: extract the existing pure Services icon; allow Today to receive a calendar loader; allow reports to receive a money destination/context note; isolate report state by context/session/financial access; limit template selection to authorized kinds; bound report and invoice-presentation network waits. Personal defaults, ownership, navigation, existing writes and accounting semantics remain intact.

`playwright.services-alignment.config.ts` runs the established Today, reports, templates/settings and customer statement browser suites against a production build. Production mode preserves the existing Content Security Policy (development webpack scripts are blocked by that policy). The legacy fixtures now include the existing onboarding read and normalize trailing slashes; neither is a production authorization change.

No backend change, migration, new role or new accounting engine is included. Existing public/private publication, frozen bill versions, provider-declared payment wording, retry/idempotency and FR/EN/LN/SW behavior remain subject to their existing contracts. WhatsApp links keep their existing language and protected web destinations; no live message delivery is exercised by these fixture tests.
