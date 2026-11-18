import {defineConfig} from '@playwright/test';
import base from './playwright.waiting.config';
export default defineConfig({...base,testMatch:'restaurant-panel-recovery.browser.ts',timeout:60000,
 outputDir:process.env.PANEL_TEST_OUTPUT??'test-results/panel-recovery'});
