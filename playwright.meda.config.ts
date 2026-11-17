import {defineConfig} from '@playwright/test';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
export default defineConfig({testDir:'./tests/browser',testMatch:['meda.browser.ts','meda-visual.browser.ts'],outputDir:process.env.MEDA_BROWSER_OUTPUT??join(tmpdir(),'shida-meda-browser'),workers:1,use:{baseURL:'http://127.0.0.1:3067',channel:'msedge',headless:true,serviceWorkers:'block'},webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3067',url:'http://127.0.0.1:3067/shida/meda/',reuseExistingServer:false,timeout:120000,env:{SHIDA_API_BASE_URL:'https://meda-api.invalid'}},reporter:'list'});
