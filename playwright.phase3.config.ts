import {defineConfig} from '@playwright/test';
import servicesConfig from './playwright.services.config';
// Reuse the established process-local fixture server; no production writes.
process.env.RESTAURANT_TEST_BASE_URL='http://127.0.0.1:3027';
export default defineConfig({...servicesConfig,testDir:'./tests/browser',testMatch:['phase3-personal.browser.ts','account-space.browser.ts','wenze-shop-checkout.browser.ts','wenze-approved-ux.browser.ts','services-workday.browser.ts','services-provider.browser.ts','services-workspace.browser.ts','services-calendar.browser.ts','restaurant-counter-complete.browser.ts'],workers:2,timeout:45000,use:servicesConfig.use,reporter:[['list'],['json',{outputFile:'test-results/phase3-browser.json'}]]});
