# SHIDA public marketplace browsing

The NIHILOBA website is the public visual browsing layer for SHIDA Jobs, Services, Wenze, Apartments and Hotels. The SHIDA backend remains the source of truth for listings, availability and WhatsApp actions. The website does not access the SHIDA database, validate entry tokens or reproduce backend workflows.

## Runtime and configuration

The marketplace pages require the Next.js Node runtime. Set:

```text
SHIDA_API_BASE_URL=https://api.nihiloba.com
```

Only an HTTPS origin is accepted. Production falls back to the same official origin if the variable is absent. Public collection responses are revalidated every 60 seconds. Detail responses use `no-store` so availability and backend-issued action URLs remain current.

## Public API contract

The website consumes only:

- `GET /api/public/shida/jobs`
- `GET /api/public/shida/jobs/{ref_or_slug}`
- `GET /api/public/shida/jobs/employers/{ref_or_slug}`
- `GET /api/public/shida/apartments`
- `GET /api/public/shida/apartments/{slug}`
- `GET /api/public/shida/hotels`
- `GET /api/public/shida/hotels/{slug}`
- `GET /api/public/shida/services`
- `GET /api/public/shida/services/{ref_or_slug}`
- `GET /api/public/shida/services/{ref_or_slug}/availability`
- `GET /api/public/shida/services/{ref_or_slug}/reviews`
- `GET /api/public/shida/services/providers/{ref_or_slug}`
- `GET /api/public/shida/wenze/stores`
- `GET /api/public/shida/wenze/stores/{ref_or_slug}`
- `GET /api/public/shida/wenze/products/{ref_or_slug}`

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

## End-to-end handoff check

Automated tests verify that backend action URLs are preserved exactly, unsafe schemes are suppressed and public response parsing discards unknown fields. The production server smoke test covers the English apartment and French hotel collection routes. Final QR scanning, WhatsApp application opening and restoration of conversation context require a real mobile device and should be completed for one active apartment and hotel before announcing those QR journeys publicly.

## Services marketplace presentation status

Status: implemented for the focused public Services polish batch. Jobs, Apartments, Hotels and Wenze were not visually redesigned. The SHIDA landing-page marketplace links now share one neutral cream, dark-green-border treatment; the former Jobs briefcase emoji and permanently selected-looking Jobs/Apartments states were removed.

Service results use a compact two-column desktop grid and a thumbnail-left mobile list. The card hierarchy is category, title, provider identity, broad public location, starting price, duration, rating and a compact localized detail action. Descriptions are limited to one line on wider screens and omitted from phone cards so several results remain scannable. Cards never render phone numbers or unknown API fields.

The result image fallback order is:

1. Allowlisted service preview image.
2. Allowlisted provider profile image.
3. A lightweight text-based category treatment with no downloaded placeholder asset.

Provider avatars are always allocated a small circular identity position. A valid backend `provider.profile_image` is rendered; otherwise the provider's initial is used. The previous detail-page avatar problem was a component omission, not a missing public API field: service detail data already contained `provider.profile_image`, but the header rendered only provider text.

Low-data choices include server-rendered results, compact responsive `next/image` sizes, Next.js image optimization, default lazy loading for cards and gallery thumbnails, only four initial service thumbnails while previous/next controls retain access to the full gallery, no detail-gallery preload, no gallery at all when a service has no media, no animation dependency, and concurrent loading of availability, reviews and provider discovery after the primary detail record. Collection caching and detail freshness rules remain unchanged.

The service detail header is now compact and includes breadcrumb, category, title and provider identity. Existing accessible portfolio navigation/lightbox behavior is retained, but the visible gallery is capped below the apartment-style dimensions and secondary images remain lazy. Structured facts and description precede the booking panel on phones; packages, availability and backend-issued booking links are otherwise unchanged. Reviews remain anonymized and public-address visibility rules are preserved.

The detail page uses the existing public provider endpoint to show up to three other public services, excluding the current service. A localized link to the existing provider page appears only when more results exist. If the provider request fails, service viewing and booking continue without this secondary section.

`ServicesAdSlot` is the integration boundary for future approved advertising. It is positioned after the fourth result when creative content is supplied, labels content as sponsored, and returns `null` when empty; therefore no fake ad or blank reserved banner is present today. There is no advertising backend integration in this batch.

Relevant implementation files are `app/components/shida/services.tsx`, `app/components/shida/services-ad-slot.tsx`, `app/components/shida/marketplace.tsx`, `app/components/shida/marketplace-copy.ts`, and `app/globals.css`. Regression coverage lives in `tests/services-marketplace.test.tsx` and `tests/shida-page.test.tsx`.

Remaining dependency: real advertising requires an approved creative/provider contract and content source. Final physical-device verification of representative production media and WhatsApp handoff remains a release check; the frontend does not fabricate those external conditions.
