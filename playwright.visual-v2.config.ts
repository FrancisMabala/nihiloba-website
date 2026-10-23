import {defineConfig} from '@playwright/test';
import shared from './playwright.refinement.config';
export default defineConfig({...shared,use:{...shared.use,channel:undefined},testMatch:['ui-refinement.browser.ts','visual-v2.browser.ts'],
 webServer:{command:'node --import ./scripts/refinement-fixture-fetch.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3044',url:'http://127.0.0.1:3044/shida/',reuseExistingServer:false,env:{SERVICES_FIXTURE_MODE:'1',SHIDA_API_BASE_URL:'https://services-00000000-0000-4000-8000-000000000023.fixture.invalid'}},
 projects:[{name:'chromium',use:{browserName:'chromium',channel:'chrome'}},{name:'webkit',use:{browserName:'webkit',channel:undefined}}],
 outputDir:'test-results/visual-v2',reporter:[['list'],['json',{outputFile:'test-results/visual-v2.json'}]]});
