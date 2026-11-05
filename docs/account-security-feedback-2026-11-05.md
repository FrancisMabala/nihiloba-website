# Security feedback correction

The personal security gateway preserves HTTP 429 and validated Retry-After seconds without exposing upstream diagnostics. My Account shows a localized wait in minutes (rounded up), explains that refreshing does not reset the limit, and distinguishes email-delivery failure from passkey cancellation/unavailability. EN/FR/LN/SW are covered.

No security limits, authentication rules, email provider settings or feature flags changed. No migration is required. Production email enrollment still returned delivery-unavailable at 20:02 Stockholm on 5 November; this UI correction does not repair SMTP delivery or enable email login.

Validation: focused security gateway and error-message tests, TypeScript and affected-file ESLint.
