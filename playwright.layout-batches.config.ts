import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:'layout-batches.browser.ts',workers:1,timeout:60000,outputDir:join(tmpdir(),`shida-layout-batches-${Date.now()}`),use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,serviceWorkers:'block',bypassCSP:true},reporter:'list'});
