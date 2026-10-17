import {randomUUID} from 'node:crypto';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:['public-shida-login.browser.ts','services-public.browser.ts'],workers:1,timeout:25000,
 use:{baseURL:'http://127.0.0.1:3027',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:'node --import ./scripts/services-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3027',url:'http://127.0.0.1:3027/shida/services',reuseExistingServer:false,timeout:120000,env:{SHIDA_API_BASE_URL:`https://services-${randomUUID()}.fixture.invalid`,SERVICES_FIXTURE_MODE:'1'}},
 outputDir:'test-results/public-login',reporter:'list',
});
