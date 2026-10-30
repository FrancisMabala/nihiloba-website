import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:'my-space-visual.browser.ts',outputDir:'test-results/my-space-visual'});
