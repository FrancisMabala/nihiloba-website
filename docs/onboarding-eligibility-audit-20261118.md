# SHIDA onboarding eligibility — audit and recommendation

18 November 2026. **Audit only: no application, eligibility, legal-document,
production-data or deployment change.** The recommendations below are not adopted
rules. No real account, WhatsApp message or OTP was created or sent.

## Conclusion

**An adult living abroad is unnecessarily excluded by Business's new-account
declaration, not by the backend country validator.** Business requires the user
to attest both age 18+ and residence in DRC before verification. Website Personal
registration instead requires age 18+ and **activities in DRC**. A diaspora user
with DRC activities can truthfully meet the Website declaration, including with a
+46 number. A user whose only intended activity is outside DRC cannot truthfully
meet either current declaration.

The same `adult-drc-v1` marker represents these different statements. The backend
requires the marker but does not independently verify residence or age. Personal
country fields accept Sweden and other countries; ordinary sign-in does not
reapply the declaration. This is a combined self-attestation gate, not a technical
ban on foreign telephone numbers or foreign residence records.

Meda uses Personal accounts, including diaspora accounts. Its current code accepts
international origin/destination countries without requiring a DRC endpoint. That
is **technical acceptance**, not evidence that every international transport route
is operationally or legally supported. There is a policy/documentation mismatch:
the current Terms 1.1 §2 still limit registration to adults for activities in DRC.
Resolve that scope explicitly before removing the activity clause. No age reduction
or new legal requirement is recommended.

## Evidence baseline and source map

Code inspected at these revisions; this audit did not re-verify live deployment:

| Repository / abbreviation | Local checkout | Revision |
|---|---|---|
| Website (W), `FrancisMabala/nihiloba-website` | `C:/NIHILOBA/release-mobile-batches-20261117` | `0e89f3f1ae611bc22c4f141d850050d227ae3a66` |
| Business (B), `FrancisMabala/shida-business` | `C:/NIHILOBA/next-security-business-20261117` | `02651842e073dfbffa3a029bfcc93a8df4ffff8e` |
| Backend (API), `FrancisMabala/shida-backend` | `C:/NIHILOBA/meda-backend` | `f3248d7780f2d8659d3c1f4012fa04330e4e5774` |

File references below are relative to those repositories. Source findings are
distinguished from synthetic test results. No browser/device or live signup
verification is claimed.

| Check / entry point | Component or validator | Actual effect |
|---|---|---|
| Website `/shida/register/`, `/fr/shida/register/`, `/ln/shida/register/`, `/sw/shida/register/` | W `app/components/shida/registration-wizard.tsx`; `personal-whatsapp-login.tsx:47,143,153`; `app/lib/registration/copy.ts:22` | Required combined age/activity checkbox; challenge start returns early and button is disabled while unchecked. The same registration component serves the Website Business branch. |
| Website registration gateway | W `app/lib/personal-login-browser.ts:29`; `app/api/shida/personal/auth/whatsapp/[[...path]]/route.ts:31,77` | Sends `adult-drc-v1` only when checked; gateway rejects absent/wrong marker with 422 `eligibility_required` and forwards it upstream. Ordinary login is separate. |
| Business `/create-organization`, new Personal creator | B `components/creator-details.tsx:17`; `components/business-auth.tsx:94,176`; `lib/organization-creation-copy.ts:2`; `lib/organization-creation.ts:32` | Required **age + DRC residence** declaration blocks new-creator progression/challenge. The helper sends the same marker. Existing-account sign-in does not ask it. |
| Shared backend registration challenge | API `app/routes/registration.py:159–174` | Requires origin/CSRF, exact marker and supported locale; missing marker is 422 before verification. Registration feature flag may independently disable signup. No country/age comparison occurs here. |
| Verified identity / account creation | API `app/services/dashboard_whatsapp_auth_service.py:189,353,436` | Browser-bound challenge and code, phone matching, expiry/replay/rate controls; registration can establish an incomplete Personal identity and an onboarding-only session. No DRC phone-prefix rule. IP is used for rate limits/hash, not geolocation eligibility. |
| Personal profile country/address | API `app/services/personal_onboarding_service.py:85,125,131,211`; `app/utils/profile_location.py:14`; `app/utils/country_reference.py` | Canonical country dictionary has 249 entries. New Personal completion needs country/city and names; the current structured web flow requires a Kinshasa commune. Quartier is manual, avenue optional. Unknown-country suggestions await review; they are not immediately selectable. |
| Personal phone input | W `app/lib/registration/local-draft.ts:20`; API `app/utils/phone.py` | International formatting/length validation, no residence lookup. Website accepts a full international number; backend normalizes to digits. Verification is still required. |
| Business phone selector | B `lib/phone.ts`; `lib/creator-progress.ts`; `components/creator-details.tsx:14–15` | `country` here means **telephone dialing country**, default CD. Ten selector entries include SE/+46; selection controls phone normalization. It is not saved as the creator's residence. Limited dial options do not define supported residence countries. |
| Business organization country/address | API `app/services/organization_onboarding_service.py:168,193,882–908`; `app/services/organization_address_service.py:70`; B `components/organization-onboarding.tsx` | Address belongs to the organization, while names belong to its Personal creator. No creator/organization country equality check. New CD organization addresses require commune and quartier as well as street/building; foreign addresses use generic fields. These stricter organization rules are separate from Personal address rules. |
| Existing/incomplete account sign-in | API `app/services/dashboard_auth_service.py:119`; `personal_onboarding_service.py:85,109`; W registration wizard | Existing named accounts reuse identity; legal acceptance/security/deletion controls still apply. Incomplete accounts must finish the web profile and legal steps before normal full access. Missing residence alone on a legacy named account is not treated as foreign-user ineligibility. |
| WhatsApp onboarding handoff | API `app/services/web_onboarding_policy.py`; `personal_onboarding_whatsapp_service.py`; `organization_onboarding_whatsapp_service.py`; Personal `validate_channel` | Legacy profile/Business question handlers are wrapped with web-only handoffs. Direct Personal onboarding with `channel='whatsapp'` is rejected with 403 `onboarding_web_required`. WhatsApp verifies identity; complex profile/organization creation stays on web. |
| Meda access and journey countries | API `app/routes/meda.py:44`; `app/services/meda_service.py:33`; `app/models/meda.py`; W `app/components/shida/meda-marketplace.tsx:95` | Public explanation; actual discovery/details/photos require authenticated Personal workspace. Exact actor, protection/deletion and test-data scope apply. Listing origin/destination are canonical countries, independent of residence and phone. |
| Current published scope | W `content/legal/shida/terms/1.1/fr.md:15`, `en.md:15`; API `docs/registration-launch-20261022.md`, `docs/registration-modernization.md:290` | Terms say age 18+ / DRC activities, not DRC residence. Modernization explicitly supports foreign residence without promising international marketplace/delivery coverage. Legal acceptance is version-bound, distinct from the checkbox marker. |

### Exact current combined declarations

| Locale | Website Personal | Business new creator |
|---|---|---|
| FR | J’ai au moins 18 ans et j’utiliserai SHIDA pour des activités en RDC. | Je confirme avoir au moins 18 ans et résider en République démocratique du Congo. |
| EN | I am at least 18 and will use SHIDA for activities in the DRC. | I confirm that I am at least 18 years old and live in the Democratic Republic of the Congo. |
| LN | Nazali na mbula 18 to koleka mpe nakosalela SHIDA mpo na misala na RDC. | Nandimi ete nazali na mbula 18 to koleka mpe nafandi na République démocratique du Congo. |
| SW | Nina miaka 18 au zaidi na nitatumia SHIDA kwa shughuli nchini DRC. | Ninathibitisha kuwa nina angalau miaka 18 na ninaishi Jamhuri ya Kidemokrasia ya Kongo. |

These are single checkboxes, not independent yes/no answers. Threshold is **18
inclusive**, not strictly older than 18. No date-of-birth or documentary age check
was found in these onboarding paths. `UserAccountDB` has no age/DOB/adult-attestation
field; the marker does not establish a durable, independently verified age fact.
Do not describe WhatsApp possession or accepted terms as proof of age. Whether to
record separate version/time evidence or introduce stronger age assurance is a
separate product/privacy decision, not required to correct the residence wording.

## Concepts that must remain separate

| Concept | Current finding | Recommended contract |
|---|---|---|
| Residence | Personal `country_code` / address; ambiguous label “Pays”. Business's initial creator details collect no separate residence. | “Pays de résidence” for the human profile; explicit choice. |
| Nationality | Not requested or used by the inspected account gate. | Do not add it or derive it from residence/phone. |
| WhatsApp country code | Verification/routing; Business variable named `country` can be mistaken for residence. | “Indicatif du numéro WhatsApp”; independently editable. |
| Current physical location | No IP geolocation requirement found in these auth/onboarding validators. | Never use IP/phone as a residence decision. Keep existing rate/fraud controls. |
| Activity/transaction location | Organization address and Meda origin/destination already have separate fields. | Ask in the applicable workflow; retain actual coverage/permission rules. |
| Account eligibility | Age and activity/residence conflated in copy/marker. | Age confirmation and supported Personal registration independent of service coverage. |
| Feature eligibility | Meda Personal workspace, exact actors, lifecycle, permission and privacy checks. | Apply actual feature restrictions there; explain unavailable routes/features without denying unrelated account use. |

Personal normalization can infer a country from a known city when no country or
existing-country hint is present. An explicit country wins, including an existing
foreign country. This is a city-alias convenience, not phone/IP inference. Make
residence explicit in the UI; do not reinterpret historical inferred values as
verified residence or nationality.

## Meda scope verified

Canonical source: API `docs/business_modules/meda.md`, supported by the current
models/services (the older anonymous-discovery first-batch document is superseded).

- One existing Personal identity, no Meda-specific account and no automatic
  Organization/Business grant. Listing owner and enquiry participant are the roles.
- “J’ai de la place” / “Je cherche de la place”; luggage, airport and container
  categories. Authoring is web-only; identified WhatsApp users can discover and
  participate through the shared workflow.
- Origin/destination country/city, aware journey dates and intake deadline are
  validated independently of residence. Container-specific volume and airport
  details remain category-specific. Current currency options include SEK.
- Requests/applications require actual-object information and photos according to
  publication/application rules. Exact-participant privacy, explicit handover
  sharing, current-version warnings and mutual confirmation remain mandatory.
- No SHIDA payment processing, escrow, insurance or guaranteed transport follows
  from membership. Existing open enquiries can continue after intake closes;
  account protection/moderation still applies.

Additional handoff issue: Meda's registration link includes `returnTo` using the
current path/query. W `app/lib/registration/return-path.ts` accepts local plain
paths and narrowly defined job actions, but rejects other query-bearing returns.
The Meda landing path survives; `?view=detail&ref=...` and Mon espace Meda state
can fall back to Mon espace. This is a **source finding**, not a browser-verified
failed signup. Future tests should cover exact Meda destinations without loosening
the redirect allowlist to arbitrary URLs, secrets or authorization-bearing state.

## Diaspora scenario results

All actors below are synthetic adults for scenario purposes; tests cannot prove
age. The API tests supply the existing declaration marker rather than claiming
that the Business residence wording is truthful for a foreign resident.

| Scenario | Code / UI finding | Synthetic verification |
|---|---|---|
| Sweden, +46 | Website permits DRC-related activity declaration; Business new-creator residence statement cannot truthfully be accepted. | Full local registration HTTP flow, explicit SE/Stockholm, completion/session promotion and preserved +46 number: passed. |
| Abroad, +243 | Phone does not establish DRC residence. Same declaration mismatch. | Full local registration with +243 and SE/Stockholm: passed; existing country test also preserves SE despite phone/city hints. |
| DRC, foreign number | Both declarations can be met if 18+ / relevant activities; choose correct phone dial code independently. | Full local registration with +46 and CD/Kinshasa/Gombe: passed, residence/phone retained separately. |
| Existing diaspora account | Normal sign-in does not recheck residence declaration; legal/security gates remain. | SE account accepted by login eligibility predicate; profile city update retained SE. Existing named identity reused. No real provider sign-in tested. |
| Incomplete diaspora profile | Incomplete profile, not foreign residence, prevents full login. Resume web onboarding. | Unnamed SE account denied full-login eligibility; same draft/reference and one identity retained on resume. |
| Meda entry | Signup uses Personal gate; public landing is not unrestricted member discovery. | SE-resident +46 actor created/published/discovered an SE→FR offer through local services. Existing Meda tests cover ownership/privacy/lifecycle. Browser registration return and real WhatsApp delivery unverified. |
| Foreign-resident Business creator | New-account UI has the erroneous residence declaration; existing-account path has no such declaration. Organization has its own country/address. | Local organization completion passed with an SE-resident creator and CD organization; Personal SE/Stockholm remained unchanged. Business UI completion suite has a pre-existing fixture failure, so no successful full browser flow is claimed. |

## Proposed French wording — not implemented

- Required unchecked age confirmation: **« Je confirme avoir au moins 18 ans. »**
- Residence: **« Pays de résidence »**, help **« Le pays où vous habitez
  actuellement. Il peut être différent de l’indicatif de votre numéro WhatsApp. »**
- **« Ville de résidence »**. For Kinshasa: **« Commune »**, **« Quartier »**,
  **« Avenue (facultatif) »**; retain existing validation and generic international
  city/area fields, with region/postal code optional where applicable.
- Phone: **« Numéro WhatsApp »** and **« Indicatif du numéro WhatsApp »**.
- Organization: **« Pays de l’organisation »**, help **« Indiquez l’adresse de
  l’organisation, même si vous habitez dans un autre pays. »**
- Meda: **« Pays de départ »** / **« Pays d’arrivée »**, separate from profile.
- Account help, after scope is approved: **« Vous pouvez créer un compte depuis
  l’étranger. La disponibilité d’une activité dépend du service et du lieu
  concerné. »** Do not promise every country/feature is supported.
- Where a real service restriction exists: **« Ce service n’est pas disponible
  dans le lieu sélectionné. Vous pouvez continuer à utiliser votre compte SHIDA. »**
  Substitute the actual service/coverage explanation; do not invent restrictions.

Translate equivalent meaning into EN/LN/SW, including errors, required/optional
labels and accessibility labels. Keep separate consent and versioned terms controls.
Do not silently replace frozen Terms 1.1 text or attest acceptance for users.

## Smallest coherent implementation plan

1. **Align policy and copy.** Immediately distinguish the existing allowance for
   foreign residents with DRC activities from broader non-DRC activity eligibility.
   Business can stop claiming DRC residence by matching the existing activity
   wording. For the intended durable solution, approve account-level diaspora
   scope and reconcile Terms §2 with Meda; retain the exact 18+ threshold.
2. **Coordinate one shared declaration contract.** Separate adult confirmation
   from country collection in both frontends. Introduce an unambiguous versioned
   adult-only marker/contract in API and gateways instead of silently redefining
   `adult-drc-v1`. Preserve required confirmation, origin/CSRF, feature flags,
   browser binding, phone matching, rate limits, session scopes and legal checks.
   Plan a bounded compatibility window for existing clients; never accept an
   unchecked declaration or turn ordinary login into a new residency gate.
3. **Reuse existing country/address data.** Rename Personal labels and reuse the
   249-country dictionary / adaptive fields. If a new Business creator needs
   residence collection, use the same Personal profile stage and persist to the
   Personal record, separately from organization address. Do not rename the
   telephone-country field into residence or copy organization country to the
   human. Keep existing organization address requirements unchanged in this fix.
4. **Preserve workflow context.** Keep verification and complex creation on web.
   Retain language, the exact actor, and allowed Meda return destinations through
   signup/login; add only validated route/state allowlist entries if needed.
   Apply any approved geographic feature restrictions at feature validators,
   not the global account gate. Do not create a speculative global coverage engine.
5. **Focused acceptance.** All four locales: unchecked/checked adult declaration,
   wrong/missing/old contract markers, failed/expired verification, phone mismatch,
   stale draft, legal version change, malicious return URL; the six scenarios
   above; wrong Business/Personal workspace, actor switch, protected/deleting/test
   accounts, unavailable references and country changes clearing dependent fields.
   Test Kinshasa commune/quartier/optional avenue and foreign generic addresses.
   Check both frontend interaction flows plus local HTTP registration and Meda
   journeys. No production users/messages needed; no full backend suite.

Affected code is limited to Website registration copy/wizard/phone gateway/return
allowlist, Business creator UI/shared registration client, and backend registration
declaration validation (plus versioned policy documentation if scope changes).
Meda business rules need no speculative rewrite to admit a foreign resident.

## Existing accounts and migrations

The minimal copy/contract/address-label change needs **no data migration**:
`UserAccountDB.country_code` and international address fields already exist, while
Business and Meda locations are separate. Preserve existing IDs, verification,
sessions, memberships, drafts, country values and legal acceptance history.
Do not infer/backfill residence from +243/+46, IP, organization location or route.
Offer explicit correction for unknown/legacy values rather than blocking all
existing diaspora accounts. Existing named profiles may have no residence data;
missing data and geographic ineligibility must remain different states.

Durable adult-attestation evidence would require a separately designed additive
schema change if approved; never manufacture historical attestations. Any new
legal version/reacceptance policy needs its normal explicit versioned rollout,
not rewriting prior acceptance rows. No migration was proposed or run here.

## Focused validation and limits

Commands ran with existing dependencies, mocked frontend transport and isolated
temporary SQLite backend copies via the established runner. Application dotenv
and production connections were excluded. No browser server, PostgreSQL instance,
new dependency, full suite, production account or real message was used.

- Website: `node node_modules/vitest/vitest.mjs run
  tests/registration-gateway.test.ts tests/registration-reference.test.ts
  tests/registration-local-draft.test.ts tests/registration-return.test.ts
  tests/personal-whatsapp-login.test.ts` — **50 passed**.
- Business: corresponding Vitest run of `tests/phone.test.ts`,
  `tests/organization-creation.test.tsx`, `tests/organization-creation-gateway.test.ts`
  — **16 passed, 1 failed** on unchanged source. The completion fixture omits
  required address values; current `organization-onboarding.tsx:136` correctly
  leaves Create disabled. The test expected it enabled. Not repaired in this audit.
- Backend: `scripts/run_platform_validation.py --single-process --keep-report
  tests/test_registration_countries.py tests/test_registration_locations.py
  tests/test_web_registration.py tests/test_meda.py` — **64 passed, 1 failed**.
  The legacy location test calls direct WhatsApp profile creation and receives the
  intentional `onboarding_web_required` error. Do not restore that obsolete flow
  to make the test pass. Report: `logs/platform-validation/5d994342818a453c918a5077a55a1ba7`.
- Audit-specific scenario probes: **8 passed, zero skipped** after correcting the
  synthetic fixture. Final report:
  `logs/platform-validation/a86d639b6a0e41e0bd7536b6ae3925d5`.
  Initial run was 7/8: the organization fixture inherited an old helper without
  required CD quartier. Only the synthetic fixture was corrected; no validator
  was weakened. Initial report: `logs/platform-validation/8cec35b86cba4df1baf2de70b3be549e`.

Retained audit evidence (small files, no database or dependencies):
[scenario probes](evidence/onboarding-eligibility-20261118/scenario-probes.py),
[scenario result](evidence/onboarding-eligibility-20261118/scenario-results.json),
[existing backend selection](evidence/onboarding-eligibility-20261118/backend-existing-results.json),
[Website result](evidence/onboarding-eligibility-20261118/website-tests.txt),
[Business result and failure](evidence/onboarding-eligibility-20261118/business-tests.txt).
For reproduction, copy the probes to backend
`tests/test_onboarding_eligibility_audit_20261118.py` and run that exact selection
through `scripts/run_platform_validation.py --single-process --keep-report` using
the existing backend Python environment. They import backend test fixtures and
must not run against an ambient database. The audit's temporary test source was
removed after preserving a hash-identical evidence copy; backend application and
test source remain unchanged. Runner logs remain retained at the paths above.

Limitations: source/fixture evidence does not establish deployed configuration,
real WhatsApp country/provider delivery, device UX, legal permission for every
route, or production data quality. FR/EN/LN/SW copy was inspected; four-locale
end-to-end browser onboarding was not run. Existing unrelated tests/work and
shared dependencies were preserved. No application build was needed for this audit.
