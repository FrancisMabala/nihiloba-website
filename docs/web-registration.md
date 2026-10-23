> Initial activation update: see [22 October release record](registration-launch-20261022.md) for the owner’s explicit activation decision, legal version 1.1, adult/DRC self-declaration and remaining non-code obligations. Defaults remain off; production flags are changed explicitly during deployment.

# SHIDA native registration — 22 October 2026

The [23 October unified refinement](unified-registration-2026-10-23.md) supersedes
the original stage order below and the consolidated release's memory-only form:
new users enter a complete grouped form, retained in expiring tab-scoped storage,
before WhatsApp verification, then use the canonical saved draft and legal services.
Explicit saved-draft recovery still verifies first. No authentication or legal
versioning architecture is replaced.

## Architecture and behavior

The new `/shida/register/` and FR/EN/LN/SW routes present three compact stages:
Personal or Business, existing browser-bound WhatsApp verification, then short
groups of canonical profile/Organization fields and current legal documents.
Schools select Business; no school account type or dashboard is introduced.
The homepage and existing sign-in panels expose the same entry point.

There is no frontend registration domain. Private requests go through the narrow
same-origin gateway to the Backend's PersonalOnboardingService or existing
OrganizationOnboardingService. The latter retains its existing validation,
duplicate prevention, lifecycle, memberships and private registered address.
Organization field/catalog translations reuse the existing Business presentation
catalog (copied pure copy only); Backend owns the rules and allowed catalogs.

Verification reuses PersonalWhatsAppLogin and its challenge/code protocol,
timeouts, retries, cross-tab serialization and uncertain-session safeguards.
Registration has an explicit challenge purpose and obtains an onboarding-only
session. Normal sign-in does not create new actors. Finish rotates that session
only after canonical completion/current consent. Personal enters My Space;
Business uses a one-time form POST to the existing Business host. The token never
appears in a URL or persistent browser storage. The callback separately validates
the exact NIHILOBA origin and creates a host-only Business cookie.

Valid field edits are saved on blur; Next and Save use exact current revisions.
Conflicting drafts require explicit reload. Cancellation is deliberate; expired
or cancelled drafts can restart through the canonical service. Only the account
choice is kept in sessionStorage. Private fields remain on the server/in memory.
Another tab changing account clears private progress and invalidates pending work.
Unsaved edits have a browser close warning. Completed existing users are recognized.

My Space Settings edits the same Personal name/location projection with optimistic
revision checking. Existing language, account menu, logout and management links
remain the navigation authority. No phone editor, credential merge, Organization
settings duplication, marketplace publication or operational permission is added.

## Security and mobile details

Gateways allow only canonical paths, bound request bodies, require the exact
origin/session, and return private/no-store responses without reflecting input.
The registration-only CSP permits form submission to Business; strict-origin
referrer policy preserves the POST Origin without disclosing the source path.
Other existing security headers remain in force.

Step focus runs before paint, preventing Safari from moving focus after a user
starts typing. The mobile bar follows visual viewport keyboard contraction rather
than focus alone; it stays hidden until the viewport recovers. Reserved bottom
space remains stable, preventing navigation from appearing over a pointer release.
This narrowly scoped shared adjustment also supports external keyboards.

## Rollout and rollback

`NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED` defaults off. Set it to `true` **at
build time** to enable routes, entry points and profile editing. Backend independently
requires `WEB_REGISTRATION_ENABLED`. Do not enable until Backend migration **0197**
has explicit production authorization and is applied, the Business callback is
deployed, the canonical legal URLs are approved and readable, and activation is
explicitly authorized after live-flow acceptance. Registration reuses the existing
sign-in prepared WhatsApp message and number; there is no separate template gate. Missing legal URLs disable
new acceptance; draft legal source files are not approval evidence.

Disabling/rebuilding the website hides registration while preserving sign-in and
public discovery. Backend rollback must retain scope-aware authentication until
restricted sessions have expired; retain the additive schema and private drafts.
No dependency, PWA, cron, or worker is added. No live WhatsApp message or production
database operation was performed during local validation.

## Validation and limits

- Production build/type generation passes. Focused gateway/login tests: 28 passed.
- Full website unit run: 605 passed, 4 failed. All four reproduce on unchanged
  base `a9f1cf2`: three Wenze component markup expectations and one cart expectation.
- Full lint has four existing Restaurant errors; changed registration/navigation
  files pass focused lint. Existing failures are not suppressed or changed.
- Browser tests use synthetic Backend responses and intercept the Business POST;
  they do not register an account or contact WhatsApp. Chrome/WebKit cover four
  languages, Personal at 390/768/1366px, Business on mobile, stale/cancel recovery,
  keyboard navigation, cross-tab clearing (including slow resume) and profile
  updates: **42 passed** in the final run.
  A final profile screenshot settling check passes in both engines as well.
- Real iPhone/Android devices, actual WhatsApp delivery, deployed cross-host cookies
  and production PostgreSQL contention still require authorized rollout acceptance.
  WebKit emulation is not a claim of physical-device testing.
- Existing credential relinking/recovery has no safe canonical implementation;
  no replacement is invented. Legacy in-flight WhatsApp-only Personal conversations
  finish through the existing compatibility path; new canonical drafts are shared.

See Backend `docs/web-registration.md` for schema, identity and migration evidence,
and Business `docs/web-registration-handoff.md` for the cross-host boundary.

Representative fixture screenshots: [mobile choice](evidence/registration/chromium-choice-390.png),
[tablet](evidence/registration/chromium-choice-768.png),
[desktop](evidence/registration/chromium-choice-1366.png),
[profile fields](evidence/registration/chromium-details-1366.png),
[My Space settings](evidence/registration/webkit-profile-390.png).
