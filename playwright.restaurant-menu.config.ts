import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:['restaurant-personal-menu.browser.ts','restaurant-photos.browser.ts'],workers:1,outputDir:join(tmpdir(),`shida-restaurant-menu-${Date.now()}`),use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,serviceWorkers:'block',bypassCSP:true},reporter:'list'});
