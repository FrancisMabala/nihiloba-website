# SHIDA public marketplace browsing

The NIHILOBA website is the public visual browsing layer for SHIDA Apartments and Hotels. The SHIDA backend remains the source of truth for listings, availability and WhatsApp actions. The website does not access the SHIDA database, validate entry tokens or reproduce booking and visit workflows.

## Runtime and configuration

The marketplace pages require the Next.js Node runtime. Set:

```text
SHIDA_API_BASE_URL=https://api.nihiloba.com
```

Only an HTTPS origin is accepted. Production falls back to the same official origin if the variable is absent. Public collection responses are revalidated every 60 seconds. Detail responses use `no-store` so availability and backend-issued action URLs remain current.

## Public API contract

The website consumes only:

- `GET /api/public/shida/apartments`
- `GET /api/public/shida/apartments/{slug}`
- `GET /api/public/shida/hotels`
- `GET /api/public/shida/hotels/{slug}`

Responses are parsed into explicit allowlisted presentation types. Additional fields are discarded. API failures produce a branded unavailable state; a detail API 404 produces the website 404 page. Raw backend payloads and failures are never displayed or logged.

Backend-provided `visit_url` and `booking_url` values are used unchanged only when they use HTTPS and an approved official action host. Cloudinary images are accepted only from the configured NIHILOBA account and upload path.

## Public routes

- `/shida/appartements` and `/shida/appartements/{slug}`
- `/shida/hotels` and `/shida/hotels/{slug}`
- French equivalents below `/fr/shida/...`
- `/en/shida/...` remains a language-prefixed compatibility route; canonical English URLs are unprefixed.

Collections and currently published detail pages are included in the sitemap when the public API is reachable.

## Render migration

`render.yaml` now defines a Node web service, not a static service. If the existing Render service cannot change runtime type in place, create the Node service from the blueprint, validate it on its temporary hostname, then move the `nihiloba.com` custom domain to it. Security headers are applied to every route by the Next.js `headers()` configuration; the Blueprint intentionally has no unsupported Web Service `headers` section.

Wenze browsing is intentionally outside this release. Add it only after a separate public backend contract exists.

## End-to-end handoff check

Automated tests verify that backend action URLs are preserved exactly, unsafe schemes are suppressed and public response parsing discards unknown fields. The production server smoke test covers the English apartment and French hotel collection routes. Final QR scanning, WhatsApp application opening and restoration of conversation context require a real mobile device and should be completed for one active apartment and hotel before announcing those QR journeys publicly.
