import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'services-onboarding.browser.ts',outputDir:'test-results/services-onboarding'});
