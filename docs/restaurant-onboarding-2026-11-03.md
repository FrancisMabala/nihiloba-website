# Restaurant creation wizard

Three localized steps introduce the establishment, confirm optional location and
timezone details, and review/explicitly finalize a private draft. Restaurant and
Malewa are primary choices; Cafe, Fast food and Catering remain available.

The protected Restaurant BFF forwards strict start/read/save/confirm requests to
the canonical backend. Saved steps resume across web and WhatsApp; unsubmitted
typing retains the unsaved-change guard. Only an opaque recovery reference is
kept in session storage. Stale or failed writes require reload before retry;
confirmation recovery reads the same record rather than creating another one.

Public address disclosure requires explicit consent, cleared when the location
changes. Optional publication details do not block private creation. Successful
confirmation opens existing management with a six-item setup checklist. Detailed
menu, ordering, hours, fulfillment and payment configuration remain there.
Organization management remains in the shared Business Dashboard.

Validation: focused Restaurant contract tests, TypeScript, lint, production build,
and isolated browser flows at 360/390/768/1024/1440 pixels, saved-state reload and
FR/LN/SW rendering. The local dependency junction requires `next build --webpack`;
default Turbopack cannot resolve the junction outside this isolated checkout.
The production configuration is unchanged. One existing-style raw SVG img lint
warning is retained for the local decorative illustration; no external image or
new dependency is required.

Release requires backend migration 0215 and backend deployment first. Do not
deploy this frontend ahead of its new endpoints. No live records or useful tests
were removed. Urgent WhatsApp templates and publication rules are unchanged.
