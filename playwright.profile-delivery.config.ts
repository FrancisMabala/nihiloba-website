import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:'profile-delivery.browser.ts',outputDir:'test-results/profile-delivery'});
