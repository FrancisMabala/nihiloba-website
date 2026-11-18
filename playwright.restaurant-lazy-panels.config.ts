import {defineConfig} from '@playwright/test';
import base from './playwright.waiting.config';

export default defineConfig({...base,testMatch:'restaurant-lazy-panels.browser.ts',timeout:60000,
 outputDir:'test-results/restaurant-lazy-panels'});
