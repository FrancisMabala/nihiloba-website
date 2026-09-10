import { beforeEach, describe, expect, it, vi } from "vitest";
const jar = new Map<string, string>();
const set = vi.fn((key: string, value: string) => { if (value) jar.set(key, value); else jar.delete(key); });
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (key: string) => jar.has(key) ? { value: jar.get(key) } : undefined, set }) }));
import { GET, POST, PATCH } from "../app/api/shida/personal/restaurants/[[...path]]/route";
import { GET as session } from "../app/api/shida/employment/session/route";
import { POST as logout } from "../app/api/shida/employment/logout/route";
import { personalSessionBinding, PERSONAL_SESSION_COOKIE, EMPLOYMENT_SESSION_COOKIE } from "../app/api/shida/employment/route-utils";
import { allowedSellerRoute, validSellerQuery, validSellerBody, validShare } from "../app/lib/restaurant-seller-contract";
import { money, pricing, performRestaurant } from "../app/lib/restaurant-seller";
import { restaurantText, sellerChrome } from "../app/lib/restaurant-seller-copy";

const token = "isolated_test_session_not_real_123456";
const revision = "2026-09-10T10:00:00.123456+00:00";
const body = { expected_updated_at: revision, operation_key: "test-op-1", fields: { unit_price: "9007199254740991.25" } };
function req(path = "", method = "GET", data?: unknown, headers: Record<string, string> = {}) {
 return new Request(`https://nihiloba.com/api/shida/personal/restaurants${path ? `/${path}` : ""}`, { method, headers: { origin: "https://nihiloba.com", "x-shida-session": personalSessionBinding(token), "content-type": "application/json", ...headers }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
}
const ctx = (path = "") => ({ params: Promise.resolve({ path: path ? path.split("/") : [] }) });
beforeEach(() => { jar.clear(); jar.set(PERSONAL_SESSION_COOKIE, token); set.mockClear(); vi.unstubAllGlobals(); });

describe("Personal Restaurant restricted gateway", () => {
 it("accepts a protected public-origin edit behind an internal proxy and forwards the validated origin", async () => {
  const fetcher = vi.fn(async () => Response.json({ revision })); vi.stubGlobal("fetch", fetcher);
  const request = new Request("http://internal-render:10000/api/shida/personal/restaurants/RST_a", { method: "PATCH", headers: { origin: "https://nihiloba.com", "x-shida-session": personalSessionBinding(token), "content-type": "application/json", "x-forwarded-host": "attacker.example" }, body: JSON.stringify({ expected_updated_at: revision, fields: { name: "Updated fixture" } }) });
  expect((await PATCH(request, ctx("RST_a"))).status).toBe(200);
  expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ headers: expect.objectContaining({ Origin: "https://nihiloba.com", Cookie: `shida_dashboard_session=${token}` }) }));
 });
 it.each(["businesses/BUS_other/restaurants", "RST_a/orders", "RST_a/menu/items/RMC_wrong", "../restaurants", "RST_a/links/menu/extra", "suggestions"])("rejects unsupported path %s before fetching", async path => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); const result = await GET(req(), ctx(path)); expect(result.status).toBe(404); expect(fetcher).not.toHaveBeenCalled();
 });
 it("allowlists only exact methods and selectors", () => {
  expect(allowedSellerRoute("RST_a/hours", "PUT")).toBe(true); expect(allowedSellerRoute("RST_a", "DELETE")).toBe(false);
  expect(validSellerQuery("", "GET", new URLSearchParams("status=draft&page=2&page_size=20&language=ln"))).toBe(true);
  for (const query of ["owner=USR_a", "business_id=2", "phone=123", "page=1&page=2", "page_size=100", "language=de"]) expect(validSellerQuery("", "GET", new URLSearchParams(query))).toBe(false);
 });
 it("rejects absent/cross-site Origin on writes", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  for (const origin of ["", "https://other.example"]) expect((await POST(req("", "POST", {}, { origin }), ctx())).status).toBe(403);
  expect(fetcher).not.toHaveBeenCalled();
 });
 it("rejects missing and stale session binding without upstream writes", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await GET(req("", "GET", undefined, { "x-shida-session": "old" }), ctx())).status).toBe(401);
  jar.clear(); expect((await GET(req(), ctx())).status).toBe(401); expect(fetcher).not.toHaveBeenCalled();
 });
 it("rejects authority injection and full arbitrary projections", () => {
  expect(validSellerBody("RST_a", "PATCH", { expected_updated_at: revision, fields: { name: "New" } })).toBe(true);
  expect(validSellerBody("RST_a", "PATCH", { expected_updated_at: revision, fields: { owner_account_id: 9 } })).toBe(false);
  expect(validSellerBody("RST_a/menu/items/RMI_a", "PATCH", { ...body, actor_phone: "private" })).toBe(false);
  expect(validSellerBody("RST_a", "PATCH", { ...body })).toBe(false);
 });
 it("preserves original exact money, revision, operation key and upstream method", async () => {
  const fetcher = vi.fn(async () => Response.json({ revision, result: { public_ref: "RMI_a", unit_price: body.fields.unit_price } })); vi.stubGlobal("fetch", fetcher);
  const path = "RST_a/menu/items/RMI_a";
  const result = await PATCH(req(path, "PATCH", body), ctx(path)); expect(result.status).toBe(200);
  const [url, init] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
  expect(url.pathname).toBe("/api/dashboard/personal/restaurants/RST_a/menu/items/RMI_a"); expect(init.body).toBe(JSON.stringify(body)); expect(init.cache).toBe("no-store"); expect(init.redirect).toBe("manual");
  expect(init.headers).toMatchObject({ Cookie: `shida_dashboard_session=${token}` });
  expect(result.headers.get("cache-control")).toContain("private, no-store"); expect(result.headers.get("vary")).toBe("Cookie, Origin");
 });
 it.each([401, 403, 404, 409, 422, 503])("preserves safe recovery status %s without raw private errors", async status => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ detail: "private phone and traceback" }, { status })));
  const result = await GET(req(), ctx()); expect(result.status).toBe(status); expect(JSON.stringify(await result.json())).not.toContain("phone");
  if (status === 401) expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
 });
 it("rejects unexpected sharing destinations without rotating or fetching them", async () => {
  const value = { establishment_ref: "RST_a", destination: "menu", public_url: "https://api.nihiloba.com/go/aB_1-2", qr_content: "https://api.nihiloba.com/go/aB_1-2" };
  expect(validShare(value, "RST_a", "menu")).toBe(true); expect(validShare({ ...value, qr_content: "https://tracker.example/x" }, "RST_a", "menu")).toBe(false);
  const fetcher = vi.fn(async () => Response.json(value)); vi.stubGlobal("fetch", fetcher);
  const result = await POST(req("RST_a/links/menu", "POST"), ctx("RST_a/links/menu")); expect(await result.json()).toEqual(value); expect(fetcher).toHaveBeenCalledTimes(1);
 });
 it("bounds actual body bytes", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await POST(req("", "POST", { name: "x".repeat(66000) }), ctx())).status).toBe(413); expect(fetcher).not.toHaveBeenCalled();
 });
});
describe("shared Employment session compatibility", () => {
 it("migrates only an authenticated legacy cookie to a distinct name/path", async () => {
  jar.clear(); jar.set(EMPLOYMENT_SESSION_COOKIE, token);
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ user: { display_name: "Fixture seller", account_type: "personal" } })));
  const result = await session(); expect(result.status).toBe(200);
  expect(set).toHaveBeenCalledWith(PERSONAL_SESSION_COOKIE, token, expect.objectContaining({ path: "/api/shida", httpOnly: true }));
  expect(set).toHaveBeenCalledWith(EMPLOYMENT_SESSION_COOKIE, "", expect.objectContaining({ path: "/api/shida/employment", maxAge: 0 }));
  const value = await result.json(); expect(value.binding).toBe(personalSessionBinding(token)); expect(JSON.stringify(value)).not.toContain(token);
 });
 it("prefers the shared cookie and does not refresh its expiry on every read", async () => {
  jar.set(EMPLOYMENT_SESSION_COOKIE, "obsolete_legacy_session_1234"); const fetcher = vi.fn(async () => Response.json({ user: { display_name: "Current", account_type: "personal" } })); vi.stubGlobal("fetch", fetcher);
  await session(); expect((fetcher.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ headers: expect.objectContaining({ Cookie: `shida_dashboard_session=${token}` }) }); expect(set).not.toHaveBeenCalled();
 });
 it("clears both paths even when remote logout is unavailable", async () => {
  jar.set(EMPLOYMENT_SESSION_COOKIE, token); vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
  const result = await logout(new Request("https://nihiloba.com/api/shida/employment/logout", { method: "POST", headers: { origin: "https://nihiloba.com" } })); expect(result.status).toBe(503); expect(jar.size).toBe(0);
 });
});
describe("seller values and retries", () => {
 it("never coerces decimal money into floating point or unknown into zero", () => {
  expect(money("9007199254740991,25")).toBe("9007199254740991.25"); expect(() => money("0")).toThrow(); expect(() => money("1e4")).toThrow();
  expect(pricing({ pricing_model: "UNKNOWN" })).toMatchObject({ currency: null, unit_price: null, allowed_amounts: null });
  expect(pricing({ pricing_model: "AMOUNT_PRICED", currency: "CDF", allowed_amounts: "1000; 2500,50", minimum_amount: "" })).toMatchObject({ allowed_amounts: ["1000", "2500.50"], minimum_amount: null });
 });
 it("retries the exact serialized operation without reparsing its revision", async () => {
  const fetcher = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(Response.json({ result: {}, revision })); vi.stubGlobal("fetch", fetcher);
  const op = Object.freeze({ path: "personal/restaurants/RST_a/menu/items/RMI_a?language=fr", method: "PATCH", body: JSON.stringify(body) });
  await expect(performRestaurant(op, "binding")).rejects.toThrow(); await performRestaurant(op, "binding"); expect(fetcher.mock.calls[0]).toEqual(fetcher.mock.calls[1]);
 });
 it.each(["en", "fr", "ln", "sw"] as const)("has localized critical seller controls in %s", locale => {
  for (const key of ["create", "save", "conflict", "confirm_location", "pricing_model", "hours", "copyHelp", "unauthorized"]) expect(restaurantText(locale, key)).not.toBe("—"); expect(sellerChrome[locale].shareNote).toContain("WhatsApp");
 });
});
