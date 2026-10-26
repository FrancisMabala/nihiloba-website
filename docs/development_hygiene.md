# Development artifact retention

Use the Node version required by package.json and the committed lockfile.
Run backend pytest through its standard isolated test environment; do not assign
new repository-root .pytest-*.db paths for each batch.

Next.js output (.next), TypeScript build state, pytest/Python caches, and browser
reports are generated artifacts. Stop their owning process before removing exact
rebuildable paths. Keep screenshots and sanitized release evidence deliberately
under docs/evidence; do not sweep that tree or tmp, which may contain retained
source or tools. Installed dependencies follow the existing preservation policy.

Integration server fixtures are separate from backend pytest: they must own a
unique temporary database, close connections on shutdown and remove that temporary
storage. Their current historical output is not removed by the backend pytest
hook. Never reuse development or production databases for fixtures.

The 26 October 2026 cross-repository audit found 186 SQLite files (902,668,288 bytes) under .s3a-local and tmp. Five databases in tmp are already tracked; preserve them until retention and activity have been reviewed. The guest backend fixture creates UUID directories without a cleanup lifecycle.

The backend docs/development_hygiene.md and dated inventory JSON files record the
cross-repository findings and exact paths. This change adds ignore coverage for
new databases, SQLite sidecars, caches and logs; it does not untrack old evidence
or delete any data. Historical standalone server fixture cleanup remains a
separate lifecycle concern. Default retention for new backend validation reports
is 14 days after completion; intentionally retained release evidence is exempt.

This repository change affects ignore rules and documentation only. Validate with
git diff --check and git check-ignore; no application behavior or schema changes.
