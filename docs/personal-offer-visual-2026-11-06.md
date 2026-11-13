# Personal job-offer wizard refinement

The employer wizard retains the canonical three steps, private saved progress,
revision checks, explicit publication and stable finalization retry. My Activities
is highlighted for employers; Candidate Profile remains a separate destination.

## Compatibility audit

The employment backend stores working conditions and compensation as text.
Day/time and amount/currency/period controls serialize into those existing fields.
Only this form's recognizable format is restored into structured controls;
historical or WhatsApp prose remains editable verbatim. There is no salary
conversion, schema change, new publication engine or WhatsApp state machine.
Salary, experience and start date remain optional. The backend text limit is
4,000 characters, preserved instead of the illustrative 1,000 in the mockup.

The existing registration-reference endpoint supplies Kinshasa communes. The
quartier dictionary is currently empty and there is no complete canonical city
catalog. Commune suggestions use that endpoint; unsupported cities and missing
quartiers retain manual entry. Changing a parent location clears its children.
This is an explicit limitation, not a fabricated geographic catalog. Existing
free-text backend eligibility is unchanged.

The canonical progress response has no saved step field. Resume starts at the
first step with saved values; step navigation restores recognizable schedules.
Capacity is read from the backend, not derived from mockup counts.

## Validation

- Five Vitest adapter tests: compensation units, legacy prose, incomplete amounts,
  fixed/flexible/overnight schedules, cross-language schedule restoration.
- Seven isolated Playwright tests: EN/FR/LN/SW at 360, 390, 768, 1024 and 1440;
  explicit publication, identical retry after failure, dependent locations,
  optional salary, restored schedules, fresh operation key after cancellation.
- ESLint on affected components; production webpack build including TypeScript.
- Desktop and mobile rendered screenshots inspected. All records are synthetic.

No real offers were published during validation. Backend/WhatsApp runtime tests
were not rerun for this frontend-only change; canonical routes and operations
are unchanged. No migration or production configuration change is required.

## Release isolation

Deploy the exact release-branch commit based on the previously live website.
Do not deploy unrelated account-deletion commits on main before their documented
backend/migration prerequisites. The same task change is also preserved on main.

## Individual announcement management

The employer opens a listing by its public reference. The applications tab and candidate discovery both use the existing offer-scoped reads. Editing submits the listing version to the same management endpoint. Review, public detail and management use the same labeled conditions, including the pay period and overnight suffix. When converting an older draft, the wizard shows unresolved wording next to the relevant choice. Employers can select a suggested quartier or keep an unlisted neighbourhood.
