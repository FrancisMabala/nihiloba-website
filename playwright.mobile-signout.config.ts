import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'mobile-signout.browser.ts',workers:1,timeout:45000,
 use:{baseURL:'http://127.0.0.1:3051',headless:true,serviceWorkers:'block',viewport:{width:390,height:844}},
 projects:[{name:'mobile-webkit',use:{browserName:'webkit',isMobile:true,hasTouch:true}},{name:'chrome',use:{browserName:'chromium',channel:'chrome'}}],
 webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3051',url:'http://127.0.0.1:3051/shida',reuseExistingServer:true},
 outputDir:'test-results/mobile-signout',reporter:'list'
});
