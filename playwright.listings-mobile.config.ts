import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'listings-mobile.browser.ts',workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:3000',channel:'chrome',headless:true,hasTouch:true,serviceWorkers:'block'},reporter:'list'});
