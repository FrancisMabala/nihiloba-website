# Account read origin and avatar menu correction

The deployed account screen still returned unavailable for authenticated users. Backend logs showed security/navigation requests rejected with 403 while session and notification requests succeeded. A regression reproduced an additional gateway defect: a production Request URL using localhost:10000 was mistaken for a development origin. Same-origin browser GETs omit Origin, so the gateway forwarded its internal HTTP origin, which the backend correctly rejects.

Production now always uses the fixed canonical HTTPS origin for explicitly allowed same-origin private reads. Loopback exceptions remain development/test-only. Missing-origin mutations, cross-site requests, hostile origins and missing/stale browser bindings remain rejected. No trust is taken from forwarded headers. Profile, overview, phone, recovery and navigation gateway regressions cover production loopback requests.

Removed the visible account name from the avatar dropdown as requested; initials and the accessible button label retain account identification. The existing account-space browser scenarios assert the dropdown no longer displays the name.

Validation: 80 focused origin, security gateway, login and browser-session unit tests; targeted ESLint; production build/TypeScript; focused account-space browser checks. Production authenticated read verification follows deployment; no production profile mutation is required. No backend, schema, environment, credential, WhatsApp template or collector change.
