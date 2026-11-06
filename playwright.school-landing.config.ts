import { randomUUID } from 'node:crypto';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', testMatch: 'school-landing.browser.ts', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:3048', channel: 'chrome', headless: true, serviceWorkers: 'block' },
  webServer: {
    command: 'node --import ./scripts/school-landing-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3048',
    url: 'http://127.0.0.1:3048/shida/ecole', reuseExistingServer: false, timeout: 120000,
    env: { SHIDA_API_BASE_URL: `https://school-${randomUUID()}.fixture.invalid`, SCHOOL_LANDING_FIXTURES: '1' },
  }, outputDir: 'test-results/school-landing', reporter: 'list',
});
