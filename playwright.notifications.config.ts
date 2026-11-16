import {defineConfig} from '@playwright/test';
const existing=process.env.NOTIFICATIONS_TEST_URL;
export default defineConfig({testDir:'./tests/browser',testMatch:'notifications*.browser.ts',workers:1,use:{baseURL:existing??'http://127.0.0.1:3047',channel:existing?'chrome':'msedge',headless:true,serviceWorkers:'block'},webServer:existing?undefined:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3047',url:'http://127.0.0.1:3047/shida/space',reuseExistingServer:false,timeout:120000},reporter:'list'});
