import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'restaurant-orders-mobile.browser.ts',workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:3000',channel:'chrome',headless:true,serviceWorkers:'block',hasTouch:true},reporter:'list'});
