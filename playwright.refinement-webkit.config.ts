import {defineConfig} from '@playwright/test';
import refinement from './playwright.refinement.config';
export default defineConfig({...refinement,testMatch:'ui-refinement.browser.ts',use:{...refinement.use,browserName:'webkit',channel:undefined,isMobile:true,hasTouch:true},outputDir:'test-results/refinement-webkit',reporter:[['list'],['json',{outputFile:'test-results/refinement-webkit.json'}]]});
