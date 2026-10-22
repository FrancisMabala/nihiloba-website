# Initial web-registration release — 22 October 2026

## Owner decisions and evidence

The owner expressly requested web registration activation after supplying the legal identity **Francis Mabala Lemoya**, public service address **Hallonbergsvägen 2A, 17453 Sundbyberg, Sweden**, and **contact@nihiloba.com**. The owner is not yet registered as a Swedish sole trader; NIHILOBA is a project/brand, not an incorporated AB. No registration number is invented.

The approved initial scope is adults 18+, DRC activities, Personal and Business, no SHIDA platform charges and no student records. No additional administrator was reported. The owner confirms accepting data-processing agreements for Render, Cloudinary, Google email, AWS and WhatsApp/Meta. This is owner attestation, not an independent contract audit. Public MX records point to Google. Current Render inventory confirms website Oregon, backend/Business/database Frankfurt. The backup job last succeeded on 22 October at 02:15 UTC; its pinned runner is `2dbe9f7`. The repository backup runbook documents encrypted AWS storage in Frankfurt and 14/56/93-day lifecycle tiers, seven-day Render PITR and enabled Cloudinary backups.

The owner explicitly deferred DRC regulatory work. Neither that instruction nor this release establishes legal compliance, regulatory authorization, Meta eligibility, a registered Swedish business or an appointed DPO/representative. These obligations remain the owner's responsibility and are not marked complete. No nonexistent safeguards, fixed cross-platform deletion period or universally automatic erasure is advertised. Manual rights handling, backup reconciliation and unfinished retention controls remain material operational risks.

## Changes and boundaries

- Publish six FR/EN 1.1 documents naming the real operator and describing the initial scope. Include Business processing terms for private records processed on instructions. These are owner-authorized initial-release documents, not counsel-approved documents.
- Preserve every 1.0 source and immutable route. Backend acceptance records are not migrated, rewritten or fabricated. New required versions must be explicitly accepted; publication does not constitute acceptance. No new broad legal-enforcement flag is enabled. Existing users may encounter the canonical renewed-acceptance flow where a current acceptance is required; their old evidence remains intact.
- Add an explicit adult/DRC declaration before the web verification challenge, with gateway and backend enforcement of that declaration. This is self-declaration, not documentary age verification or proof of residence. No date of birth is collected. Existing accounts use the canonical terms-acceptance mechanism.
- Keep the prepared WhatsApp message and browser-bound code flow. No authentication template requirement, alternate identity system, permission grant, paid plan or private education feature is introduced. Organization registration does not activate modules or grant operational access beyond the existing architecture.
- Separate Privacy Policy acknowledgement wording from Terms acceptance. Use French 1.1 links in FR/LN/SW registration and identify the French source for LN/SW.

## Release order and rollback

First deploy and verify website 1.1 legal pages while registration remains disabled. Then deploy backend registry/gateway validation. Enable `WEB_REGISTRATION_ENABLED=true` and build website with `NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED=true` only after the exact legal pages are readable. Preserve default-off configuration in source. The owner has expressly authorized activation; no production database change is required by this batch. Migration 0197 was applied under earlier explicit authorization.

Rollback: disable the backend registration flag and rebuild website with its registration flag false. Preserve scope-aware session code, additive schema, 1.0/1.1 documents and historical acceptances. Do not roll back identity protections or delete drafts.

## Validation record

Backend registration, acceptance and WhatsApp checks: 42 passed; Organization onboarding checks: 24 passed. Website legal/gateway checks: 38 passed, focused ESLint and production build passed. Browser matrix: 41/42 passed initially; the mobile English WebKit completion timed out once, then passed on a focused retry and three repeated runs. All 42 scenarios have passed; the initial intermittent failure remains recorded. The first local build failed because a dependency junction pointed outside Turbopack's root; dependencies were installed directly and validation uses Node 24.19.0. No test sends real WhatsApp messages or creates production identities. Live HTTP and deployment checks do not prove an actual phone completed registration; owner phone acceptance remains a separate observable step.
