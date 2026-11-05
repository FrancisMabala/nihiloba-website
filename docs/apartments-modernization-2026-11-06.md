# Apartments progressive modernization

## Batch 2: factual safety information and private reporting

Apartment detail renders advertiser declarations separately from unrecorded
identity, property-evidence and independent checks. No property-verification
badge is invented. Reports reuse the Personal session/login provider and existing
support proxy. The bounded form reports actual persistence, errors and rate
limits, and unmounts on account change. No direct advertiser phone is exposed.
LN/SW detail and owner routes now preserve their supported locale.

Validation: 35 focused component/page/gateway tests; changed-file lint and full
TypeScript check; production Webpack build; 8 browser cases covering desktop and
mobile in FR/EN/LN/SW. The first browser run caught the old LN/SW route fallback;
all eight pass after correction. French desktop/mobile screenshots were inspected.
These are the safety-stage baseline, before the Batch 4 property redesign.
Browser records and report writes are isolated fixtures, never production data.

The default Turbopack build cannot resolve this checkout's shared dependency
junction outside its root. `next build --webpack`, documented by the installed
Next version, succeeds with the existing identical-lockfile dependency install.
No packages were installed. Backend migration 0221 is proposed, not deployed.
No push or production release is authorized by this task.
