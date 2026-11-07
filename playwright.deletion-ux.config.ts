import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:'account-deletion-ux.browser.ts',workers:1,outputDir:'test-results/deletion-ux',reporter:'list'});
