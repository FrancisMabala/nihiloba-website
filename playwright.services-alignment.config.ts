import {randomUUID} from 'node:crypto';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:['services-today-refinement.browser.ts','services-template-refinement.browser.ts','services-reports-refinement.browser.ts','services-bill-presentation.browser.ts'],workers:1,timeout:60000,
 use:{baseURL:'http://127.0.0.1:3038',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:`"${process.execPath}" --import ./scripts/services-fixture-fetch.mjs node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3038`,url:'http://127.0.0.1:3038/shida/seller/services',reuseExistingServer:false,timeout:120000,env:{SHIDA_API_BASE_URL:`https://services-${randomUUID()}.fixture.invalid`,SERVICES_FIXTURE_MODE:'1'}},
 outputDir:'test-results/services-alignment',reporter:'list',
});
