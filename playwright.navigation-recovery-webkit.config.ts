import {defineConfig,devices} from '@playwright/test';
import shared from './playwright.navigation-recovery.config';
export default defineConfig({...shared,testMatch:'navigation-recovery.browser.ts',use:{...shared.use,...devices['iPhone 13'],channel:undefined,browserName:'webkit'},outputDir:'test-results/navigation-recovery-webkit'});
