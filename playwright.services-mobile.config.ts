import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=process.env.SERVICES_TEST_OUTPUT??mkdtempSync(join(tmpdir(),'shida-services-mobile-'));
process.env.SERVICES_TEST_OUTPUT=output;
export default defineConfig({testDir:'./tests/browser',testMatch:process.env.SERVICES_PROPOSAL_REGRESSION?'services-opportunities.browser.ts':'services-mobile-batches.browser.ts',workers:1,timeout:90000,expect:{timeout:15000},outputDir:join(output,'results'),reporter:'list',use:{baseURL:process.env.SERVICES_TEST_URL??'http://127.0.0.1:3017',channel:'chrome',headless:true,hasTouch:true,bypassCSP:!process.env.SERVICES_PRODUCTION,serviceWorkers:'block'}});
