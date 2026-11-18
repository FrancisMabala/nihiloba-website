import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:['public-standard.browser.ts','compact-marketplaces.browser.ts'],outputDir:mkdtempSync(join(tmpdir(),'shida-public-standard-')),workers:1,timeout:240000,expect:{timeout:20000},reporter:'list',use:{baseURL:process.env.PUBLIC_STANDARD_URL??'http://127.0.0.1:3017',channel:'chrome',headless:true,hasTouch:true,serviceWorkers:'block',bypassCSP:true}});
