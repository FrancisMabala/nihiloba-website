import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:'meda-acceptance.browser.ts',timeout:90000,outputDir:join(tmpdir(),'meda-acceptance-browser-'+Date.now()),workers:1,use:{actionTimeout:15000,baseURL:'http://127.0.0.1:3067',channel:'msedge',trace:'retain-on-failure',screenshot:'only-on-failure',headless:true,serviceWorkers:'block'},webServer:{command:'node --import ./scripts/meda-acceptance-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3067',url:'http://127.0.0.1:3067/shida/meda/',reuseExistingServer:false,timeout:120000,env:{SHIDA_API_BASE_URL:'https://meda.fixture.invalid',MEDA_ACCEPTANCE:'1'}},reporter:'list'});
