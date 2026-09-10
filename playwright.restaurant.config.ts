import { defineConfig } from "@playwright/test";
export default defineConfig({
 testDir: "./tests/browser", testMatch: "**/*.browser.ts", fullyParallel: false, workers: 1,
 use: { baseURL: process.env.RESTAURANT_TEST_BASE_URL ?? "http://127.0.0.1:3013", ignoreHTTPSErrors: process.env.RESTAURANT_ACTUAL_BACKEND === "1", channel: "chrome", headless: true, serviceWorkers: "block" },
 webServer: process.env.RESTAURANT_TEST_EXTERNAL_SERVER === "1" ? undefined : { command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3013", url: "http://127.0.0.1:3013/shida/seller/restaurants", reuseExistingServer: false, timeout: 120000 },
 reporter: "list",
});
