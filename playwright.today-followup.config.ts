import base from './playwright.waiting.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'restaurant-today-followup.browser.ts',use:{...base.use,hasTouch:true}});
