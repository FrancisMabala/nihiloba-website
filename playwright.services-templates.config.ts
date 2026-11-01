import {defineConfig} from '@playwright/test';
import base from './playwright.services.config';
export default defineConfig({...base,testMatch:['services-template-refinement.browser.ts','services-templates.browser.ts']});
