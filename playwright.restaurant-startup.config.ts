import {defineConfig} from '@playwright/test';
import base from './playwright.waiting.config';
export default defineConfig({...base,testMatch:'restaurant-startup-performance.browser.ts',timeout:240000,outputDir:process.env.PERF_TEST_OUTPUT??'test-results/restaurant-startup'});
