import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:['country-neutral-registration.browser.ts','registration.browser.ts'],workers:2,timeout:60000,
 use:{baseURL:'http://127.0.0.1:3044',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:'node --import ./scripts/marketplace-style-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3044',url:'http://127.0.0.1:3044/shida',reuseExistingServer:false,env:{SHIDA_API_BASE_URL:'https://services-11111111-1111-1111-1111-111111111111.fixture.invalid',SERVICES_FIXTURE_MODE:'1',NEXT_PUBLIC_SHIDA_WEB_REGISTRATION_ENABLED:'true'}},
 outputDir:'test-results/country-neutral',reporter:[['list'],['json',{outputFile:'test-results/country-neutral.json'}]]});
