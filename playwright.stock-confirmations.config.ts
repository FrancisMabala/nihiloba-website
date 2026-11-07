import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'restaurant-stock.browser.ts',outputDir:'test-results/stock-confirmations'});
