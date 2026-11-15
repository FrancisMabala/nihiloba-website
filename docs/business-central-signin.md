# Central Business sign-in

`/shida/business-login/` and its FR/EN/LN/SW variants reuse PersonalWhatsAppLogin, PasskeyLogin and EmailLogin. Email uses the existing eight-digit code, not a new password flow. An existing web session displays its real account name and requires an explicit Continue action; freshly authenticated accounts proceed to Business. Required personal-account setup uses the existing registration wizard and resumes the sanitized destination when returning.

The Business app cannot use credentials bound to a different relying-party origin. Passkeys therefore execute on the canonical NIHILOBA origin. Backend `origin_config` retains the exact configured HTTPS authority and hostname relying-party ID; no subdomain wildcard is added. The deployed passkey and email capability endpoints were confirmed enabled by read-only requests.

The existing Business handoff grant is sent in a form POST only to `https://business.nihiloba.com/handoff`. Source origin, expiry, single use and live full-session checks remain on the server. Only these entry routes receive the matching CSP form-action allowance. Pages and endpoints remain no-store/noindex. The return allowlist is mirrored from Business; it cannot supply an arbitrary URL. The only browser persistence is an allowlisted destination with a one-hour expiry, deleted on handoff/cancellation; never a credential or account identity.

The extracted `shida-wordmark` component retains the marketplace header's exact markup/styles and is mirrored in Business. Keep that component and `app/lib/business-auth/*` synchronized with the Business equivalents.

Validation: targeted gateway and session tests, production build/type/lint checks, and browser tests for successful synthetic email/passkey exchange, cancelled credentials, rejected codes, missing prerequisites, invitation return, external-redirect rejection and all four languages at mobile/desktop widths. Browser auth transport is mocked; no live credentials, real email or WhatsApp messages are used. Existing backend signed-assertion/code and single-use-grant tests supplement these browser checks. PostgreSQL concurrency was not repeated because Docker was unavailable.
