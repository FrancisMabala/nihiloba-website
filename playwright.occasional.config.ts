import base from './playwright.job-search.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,timeout:90000,testMatch:['occasional-profile.browser.ts','mission-publication.browser.ts','mission-management.browser.ts'],outputDir:'test-results/occasional'});
