# Services onboarding — development release evidence

The three-step wizard creates a private service draft: professional identity, first/additional service, explicit review and confirmation. Existing providers reuse their shared identity and enter the service step. A nullable legacy primary category is supported. Identity changes are made only through the explicit Professional Profile editor.

The wizard exposes remaining capacity (including active private listings), retained progress recovery and completed-result management. Revision conflicts preserve local answers for review. Uncertain confirmation retries reuse exactly the same intent and revision. Shared backend progress handles Web/WhatsApp resumption; the website does not create another service engine. Existing appointment, quotation, package, privacy and publication behavior is unchanged.

The approved three-profession visual is represented by a generated decorative illustration, with canonical category options, responsive steps and EN/FR/LN/SW copy. No fictional provider listing is added.

## Validation

- Production webpack build and TypeScript check passed.
- Focused ESLint passed for changed components, copy and browser tests.
- 27 unit tests passed: management gateway, Services work model and account navigation.
- 12 browser tests passed: four languages at 1440/390/768/360 px, explicit private confirmation, exact retry payload, existing NULL-category identity, shared identity editing, five-listing management legacy identity response and resumed answers after identity creation. Test fixtures intercept APIs and never create production records.
- Inspected desktop/mobile screenshots; tests check page overflow. Evidence remains in `test-results/services-onboarding` and `test-results/services-professional`.
- Replaced obsolete old-form browser scenarios with the new wizard tests; retained their identity reuse, explicit name choice and retry coverage.

An accidental broader unit selection ran 839 tests: 834 passed and five failed in the unchanged `tests/phase2-discovery.test.tsx`. Those older assertions expect discovery pages without promotional illustrations/old CSS classes, whereas the base branch already contains the approved illustrated marketplace redesign. No discovery production code or those tests were changed in this batch. The focused configuration now explicitly selects the three relevant suites.

## Release boundary

Not deployed and not pushed to main: the latest user approval is development/test only. Backend migration 0216 must be separately approved and deployed with the backend **before** this website. Backend schema, concurrency, retention and rollback evidence is in the matching backend report `docs/services_onboarding_validation_2026_11_03.md`.

Before release, recheck CI and the exact approved commits; after backend readiness deploy this website and verify its live commit and authenticated journey. Browser automation used Chrome, not physical iOS/Safari. Pre-release unlinked WhatsApp sessions retain their old lifecycle and are not migrated into web progress. Urgent templates remain unchanged.
