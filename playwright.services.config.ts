import {randomUUID} from 'node:crypto';
import {defineConfig} from '@playwright/test';

// The production fetch cache persists across starts. Isolate every fixture run.
const fixtureOrigin = `https://services-${randomUUID()}.fixture.invalid`;

export default defineConfig({
 testDir:'./tests/browser', testMatch:'services-*.browser.ts', workers:1, timeout:60000,
 use:{baseURL:'http://127.0.0.1:3027',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{
  command:'node --import ./scripts/services-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3027',
  url:'http://127.0.0.1:3027/shida/seller/services',reuseExistingServer:false,timeout:120000,
  env:{SHIDA_API_BASE_URL:fixtureOrigin,SERVICES_FIXTURE_MODE:'1'},
 },
 outputDir:'test-results/services',reporter:'list',
});
