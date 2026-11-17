import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'mobile-batches.browser.ts',workers:1,timeout:90000,use:{baseURL:'http://127.0.0.1:3000',channel:'chrome',headless:true,serviceWorkers:'block',hasTouch:true,bypassCSP:true,permissions:['local-network-access']},reporter:'list'});
