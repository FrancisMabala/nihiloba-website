import {defineConfig} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const workspace=process.env.SHIDA_STARTUP_FIXTURE_WORKSPACE??JSON.parse(readFileSync('C:/NIHILOBA/meda-backend/logs/restaurant-startup-integration-workspace.json','utf8')).workspace;
export default defineConfig({
 testDir:'./tests/browser',testMatch:'restaurant-startup-integration.browser.ts',workers:1,timeout:240000,
 use:{baseURL:'http://127.0.0.1:3045',channel:'chrome',headless:true,serviceWorkers:'block'},
 webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3045',
  url:'http://127.0.0.1:3045/shida',reuseExistingServer:false,timeout:30000,
  env:{SHIDA_API_BASE_URL:'https://127.0.0.1:8045',NODE_EXTRA_CA_CERTS:join(workspace,'localhost-cert.pem'),NODE_OPTIONS:'',SERVICES_FIXTURE_MODE:'0'}},
 outputDir:'test-results/startup-integration',reporter:'list',
});
