import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
process.env.RESTAURANT_TEST_BASE_URL='http://127.0.0.1:3044';
export default defineConfig({...shared,testMatch:['ui-refinement.browser.ts','shared-public.browser.ts','account-space.browser.ts','phase3-personal.browser.ts'],workers:2,webServer:{...shared.webServer,command:'node --import ./scripts/refinement-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3044'},outputDir:'test-results/refinement',reporter:[['list'],['json',{outputFile:'test-results/refinement.json'}]]});
