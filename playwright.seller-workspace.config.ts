import {defineConfig} from '@playwright/test';

// Production CSS and synthetic Personal seller data; no live acceptance writes.
export default defineConfig({
 testDir:'./tests/browser',testMatch:['restaurant-management.browser.ts','restaurant-settings.browser.ts','restaurant-personal-menu.browser.ts','restaurant-orders-queue.browser.ts','marketplace-access.browser.ts'],
 workers:1,timeout:45000,
 use:{baseURL:'http://127.0.0.1:3013',channel:'chrome',headless:true,serviceWorkers:'block',screenshot:'only-on-failure'},
 webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3013',url:'http://127.0.0.1:3013/shida/seller/restaurants',reuseExistingServer:false,timeout:120000},
 outputDir:'test-results/seller-workspace',reporter:'list',
});
