import {defineConfig} from '@playwright/test';
import base from './playwright.wenze-shop-checkout.config';
export default defineConfig({...base,outputDir:'test-results/checkout-integration-run',testMatch:'wenze-checkout-integration.browser.ts'});
