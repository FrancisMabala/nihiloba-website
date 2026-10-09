// Opt-in, process-local fixtures for the production-server smoke check only.
// This module is never imported by the application or deployment scripts.
import { actions, business, collection, menu, restaurant, unit, monetary } from "../tests/fixtures/restaurants.mjs";
if (process.env.RESTAURANT_FIXTURE_MODE !== "1" || process.env.SHIDA_API_BASE_URL !== "https://restaurant-fixture.invalid") throw new Error("Restaurant fixtures require the isolated test configuration");
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.origin !== "https://restaurant-fixture.invalid") {
    if (url.hostname === "127.0.0.1" || url.hostname === "localhost") return originalFetch(input, init);
    throw new Error("External network disabled in Restaurant fixture process");
  }
  const path = url.pathname;
  if (path.includes("RST-CHECKOUT")) {
    const establishment_ref="RST-CHECKOUT";
    if (path.endsWith("/ordering-options")) return Response.json({available:true,methods:{pickup:{windows:[{public_ref:"RWI-CHECKOUT",starts_at:"2027-01-01T10:00:00Z",ends_at:"2027-01-01T12:00:00Z",timezone_name:"Africa/Kinshasa"}]},delivery:{windows:[{public_ref:"RWD-CHECKOUT",starts_at:"2027-01-01T10:00:00Z",ends_at:"2027-01-01T12:00:00Z",timezone_name:"Africa/Kinshasa"}],areas:[{country:"CD",city:"Kinshasa",commune:"Gombe",quartier:null,scope:"whole_commune"}],fee:{amount:"500.00",currency:"CDF"}}},evaluated_at:"2026-10-08T10:00:00Z"});
    if (path.endsWith("/menu")) return Response.json({...menu,...collection([{...unit,public_ref:"RMI-FIXED",establishment_ref,currency:"CDF",unit_price:"1000.00",name:"Fufu"},{...monetary,public_ref:"RMI-PONDU",establishment_ref,availability:"available",name:"Pondu"}],1,2),establishment_ref});
    if (path.includes("entity-actions")) return Response.json({...actions,public_ref:establishment_ref});
    return Response.json({...restaurant,public_ref:establishment_ref,name:"Checkout Malewa",ordering_available:true});
  }
  // Detail redesign fixtures: isolated public references, never production data.
  const detailRef = path.match(/RST-(EMPTY|ERROR|HOURS|WITHDRAWN|PAGED)/)?.[0];
  if (detailRef) {
    const detailHours = { ...restaurant.hours, status: "closed", basis: "exceptional_closure", schedule: { windows: [{ weekday: 0, start: "09:00", end: "17:00" }, { weekday: 5, start: "20:00", end: "02:00" }] }, exceptional_closures: [{ starts_at: "2026-09-09T00:00:00Z", ends_at: "2026-09-10T00:00:00Z" }] };
    if (path.endsWith("/menu")) {
      if (detailRef === "RST-WITHDRAWN") return new Response("not found", { status: 404 });
      if (detailRef === "RST-ERROR") return new Response("unavailable", { status: 503 });
      const page = Number(url.searchParams.get("page") || 1);
      return Response.json({ ...menu, ...collection(detailRef === "RST-EMPTY" ? [] : menu.items.map(item => ({ ...item, establishment_ref: detailRef })), page, detailRef === "RST-EMPTY" ? 0 : detailRef === "RST-PAGED" ? 8 : 4, 4), establishment_ref: detailRef, hours: detailHours });
    }
    if (path.includes("entity-actions")) return Response.json({ ...actions, public_ref: detailRef, can_save_in_shida: false, can_follow_in_shida: false, link_destination_available: false });
    return Response.json({ ...restaurant, public_ref: detailRef, owning_business: null, hours: detailHours });
  }
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
