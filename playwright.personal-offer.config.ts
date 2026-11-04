import base from './playwright.candidate-profile.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'personal-offer.browser.ts',outputDir:'test-results/personal-offer'});
