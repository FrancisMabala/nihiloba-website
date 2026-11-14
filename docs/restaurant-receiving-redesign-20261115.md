# Restaurant receiving settings — 15 November 2026

Web and Business now use paired pickup/delivery cards, current authoritative receiving states, a compact counter shortcut, hours entry, and QR confirmation choices. Opening, paused, closed, incomplete and failed reads are distinct. Refresh time remains the last successful evaluation. Pausing is independent of delivery and does not modify existing orders.

Existing weekly scheduling, holiday closures, delivery areas/fees and QR stock checks are reused. Writes read current settings first; failed responses preserve the immutable retry and stale revisions require refreshed review. No schema, authorization or WhatsApp policy changes.

Validation: 23 browser cases (four languages; 320, 375, 390, 768, 1440 widths; independent pause/resume, lost response retry, closed/failed reads, QR confirmation, stale revision and retained weekly editor). TypeScript, changed-file lint and production builds pass for both apps. Web builds use webpack because its shared dependency junction is outside Turbopack's filesystem root. Screenshots retained in release-evidence/restaurant-seven-20261114. Native Lingala/Swahili review remains recommended. No production orders or settings were changed during testing.
