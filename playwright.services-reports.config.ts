import {defineConfig} from '@playwright/test';
import base from './playwright.services.config';
export default defineConfig({...base,testMatch:['services-reports.browser.ts','services-reports-refinement.browser.ts']});
