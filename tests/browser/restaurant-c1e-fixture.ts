import { type Page } from "@playwright/test";
const revision = "2026-09-10T10:00:00.123456+00:00";
const establishment = { public_ref: "RST_fixture", revision, status: "draft", profile: { name: "Isolated Malewa", description: "Synthetic fixture only", city: "Test city", commune: "Test commune", quartier: "Test district", food_business_type: "malewa", address_visibility: "broad", timezone_name: "Africa/Kinshasa" }, menu_currency: "CDF", location_confirmed: true, missing_publication_fields: [], actions: ["read", "edit", "preview", "menu", "hours", "publish", "links"], preview: { name: "Isolated Malewa", description: "Synthetic fixture only" } };
export async function fixture(page: Page) {
 await page.addInitScript(() => { window.open = () => null; });
 const state = { establishment: structuredClone(establishment), writes: [] as { path: string; method: string; body: Record<string, unknown> | null }[], stale: false, fail: false, denied: false, session: true, binding: "a".repeat(64), items: [] as Record<string, unknown>[], offerings: [] as Record<string, unknown>[] };
 await page.route("**/*", async route => {
  const req = route.request(), url = new URL(req.url());
  url.pathname = url.pathname.replace(/\/$/, "");
  if (url.origin !== "http://127.0.0.1:3013") return route.abort();
  if (!url.pathname.startsWith("/api/")) return route.continue();
  const reply = (json: unknown, status = 200) => route.fulfill({ status, json });
  if (url.pathname.endsWith("/employment/session")) return state.session ? reply({ user: { display_name: "Synthetic seller" }, binding: state.binding }) : reply({}, 401);
  if (url.pathname.endsWith("/employment/logout")) { state.session = false; return reply({ authenticated: false }); }
  if (url.pathname === "/api/shida/personal/auth/whatsapp") return reply({ challenge_ref: "DWC_fixture_only", expires_at: new Date(Date.now()+300000).toISOString(), whatsapp_url: "https://wa.me/243000000000?text=fixture" });
  if (url.pathname === "/api/shida/personal/auth/whatsapp/DWC_fixture_only") return reply({ status: "verified" });
  if (url.pathname === "/api/shida/personal/auth/whatsapp/DWC_fixture_only/session") { state.session = true; return reply({ authenticated: true }); }
  if (url.pathname.endsWith("/auth/request-code")) return reply({ challenge_ref: "DLC_fixture_only" });
  if (url.pathname.endsWith("/auth/verify-code")) { state.session = true; return reply({ user: { display_name: "Synthetic seller" } }); }
  const path = url.pathname.replace("/api/shida/personal/restaurants", "");
  if (!url.pathname.startsWith("/api/shida/personal/restaurants")) return reply({}, 404);
  if (state.denied) return reply({ detail: "restaurant_unavailable" }, 404);
  const method = req.method(); const data = req.postData() ? req.postDataJSON() : null;
  if (method !== "GET") {
   state.writes.push({ path, method, body: data });
   if (state.fail) { state.fail = false; return route.abort(); }
   if (state.stale) { state.stale = false; state.establishment.revision = "2026-09-10T10:01:00.999999+00:00"; return reply({ detail: "restaurant_stale" }, 409); }
   if (path.includes("/links/")) { const destination = path.endsWith("/menu") ? "menu" : "restaurant"; return reply({ establishment_ref: "RST_fixture", destination, public_url: "https://api.nihiloba.com/go/fixture_only", qr_content: "https://api.nihiloba.com/go/menu_qr_fixture" }); }
   if (path === "") { state.establishment.profile.name = data.name; return reply(state.establishment); }
   if (path.endsWith("/lifecycle/publish")) { state.establishment.status = "active"; state.establishment.actions = ["read", "edit", "preview", "menu", "hours", "unpublish", "links"]; return reply(state.establishment); }
   if (path.endsWith("/lifecycle/unpublish")) { state.establishment.status = "inactive"; return reply(state.establishment); }
   if (path === "/RST_fixture") { Object.assign(state.establishment.profile, data.fields); return reply(state.establishment); }
   const result = { public_ref: path.includes("offerings") ? "RDO_fixture" : "RMI_fixture", ...data.fields };
   if (path.includes("offerings")) { state.offerings = [{ ...state.offerings[0], ...result, state: data.fields.confirm ? "scheduled" : "unconfirmed", item: { public_ref: "RMI_fixture", name: "Fixture dish" }, timezone_name: "Africa/Kinshasa" }]; }
   return reply({ revision: state.establishment.revision, result, currency: "CDF" });
  }
  if (path === "") return reply({ items: [state.establishment], page: Number(url.searchParams.get("page") ?? 1), page_size: 20, total: 21, actions: ["create"] });
  if (path.endsWith("/preview") || path === "/RST_fixture") return reply(state.establishment);
  if (path.endsWith("/hours")) return reply({ revision: state.establishment.revision, currency: "CDF", result: { schedule: null, exceptional_closures: [], status: "unknown", timezone_name: "Africa/Kinshasa" } });
  const kind = path.split("/")[3]; const rows = kind === "categories" ? [{ public_ref: "RMC_fixture", name: "Food", visible: true }] : kind === "items" ? state.items : state.offerings;
  if (path.split("/").length > 4) return reply({ revision: state.establishment.revision, currency: "CDF", result: rows[0] });
  return reply({ revision: state.establishment.revision, currency: "CDF", result: { items: rows, page: 1, page_size: 20, total: rows.length } });
 });
 return state;
}
export async function open(page: Page) { await page.goto("/shida/seller/restaurants"); await page.getByRole("button", { name: "Edit", exact: true }).click(); await page.getByRole("button", { name: "My profile", exact: true }).click(); }
