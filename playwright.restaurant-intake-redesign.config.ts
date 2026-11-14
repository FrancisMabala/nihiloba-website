import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:['restaurant-intake-redesign.browser.ts'],workers:1,outputDir:join(tmpdir(),`shida-restaurant-intake-${Date.now()}`),use:{baseURL:'http://localhost:3013',channel:'chrome',headless:true,serviceWorkers:'block',bypassCSP:true},reporter:'list'});
