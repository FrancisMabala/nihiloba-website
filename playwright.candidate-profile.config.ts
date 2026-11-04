import base from './playwright.services.config';
import {defineConfig} from '@playwright/test';
const server=Array.isArray(base.webServer)?base.webServer[0]:base.webServer;
if(!server)throw new Error('Candidate tests require the isolated fixture server');
export default defineConfig({...base,testMatch:'candidate-profile.browser.ts',outputDir:'test-results/candidate-profile',webServer:{...server,url:'http://127.0.0.1:3027/shida/space?view=candidate'}});
