# Release tracker delta â€” 15 October 2026

Apply to the pilot, WhatsApp, and main release workbooks when the canonical OneDrive connection is available. Keep all three release statuses **Partial**; preserve existing tabs, formulas, and earlier gate history.

| Tracker area | Exact result to record | Open gate |
| --- | --- | --- |
| Pilot â€” Personal solo Reservations | Local Website workflow complete; seeded browser **16/16 pass** in FR/EN/LN/SW at 360/820/1440; isolated HTTPS Personal request/accept/decline/refresh/calendar journey **1/1 pass**. Build, typecheck, changed-file lint and diff check pass. | Authenticated staging, physical phone/tablet, human language acceptance. Source is presently â€œSHIDA site or WhatsAppâ€ because the Backend seller DTO does not store channel provenance. |
| WhatsApp â€” reservation request and seller response | Backend reservation focus **45 passed, 2 skipped**; includes four-language choices, stale offered confirmation, durable notices, replay, deferred and ambiguous delivery. No Backend or WhatsApp source changed. | Real phone, provider delivery/receipt and out-of-window behavior; verify the guest receives or can retrieve the correct accepted/declined status. |
| Main release â€” automated gates | Website calendar focus **2/2 pass**; full Website suite **730 passed, 8 failed** on the previously red duplicated SHIDA public-page copy assertions. Backend reservation focus **45 passed, 2 skipped**. | Frozen final-tree suite and staging gate remain open; do not mark the full Website suite green. |

Evidence: `docs/restaurants-reservations-2026-10-15.md`, the 3 prior FR captures copied as `before-fr-*.png`, and 12 seeded `after-<locale>-<width>.png` captures in this folder. All browser accounts and reservations were synthetic.