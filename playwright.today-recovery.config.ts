import base from './playwright.waiting.config';
import {defineConfig} from '@playwright/test';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Override with an existing production preview when the integration run owns it.
const baseURL=process.env.ROLLOUT_BASE_URL??'http://127.0.0.1:3044';
process.env.ROLLOUT_BASE_URL=baseURL;
export default defineConfig({...base,testMatch:'restaurant-today-recovery.browser.ts',timeout:60_000,
 use:{...base.use,baseURL,hasTouch:true},
 webServer:process.env.TODAY_RECOVERY_EXTERNAL_PREVIEW==='1'?undefined:base.webServer,
 outputDir:process.env.TODAY_RECOVERY_OUTPUT??mkdtempSync(join(tmpdir(),'shida-today-recovery-')),
});
