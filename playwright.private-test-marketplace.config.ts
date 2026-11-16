import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'private-test-marketplace.browser.ts',workers:1,timeout:45000,
 use:{baseURL:'http://127.0.0.1:3027',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:'node --import ./scripts/private-test-marketplace-fixture.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3027',url:'http://127.0.0.1:3027/shida/wenze/',reuseExistingServer:false,timeout:120000,
 env:{SHIDA_API_BASE_URL:'https://services-11111111-1111-1111-1111-111111111111.fixture.invalid',SERVICES_FIXTURE_MODE:'1'}},
 outputDir:join(tmpdir(),'shida-private-marketplace-browser-20261116'),reporter:'list',
});
