# External offer formatting and application-link fix — 10 November 2026

Owner-approved Admin formatting and confirmed published corrections reuse the
canonical backend job. Public detail sections and application instructions render
`offer-text-v1`, mirrored exactly in Admin's `lib/offer-text.tsx`: bold, italic,
level-three subheadings, explicit bullet/numbered lists and paragraph breaks.
Legacy `;;` separators remain supported. Short prose lines are no longer guessed
to be bullets. Cards and structured metadata strip supported formatting markers.
No raw HTML, images, executable Markdown links or formatting dependencies are added.

The application CTA keeps the existing backend external-action endpoint and URL
safety checks. Origin validation now reuses `personalRequestOrigin`: the exact
public browser origin is accepted behind Render's internal request URL. Forwarded
hosts do not establish trust. Malformed origins, cross-site requests and production
loopback origins remain rejected. Existing anonymous/no-Origin behavior is unchanged.
Destination query parameters are preserved. No application is submitted by link
resolution; the backend can record its ordinary CTA/redirect analytics event.

Focused validation: `tests/offer-text.test.ts`, `tests/jobs-marketplace.test.tsx`,
`tests/external-job-actions.test.ts`, changed-file lint, typecheck and production
build. `tests/browser/offer-formatting.browser.ts` uses the controlled Jobs fixture
with the real Next server/action proxy, mobile/desktop viewports and four locale
routes. The fixture forwards the public Origin to the internal server without
mocking the action response, and mocks only the backend and destination website.
Screenshots under `docs/evidence/offer-formatting-public-*.png` contain synthetic data.

Deploy the backend correction API and this public renderer before Admin exposes
the editor. No database migration or production configuration change is needed.
Existing text is unchanged until an administrator previews and confirms an edit.
Do not modify a live offer for release testing. Keep this renderer compatible with
stored markers if rolling back Admin. WhatsApp quick actions, identity, privacy,
login and notification behavior remain unchanged.
