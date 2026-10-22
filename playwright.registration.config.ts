import {defineConfig} from '@playwright/test';
import shared from './playwright.shared-public.config';
export default defineConfig({...shared,use:{baseURL:'http://127.0.0.1:3044',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},testMatch:'registration.browser.ts',workers:2,projects:[{name:'chromium',use:{channel:'chrome'}},{name:'webkit',use:{browserName:'webkit'}}],outputDir:'test-results/registration',reporter:[['list'],['json',{outputFile:'test-results/registration.json'}]]});
