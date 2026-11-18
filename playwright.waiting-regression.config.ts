import {defineConfig} from '@playwright/test';
import baseline from './playwright.waiting.config';
export default defineConfig({...baseline,testMatch:['waiting-regression.browser.ts','personal-whatsapp-login.browser.ts'],timeout:60000,outputDir:'test-results/waiting-regression'});
