import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:['account-design.browser.ts','account-security.browser.ts','my-space-corrections.browser.ts'],outputDir:'test-results/account-design',reporter:[['list'],['json',{outputFile:'test-results/account-design.json'}]]});
