import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',testMatch:'space-selector.browser.ts',workers:1,timeout:60000,
 use:{baseURL:process.env.SHIDA_TEST_URL||'http://127.0.0.1:3013',channel:'chrome',headless:true,hasTouch:true,screenshot:'only-on-failure'},
 outputDir:process.env.SHIDA_TEST_OUTPUT!,
 reporter:[['list'],['json',{outputFile:process.env.SHIDA_TEST_REPORT!}]],
});
