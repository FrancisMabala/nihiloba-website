import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:['restaurant-public-refinement.browser.ts','restaurant-detail-design.browser.ts','restaurant-checkout.browser.ts','restaurant-discovery.browser.ts'],workers:1,use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,serviceWorkers:'block'},reporter:'list'});
