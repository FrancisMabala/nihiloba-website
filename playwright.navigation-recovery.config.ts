import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:['navigation-recovery.browser.ts','account-space.browser.ts','account-security.browser.ts','notifications.browser.ts'],outputDir:'test-results/navigation-recovery'});
