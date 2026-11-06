# Individual selling draft UX — 7 November 2026

Adds saved-draft progress, actual modification dates, revision-controlled deletion, and a three-choice exit dialog. Save failures keep form input; leaving without saving preserves the previously saved draft. Publication and payment verification remain separate. Photos retain canonical five-file/8 MB limits and existing provenance expiry. No database migration or new dependencies.

Validation: 20 browser flows across EN/FR/LN/SW and five widths, plus two desktop/mobile save-failure, retry and deletion-dialog tests; two seller-contract unit tests; TypeScript, focused lint and production webpack build passed. Screenshots retained in task outputs/individual-selling-refinement. Backend 324a68c0 must be live before this frontend release.
