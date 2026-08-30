# SHIDA versioned public legal documents

Status: Version 1.0 is published as a **working draft pending legal review**. Nothing in this implementation should be described as lawyer-approved or ready for final commercial reliance.

## Content and metadata

Immutable source copy lives under:

```text
content/legal/shida/
  terms/1.0/{en,fr}.md
  privacy/1.0/{en,fr}.md
  business-terms/1.0/{en,fr}.md
```

`app/lib/shida-legal.ts` is the central registry. Each locale/version entry records the backend document ID, version, language, title, draft status, canonical route, permanent version route and source path. Publication, effective and last-updated dates are intentionally `null`; the UI displays a clear not-finalized placeholder instead of inventing a legal date.

The Markdown parser supports the deliberately small source vocabulary used by these documents: one title, section headings, paragraphs and unordered lists. React page components contain presentation only, not legal clauses.

## Current canonical routes

| Backend reference | English | French |
| --- | --- | --- |
| `SHIDA_TERMS_OF_USE:1.0` | `/shida/terms` | `/fr/shida/conditions` |
| `SHIDA_PRIVACY_POLICY:1.0` | `/shida/privacy` | `/fr/shida/confidentialite` |
| `SHIDA_BUSINESS_TERMS:1.0` | `/shida/business/terms` | `/fr/shida/business/conditions` |

Canonical routes resolve through the per-document current-version map. They can move to a later reviewed version without changing or deleting historical content.

## Permanent Version 1.0 routes

| Backend reference | English | French |
| --- | --- | --- |
| `SHIDA_TERMS_OF_USE:1.0` | `https://nihiloba.com/shida/terms/1.0` | `https://nihiloba.com/fr/shida/conditions/1.0` |
| `SHIDA_PRIVACY_POLICY:1.0` | `https://nihiloba.com/shida/privacy/1.0` | `https://nihiloba.com/fr/shida/confidentialite/1.0` |
| `SHIDA_BUSINESS_TERMS:1.0` | `https://nihiloba.com/shida/business/terms/1.0` | `https://nihiloba.com/fr/shida/business/conditions/1.0` |

These are the exact acceptance-version URLs. Historical pages have self-referencing canonical metadata and locale alternates.

The current backend `LegalDocument.public_route` model accepts only one route, not a locale map. Until that schema supports locale-specific routes, use the English permanent URL as its single default `public_route`. The French permanent URLs above should be used whenever the backend/channel can choose a URL by acceptance language. Extending that backend mapping is outside this website task.

## Publishing a new version

1. Do not edit an existing version directory.
2. Add complete reviewed source files under a new version directory for each available locale.
3. Add one registry entry per locale with the new permanent route and dates supplied by legal counsel.
4. Change only the relevant entry in `shidaLegalCurrentVersions` when the version becomes current.
5. Add the new permanent routes to the sitemap and route `generateStaticParams` functions.
6. Update backend acceptance configuration only after confirming that the immutable public URLs return the exact approved copy.
7. Retain all former directories, registry entries, routes and tests.

## Languages and future LN/SW support

Only English and French source documents exist. `shidaLegalLocaleFallback()` deliberately maps both `ln` and `sw` to French, matching the backend’s French-default behavior. The rendered document always declares and displays its actual source language; French copy is never labeled Lingala or Swahili.

To add Lingala or Swahili, add complete lawyer-reviewed `ln.md` or `sw.md` files, extend the source-locale type and registry, add localized routes, and update the fallback only after those documents exist. Do not translate clauses implicitly at render time.

## Remaining launch TODOs

- Obtain legal review and approval for all six source documents.
- Supply publication, effective and last-updated dates.
- Finalize governing law, competent courts, dispute resolution and liability clauses.
- Confirm NIHILOBA’s legal company identity, establishment address and required registration information.
- Confirm whether official contact aliases must be written directly into the approved clauses; the supplied drafts currently refer generically to official SHIDA contact methods.
- Extend the backend registry if locale-specific `public_route` values are required.
