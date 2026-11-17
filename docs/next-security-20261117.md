# Next.js security patch — 17 November 2026

Next.js and `eslint-config-next` are pinned to **16.4.6**, replacing 16.4.3.
The lockfile changes only the Next.js package family and its root declarations.
React, application behavior, caching policy, sessions and gateway authorization
are unchanged. No backend release, migration or environment change is required.

This resolves [GHSA-mfr8-8qww-v76h](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h).
Upstream identifies 16.4.5 as the first patched release. The application does not
use the vulnerable nesting of `use cache` and `unstable_cache`; updating the
dependency removes the affected version regardless.

Focused validation for this dependency change:

- Production dependency audit: zero known vulnerabilities.
- Seven session, origin, passkey/email login, security, support and notification
  gateway test files: 101 checks passed.
- Lint of framework configuration, layouts and the assistance entry/gateway.
- Production build, including TypeScript, using the patched runtime.

Fresh local browser checks could not start: automatic approval review rejected
starting the temporary Admin server without further explanation. This restriction
was not bypassed. Prior UI evidence is not claimed as a test of the patched
runtime. Live read-only page, cache-header and unauthenticated gateway checks
accompany deployment; authenticated browser flows remain a validation limitation.

Validation uses a disposable source copy with isolated patched dependencies;
existing shared installations are untouched. No full unrelated suite or database
setup is needed. Release evidence and exact deployment status are recorded in
`C:/NIHILOBA/release-evidence/next-security-20261117`.
