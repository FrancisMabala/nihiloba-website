import {defineConfig} from '@playwright/test';
import base from './playwright.waiting.config';
export default defineConfig({...base,use:{...base.use,hasTouch:true},testMatch:['waiting2-regression.browser.ts','waiting2-space.browser.ts'],timeout:90000,outputDir:'test-results/waiting2-regression'});
