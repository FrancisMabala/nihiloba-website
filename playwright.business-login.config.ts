import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:'business-login.browser.ts',workers:1,use:{baseURL:'http://127.0.0.1:3016',channel:'chrome',headless:true,serviceWorkers:'block'},outputDir:process.env.SHIDA_TEST_OUTPUT||'test-results/business-login',reporter:'list'});
