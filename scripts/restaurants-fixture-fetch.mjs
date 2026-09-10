// Opt-in, process-local fixtures for the production-server smoke check only.
// This module is never imported by the application or deployment scripts.
import { actions, business, collection, menu, restaurant } from "../tests/fixtures/restaurants.mjs";
if (process.env.RESTAURANT_FIXTURE_MODE !== "1" || process.env.SHIDA_API_BASE_URL !== "https://restaurant-fixture.invalid") throw new Error("Restaurant fixtures require the isolated test configuration");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.origin !== "https://restaurant-fixture.invalid") {
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return originalFetch(input, init);
    throw new Error("External network disabled in Restaurant fixture process");
  }
  const path = url.pathname;
  let payload;
  if (path.includes("RST-UNAVAILABLE") || path.includes("BUS-UNAVAILABLE")) return new Response("not found", { status: 404 });
  if (url.searchParams.get("query") === "failure") return new Response("unavailable", { status: 503 });
  if (path.includes("entity-actions")) payload = actions;
  else if (path.includes("businesses")) payload = business;
  else if (path.endsWith("/menu")) payload = menu;
  else if (path.endsWith("/restaurants")) {
    const page = Number(url.searchParams.get("page") || 1);
    const scenario = url.searchParams.get("query");
    const items = scenario === "empty" ? [] : scenario === "multiple" ? ["unknown", "open", "closed"].map((status, i) => ({ ...restaurant, public_ref: `RST-TEST${i + 1}`, name: i === 2 ? "Test establishment with a deliberately long name to verify readable local labels" : `Test Malewa ${i + 1}`, hours: { ...restaurant.hours, status }, menu_summary: { available_count: 0, sold_out_count: i === 1 ? 2 : 0, temporarily_unavailable_count: 0 } })) : [{ ...restaurant, name: page === 1 ? "Test Malewa" : "Test Malewa page two", menu_summary: { available_count: 0, sold_out_count: 0, temporarily_unavailable_count: 0 } }];
    payload = { ...collection(items, page, scenario === "empty" ? 0 : scenario === "multiple" ? 3 : 2, scenario === "multiple" ? 20 : 1), service_mode_options: ["Sur place"] };
  } else if (path.includes("/restaurants/")) payload = restaurant;
  else return new Response("unavailable in fixture", { status: 404 });
  return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
};
