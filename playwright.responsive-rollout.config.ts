import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=process.env.ROLLOUT_OUTPUT??mkdtempSync(join(tmpdir(),'shida-responsive-'));
process.env.ROLLOUT_OUTPUT=output;
export default defineConfig({testDir:'./tests/browser',testMatch:'responsive-rollout.browser.ts',workers:1,timeout:180000,expect:{timeout:15000},outputDir:join(output,'results'),reporter:'list',use:{baseURL:process.env.ROLLOUT_BASE_URL??'http://127.0.0.1:3017',channel:'chrome',headless:true,hasTouch:true,serviceWorkers:'block'}});
