import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:['services-account-navigation.browser.ts','services-public.browser.ts','public-shida-login.browser.ts','shared-chrome.browser.ts','services-customer-brief.browser.ts','services-bill-notices.browser.ts'],outputDir:'test-results/services-navigation'});
