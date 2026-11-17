import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=process.env.RESTAURANT_TEST_OUTPUT??mkdtempSync(join(tmpdir(),'shida-five-'));
process.env.RESTAURANT_TEST_OUTPUT=output;
process.env.RESTAURANT_EVIDENCE_DIR??=join(output,'evidence');
const baseURL=process.env.RESTAURANT_TEST_BASE_URL??'http://127.0.0.1:3017';
process.env.RESTAURANT_TEST_BASE_URL=baseURL;
export default defineConfig({
 testDir:'./tests/browser',
 testMatch:['restaurant-stock-redesign.browser.ts','restaurant-finance-redesign.browser.ts','restaurant-statistics-redesign.browser.ts','restaurant-reservations-redesign.browser.ts','restaurant-settings.browser.ts','restaurant-remaining.browser.ts'],
 workers:1,timeout:90000,outputDir:join(output,'results'),
 use:{baseURL,channel:'chrome',headless:true,bypassCSP:true,serviceWorkers:'block',launchOptions:{args:['--disable-features=LocalNetworkAccessChecks']}},
 reporter:'list',
});
