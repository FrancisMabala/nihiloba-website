# Performance follow-up evidence

- `before-final/`: matching baseline against the previously released production build, including enabled Settings controls and actionable Restaurant-section timing.
- `after/`: the same fixtures and throttling against this local batch's production build.
- `comparison.json`: medians of three samples for each profile/journey/visit.
- `regional.json`: bounded public direct/gateway probes; the initial 308 probes are kept separately and excluded from successful timing comparisons.
- `before/`: exploratory baseline before the Settings control/Restaurant section instrumentation was finalized. Retained for traceability, **not used for the before/after comparison**.

All browser API data is synthetic. Request URLs, timing and byte counts contain no authentication headers, codes, cookies or production customer data. See `../../waiting-performance-phase2-20261118.md` for methods, limitations and release status.
