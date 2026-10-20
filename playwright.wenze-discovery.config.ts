import {defineConfig} from "@playwright/test";
export default defineConfig({
  testDir:"./tests/browser",testMatch:"wenze-discovery.browser.ts",workers:1,
  use:{baseURL:"http://127.0.0.1:3032",channel:"chrome",headless:true},
  webServer:{command:"node --require ./tests/browser/wenze-catalog-fixture.cjs node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3032",url:"http://127.0.0.1:3032/shida/wenze/catalog",reuseExistingServer:false},
  reporter:"list",
});
