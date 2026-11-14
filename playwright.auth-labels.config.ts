import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'auth-labels.browser.ts',workers:1,timeout:60000,
 use:{baseURL:'http://localhost:3054',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:'node --import ./scripts/marketplace-style-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3054',url:'http://127.0.0.1:3054/shida',reuseExistingServer:false,env:{SHIDA_API_BASE_URL:`https://services-${randomUUID()}.fixture.invalid`,SERVICES_FIXTURE_MODE:'1'}},
 outputDir:join(tmpdir(),'shida-auth-labels-'+randomUUID()),reporter:'list'});
