import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'waiting-performance.browser.ts',workers:1,timeout:180000,
 use:{baseURL:'http://127.0.0.1:3044',channel:'chrome',headless:true,serviceWorkers:'block'},
 webServer:{command:'node --import ./scripts/marketplace-style-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3044',url:'http://127.0.0.1:3044/shida',reuseExistingServer:false,env:{SHIDA_API_BASE_URL:'https://services-11111111-1111-1111-1111-111111111111.fixture.invalid',SERVICES_FIXTURE_MODE:'1'}},
 outputDir:'test-results/waiting',reporter:'list'});
