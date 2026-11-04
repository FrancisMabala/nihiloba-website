# Docker-backed testing

Follow the shared backend workflow: https://github.com/FrancisMabala/shida-backend/blob/main/docs/docker-testing.md
The canonical configuration is `compose.local.yaml` in the backend checkout. Do not create a duplicate database stack here.

- Database integration: use the authorized Docker test profile, an isolated loopback API and disposable test data; clean only task-owned resources using the shared guide.
- Unit checks: `npm test -- tests/<affected-file>.test.ts` with a real affected filename.
- Static checks: `npm run lint` and `npm run typecheck`.
- Browser checks: `node node_modules/@playwright/test/cli.js test --config=playwright.<feature>.config.ts` with the existing affected configuration and installed browser. Inspect whether it needs a build. Preserve mocked fixture interception and synthetic origins. Never test against production or load production dotenv credentials.
- Reuse installed dependencies. Ask before new host tools or additional environments. Do not automatically install dependencies, browsers, images or fallback databases.
- Diagnose Docker failures and list blocked integration coverage separately from compatible local checks. Mocks/SQLite do not prove PostgreSQL behavior.
- Preserve CI coverage and useful reports. No frontend GitHub workflow was present at this audit. No application Docker build is required for unit tests; `.dockerignore` protects future build contexts from local secrets and generated data.
