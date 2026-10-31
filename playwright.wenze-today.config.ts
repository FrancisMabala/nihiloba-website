import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:['wenze-today.browser.ts','wenze-seller-improvements.browser.ts'],workers:2,outputDir:'test-results/wenze-today',reporter:'list'});
