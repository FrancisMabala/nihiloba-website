import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:['wenze-orders.browser.ts','wenze-today.browser.ts'],outputDir:process.env.WENZE_RUN,workers:1,timeout:45000,use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,hasTouch:true,serviceWorkers:'block'},reporter:'list'});
