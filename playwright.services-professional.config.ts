import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:['services-professional.browser.ts','services-workspace.browser.ts','services-setup-category.browser.ts','services-management.browser.ts','services-catalogue-recovery.browser.ts','services-booking.browser.ts'],outputDir:'test-results/services-professional'});
