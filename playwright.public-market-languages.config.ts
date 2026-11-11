import {defineConfig} from "@playwright/test";
import shared from "./playwright.shared-public.config";
export default defineConfig({...shared,testMatch:"public-market-languages.browser.ts",
 webServer:{...shared.webServer as object,command:"node --import ./scripts/public-market-languages-fixture.mjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3044"},
 outputDir:"test-results/public-market-languages"});
