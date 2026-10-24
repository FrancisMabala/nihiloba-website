import {defineConfig} from '@playwright/test';
import shared from './playwright.visual-v2.config';
export default defineConfig({...shared,webServer:{...shared.webServer,command:'node --import ./scripts/home-listings-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3044'},testMatch:['home-listings.browser.ts'],outputDir:'test-results/home-listings',reporter:[['list']]});
