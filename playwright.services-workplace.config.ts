import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:['services-workplace.browser.ts','services-counter.browser.ts','services-counter-adjustments.browser.ts'],outputDir:'test-results/services-workplace'});
