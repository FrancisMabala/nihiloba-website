process.env.UX_TEST_URL ||= 'http://127.0.0.1:3054';
process.env.RESTAURANT_TEST_BASE_URL=process.env.UX_TEST_URL;
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',testMatch:['ux-refinement.browser.ts','wenze-product-editor.browser.ts','wenze-checkout.browser.ts','phase3-personal.browser.ts','public-shida-login.browser.ts'],workers:2,timeout:60000,use:{baseURL:process.env.UX_TEST_URL||'http://127.0.0.1:3054',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},outputDir:'test-results/ux-refinement',reporter:[['list'],['json',{outputFile:'test-results/ux-refinement.json'}]]});
