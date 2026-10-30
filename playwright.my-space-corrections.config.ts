import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:'my-space-corrections.browser.ts',outputDir:'test-results/my-space-corrections'});
