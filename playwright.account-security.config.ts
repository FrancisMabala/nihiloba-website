import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,testMatch:'account-security.browser.ts',workers:1,outputDir:'test-results/account-security',reporter:'list'});
