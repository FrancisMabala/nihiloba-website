import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=process.env.PILOT_OUTPUT??mkdtempSync(join(tmpdir(),'shida-work-pilot-'));
process.env.PILOT_OUTPUT=output;
export default defineConfig({testDir:'./tests/browser',testMatch:'services-work-pilot.browser.ts',workers:1,timeout:90000,expect:{timeout:15000},outputDir:join(output,'results'),reporter:'list',use:{baseURL:'http://127.0.0.1:3017',channel:'chrome',headless:true,hasTouch:true,serviceWorkers:'block'}});
