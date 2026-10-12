# Restaurant mobile pages and optional photos

Local implementation, 12 October 2026. No deployment, commit, push, production
write or intake change. Services marketplace source and shared marketplace image
rules were left intact. The only shared configuration change permits image blobs
for local/protected previews and the exact Backend public Restaurant photo path.

## Customer and seller changes

Listing cards and profile headers prefer `establishment_photo`, then existing
seller-provided establishment images. A logo is not used as an establishment
photo. Missing or failed photos show the existing SHIDA table illustration with
an empty alternative, not a missing-photo warning or an invented restaurant photo.
The listing illustration is capped at 600 px. Phone establishment artwork stays
compact; real photos have a bounded frame.

Menus use one card per row below 768 px, two columns from 768 px, and put the
practical-information panel below the menu through 1100 px. Names, optional
descriptions, prices and actions wrap without narrow name/price columns. Prices
use exact decimal strings and narrow nonbreaking thousands separators, for example
`3 000 CDF / assiette`; this does not round through JavaScript numbers. Available
items have no redundant badge. Sold-out and temporarily unavailable states remain.
Customer cards no longer show Component or Fixed dish. Flexible amounts retain
their minimum and configured step; no fixed portions are inferred. Guest item
cards share the same photo and price presentation. Seller names, descriptions,
category names and sale units remain in their original language.

Personal now exposes **Add restaurant photo**, **Add food/drink photo** and
**Add several menu items** immediately after selecting an establishment, plus
an item-specific photo action. The third action opens the existing batch editor
and writes its existing `menu-batches` ledger. Phone batch rows become separate
single-column field groups. Photo entry is optional, and the dish editor no
longer asks for a Cloudinary URL. Existing legacy image values remain readable.

The photo editor shows the selected establishment and exact menu item (including
its reference to distinguish identical names). It loads all item-choice pages,
reads the current selected target revision, supports file selection and the
native phone file-camera option, displays a local preview, and uploads only on
an explicit action. Selection is locked during an operation. It requires a
loaded protected preview and an unchecked confirmation before attachment or
replacement. It exposes progress, same-operation retry, status recovery,
validation/stale/access/quota errors, discard and item-photo removal. Object URLs
are revoked and requests aborted on exit. Private drafts are not persisted.

## Exact Backend contract consumed

Source: `C:\NIHILOBA\Backend\docs\restaurants_photo_contract.md`, published
2026-10-12, checked against `app/routes/restaurant_photos.py` and
`app/services/restaurant_photo_service.py`. Protected base:

`P = /api/dashboard/personal/restaurants/{establishment_ref}`

The existing website proxy remains `/api/shida/personal/restaurants/.../`. It
validates the existing Personal session binding and same-origin write policy,
forwards the Dashboard session cookie and validated Origin, rejects redirects,
and returns private/no-store responses. No provider credentials or new upload
endpoint are introduced.

| Request | Consumed fields / behavior |
| --- | --- |
| Existing profile or `GET P/menu/items/{item_ref}` | Read current `revision`; profile has read-only `establishment_photo_url`, item has `image_url`. |
| `POST P/photo-uploads` | Query: `target=establishment` or `target=item&item_ref=…`, `expected_updated_at`, `operation_key`. Body: raw JPEG/PNG/WebP bytes with exact image Content-Type. No multipart, base64, URL ingestion or caption matching. Actual streamed bytes are bounded to 5 MiB. |
| Upload/status response | Only `upload_ref`, `target`, `item_ref`, `status`, `expires_at`, `revision` are exposed. Status is `uploading`, `staged` or `attached`. Exact target is checked again in the editor. |
| `GET P/photo-uploads/{upload_ref}` | Explicit status recovery, including uncertain attachment. |
| `GET P/photo-uploads/{upload_ref}/preview` | Session-bound JPEG, bounded to 5 MiB, private/no-store. Fetched with the binding header and displayed through a temporary blob URL. |
| `POST P/photo-uploads/{upload_ref}/attach` | JSON `{target,item_ref,expected_updated_at:upload.revision,confirm:true}` only after explicit confirmation. An uncertain attachment is checked through GET before another confirmation. |
| Existing `PATCH P/menu/items/{item_ref}` | Explicitly confirmed removal sends `{expected_updated_at,operation_key,fields:{image_url:null}}`. Uses the pre-existing menu edit contract and preserves its key/revision on uncertain retry. |

Same-upload retry retains the identical file bytes, target, revision and operation
key. Stale/idempotency conflicts require reloading current details. A discarded
selection does not attach; staged uploads expire after 24 hours under Backend
maintenance. Current authorization is always Backend-owned. The Backend enforces
static images, 20 million decoded pixels, orientation correction, metadata
removal and optimized JPEG encoding at at most 1600 px.

Public `establishment_photo: {url,alt}|null` and item `image_url` accept only the
bounded production media route
`https://api.nihiloba.com/api/restaurants/photos/{upload_ref}` or existing safe
legacy image URLs. Query strings, fragments, credentials and other media paths
are rejected. Backend photos deliberately bypass Next's image optimizer/cache:
each request must retain Backend eligibility/replacement revocation checks.
Images are responsive, lazy and asynchronously decoded. Local illustrations use
WebP srcsets; legacy URLs retain Next optimization. The documented Backend media
endpoint supplies one compressed image, not width variants. A different configured
`PUBLIC_BASE_URL` needs an explicit safe-origin/CSP review before use here.

**Contract gap:** there is no documented establishment-photo removal operation;
the protected profile field is read-only. This editor permits replacement and
explains that removal is not yet available. No DELETE endpoint or writable
establishment-photo field was invented. Item-photo removal uses the existing
nullable item field. Discarding a staged upload is not a provider deletion.

## Boundaries preserved

Public menu/QR links do not grant a guest visit. The guest link says “Visit without
an account” rather than promising an order before intake is checked. Guest entry, private visit,
table authority, current intake/windows, order quote and submit continue through
their existing checks. Public web checkout appears only under the existing
`ordering_available` projection. Reservations, receipts, QR destinations,
unverified-payment wording and stock rules were not changed. No photo action
publishes a draft restaurant, enables intake or submits food orders.

## Verification and evidence

The live public SHIDA page, Restaurant listing and the displayed Restaurant
profile/menu were inspected read-only. The live menu showed unit prices such as
`3000.00 CDF`, internal component labels and the listing's missing-photo panel.
No live seller session, guest visit or upload was created.

See [validation manifest](evidence/restaurants-mobile-photos/validation.json) for
exact commands, results, source hashes and the changed-file inventory. Focused
Restaurant tests, changed-file lint, typecheck, production build, four-language
copy completeness and whitespace checks pass. Browser evidence includes:

Final results: **307 tests in 30 Restaurant files**, **37 production-build browser
checks**, and **39 existing browser regressions** passed with no retries or skips.
Build, typecheck and changed-file lint passed (zero lint warnings). Selected
rendered evidence: [phone menu](evidence/restaurants-mobile-photos/menu-fr-390.png),
[tablet menu](evidence/restaurants-mobile-photos/menu-fr-768.png),
[no-photo profile](evidence/restaurants-mobile-photos/profile-no-photo-390.png),
[photo confirmation](evidence/restaurants-mobile-photos/seller-confirm-390.png),
[batch editor](evidence/restaurants-mobile-photos/batch-fr-430.png), and
[private guest menu](evidence/restaurants-mobile-photos/guest-ln-768.png).

- 360, 390 and 430 px phones; 768 and 820 px portrait tablets; 1024 × 768 landscape.
  The public layout matrix covers EN/FR/LN/SW at every width.
- No photo, one photo, many items, sold out, temporarily unavailable, long names,
  broken/revoked images and delayed photo responses; no horizontal overflow.
- Exact item selection beyond the first seller page, raw-byte retry identity,
  preview-before-confirmation, uncertain attachment recovery, stale revision,
  invalid file, discard, removal retry, slow-upload progress and access loss.
- Existing batch editor and seller profile/menu/pricing/hours/publication/QR/
  session regressions; public language/back/filter/pagination/error flows;
  checkout quote and uncertain-submit recovery.
- Private guest menu rendering in all four languages. Local selection performs
  no order write; missing window blocks quote and authority loss clears controls.

Screenshots were rendered in Chrome and visually reviewed, including the phone
menu, tablet menu, listing, profile, photo confirmation, batch rows and guest
cards. Selected excerpts/full views are retained beside the manifest; the full
viewport matrix and read-only live baselines are in `.s3a-local/photos/`.
Synthetic image bytes exercise photo delivery and must not be interpreted as
real restaurant photographs or live provider acceptance. Production-build
screenshots remove the development overlay. Automated checks do not certify
physical-camera behavior or native-speaker wording.

## Release tracker and Organization Dashboard follow-up

Updated the existing Backend
`docs/evidence/restaurants_whatsapp_2026_10_12/release_validation_tracker.xlsx`:
Automated checks E34/J34, Issues decisions E9/H9, Sources and runs D38/E38/H38.
Seven cells only. Artifact Tool authored and rendered the edits; package checks
verified that all other values, formulas, styles and native workbook parts were
preserved. Blocked/Open release states remain unchanged. The OneDrive original
was not edited.

Organization Dashboard still needs the same explicit staged-photo UI at
`https://business.nihiloba.com/businesses/{business_ref}/restaurants`, consuming
`/api/dashboard/businesses/{business_ref}/restaurants/{establishment_ref}` under
current Owner/Admin authority. It must preserve its existing menu ledger and
revocation behavior. That repository was not edited.

Remaining acceptance: documented establishment-photo removal; real-phone
file/camera behavior and orientation; live authenticated storage, attachment,
replacement/revocation and cleanup; normal Personal/Organization sign-in; Meta
handoff/fallback; native FR/EN/LN/SW review. Rollout remains migration 0151,
Backend routes/maintenance, then consumers, with existing intake gates unchanged.

## Changed source and tests

- `app/components/shida/restaurant-discovery.tsx`, `restaurant-discovery.css`,
  `restaurants.tsx`, `restaurant-detail.css`: listing/profile/menu presentation.
- `restaurant-photo.tsx`, `restaurant-menu-price.tsx`: shared Restaurant-only
  photo fallback and exact customer price rendering.
- `restaurant-menu-choice.tsx`, `restaurant-guest.css`: guest card presentation.
- `app/lib/restaurant-guest-copy.ts`: neutral guest-visit heading in all four languages.
- `restaurant-seller-workspace.tsx`, `restaurant-seller.css`,
  `restaurant-menu-batch.tsx`, `restaurant-photo-editor.tsx`: Personal controls,
  existing batch editor and protected photo flow.
- `app/lib/restaurant-photo-public.ts`, `restaurant-photo-copy.ts`,
  `restaurant-photo-contract.ts`, `restaurant-photo-browser.ts`: bounded media,
  four-language copy, contract validation and transport.
- `app/lib/restaurant-seller-contract.ts`,
  `app/api/shida/personal/restaurants/[[...path]]/route.ts`: narrow proxy extension.
- `app/services/shida/restaurants-client.ts`, `next.config.ts`: public DTO/CSP.
- `tests/restaurant-photos.test.tsx`, `tests/restaurants-marketplace.test.tsx`,
  `tests/browser/restaurant-photos.browser.ts`,
  `restaurant-detail-design.browser.ts`, `restaurant-discovery.browser.ts`,
  `scripts/restaurants-photo-fixture-fetch.mjs`: contract, presentation and flow
  checks. Historical price/hero expectations now match the requested design;
  visible locators avoid transient hidden streaming copies.
- This report, its evidence directory and the seven external tracker cells above.
