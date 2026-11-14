import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:['restaurant-stock-redesign.browser.ts'],workers:1,
 outputDir:join(tmpdir(),`shida-restaurant-stock-${Date.now()}`),
 // Webpack development uses eval; production CSP remains unchanged.
 use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,serviceWorkers:'block',bypassCSP:true},reporter:'list'});
