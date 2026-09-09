import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:3107";
const fixture = new URL("./restaurants-fixture-fetch.mjs", import.meta.url).href;
const child = spawn(process.execPath, ["--import", fixture, "node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3107"], {
  stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  env: { ...process.env, RESTAURANT_FIXTURE_MODE: "1", SHIDA_API_BASE_URL: "https://restaurant-fixture.invalid" },
});
let output = "";
child.stdout.on("data", (chunk) => { output += chunk.toString(); });
child.stderr.on("data", (chunk) => { output += chunk.toString(); });
const stop = () => child.kill();
process.on("SIGINT", stop);
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Fixture server exited: ${output}`);
    if (/Ready in/.test(output)) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(ready, `Fixture server not ready: ${output}`);
  async function check(path, expected, status = 200) {
    const response = await fetch(`${origin}${path}`);
    const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
    assert.equal(response.status, status, path);
    assert(!html.includes("PRIVATE_"), `Private fixture field leaked: ${path}`);
    for (const text of expected) assert(html.includes(text), `${path} missing ${text}`);
    if (status === 200) assert(response.headers.get("cache-control")?.includes("no-store"), `${path} must not be cached`);
    console.log(`PASS ${path}`);
    return html;
  }
  await check("/shida/restaurants/?city=Kinshasa&page=1", ["Test Malewa", "Next", "city=Kinshasa"]);
  await check("/shida/restaurants/?city=Kinshasa&page=2", ["Test Malewa page two", "Previous"]);
  await check("/shida/restaurants/RST-TEST1/?back=city%3DKinshasa%26page%3D2", ["#restaurant-RST-TEST1", "page=2", "Owning Business", "Opening hours unknown", "TEST_SAVE", "TEST_FOLLOW"]);
  await check("/shida/restaurants/RST-TEST1/menu/", ["Unit price: ", "5.00", "USD", "1000.00 CDF", "Minimum amount", "Price not specified", "Sold out", "Current dated offering", "TEST_MENU"]);
  await check("/shida/businesses/BUS-TEST1/", ["Test Business", "/shida/restaurants/RST-TEST1"]);
  for (const lang of ["fr", "ln", "sw"]) {
    await check(`/${lang}/shida/restaurants/`, [`lang="${lang}"`, "Test Malewa"]);
    await check(`/${lang}/shida/restaurants/RST-TEST1/menu/`, ["1000.00 CDF"]);
    await check(`/${lang}/shida/businesses/BUS-TEST1/`, ["Test Business"]);
  }
  await check("/shida/restaurants/?query=empty", ["No establishments match"]);
  await check("/shida/restaurants/?query=failure", ["temporarily unavailable", "Try again"]);
  // Next may stream a not-found response after the shell; no target data may survive either way.
  const missing = await fetch(`${origin}/shida/restaurants/RST-UNAVAILABLE/`);
  const missingHtml = await missing.text();
  assert([200, 404].includes(missing.status)); assert(!missingHtml.includes("Test Malewa")); assert(missingHtml.includes("noindex"));
  console.log("PASS unavailable target: no target data, noindex");
  console.log("Restaurant production HTTP smoke passed (17 journeys; not browser or live-backend acceptance).");
} finally { stop(); }
