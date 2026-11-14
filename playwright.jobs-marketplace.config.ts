import {randomUUID} from 'node:crypto';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:['jobs-marketplace.browser.ts','offer-formatting.browser.ts','employer-announcement.browser.ts','job-report.browser.ts'],workers:1,timeout:60000,
 use:{baseURL:'http://127.0.0.1:3028',channel:'chrome',headless:true,serviceWorkers:'block'},
 webServer:{command:'node --import ./scripts/jobs-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3028',url:'http://127.0.0.1:3028/shida/emplois',reuseExistingServer:false,timeout:120000,env:{SHIDA_API_BASE_URL:`https://jobs-${randomUUID()}.fixture.invalid`,JOBS_FIXTURE_MODE:'1'}},
 outputDir:'test-results/jobs-marketplace',reporter:'list',
});
