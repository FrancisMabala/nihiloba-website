import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'confirmations.browser.ts',outputDir:'test-results/confirmations'});
