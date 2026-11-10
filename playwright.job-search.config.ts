import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser', testMatch:'job-search.browser.ts',
  outputDir:'test-results/job-search', reporter:'list', workers:1,
  use:{baseURL:'http://127.0.0.1:3049',channel:'chrome',headless:true,serviceWorkers:'block',trace:'off',screenshot:'only-on-failure'},
  webServer:{command:'node tests/browser/job-search-harness.mjs',url:'http://127.0.0.1:3049/health',reuseExistingServer:false,timeout:60000},
});
