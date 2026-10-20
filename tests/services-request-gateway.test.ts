import {beforeEach, afterEach, it, expect, vi} from "vitest";
const token = "isolated_test_session_not_real_123456";
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({cookies: async () => ({
  get: (key: string) => jar.has(key) ? {value: jar.get(key)} : undefined,
  set: (key: string, value: string) => { if (value) jar.set(key, value); else jar.delete(key); },
})}));
import {GET, POST} from "../app/api/shida/personal/service-requests/[...path]/route";
import {PERSONAL_SESSION_COOKIE, personalSessionBinding} from "../app/api/shida/employment/route-utils";
import {servicesRequestTarget} from "../app/lib/services-request-routing";
const upstream = vi.fn<typeof fetch>();
const context = (path: string) => ({params: Promise.resolve({path: path.split("?")[0].split("/")})});
const request = (path: string, method = "GET", body?: string | Uint8Array, headers: Record<string, string> = {}) =>
  new Request(`https://nihiloba.com/api/shida/personal/service-requests/${path}`, {method, body: typeof body === "string" ? body : body ? new Uint8Array(body) : undefined,
    headers: {Origin: "https://nihiloba.com", "X-Shida-Session": personalSessionBinding(token), "Content-Type": "application/json", ...headers}});
beforeEach(() => {
  jar.clear(); jar.set(PERSONAL_SESSION_COOKIE, token);
  vi.stubEnv("SHIDA_API_BASE_URL", "https://backend.test"); vi.stubGlobal("fetch", upstream);
  upstream.mockReset().mockImplementation(async () => Response.json({brief_ref: "SCB_one"}));
});
afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals();});

it("allows only exact Personal paths, methods and bounded nonduplicated query selectors", () => {
  for (const [path, method, target] of [
    ["briefs", "POST", "service-briefs"],
    ["briefs/SCB_one/review", "POST", "service-briefs/SCB_one/review"],
    ["briefs/SCB_one/publish", "POST", "service-postings/from-brief/SCB_one"],
    ["briefs/SCB_one/send", "POST", "service-direct-briefs/SCB_one/submit"],
    ["postings/SPR_one/accept", "POST", "service-postings/SPR_one/accept"],
    ["proposals/SPF_one/history", "GET", "service-proposals/SPF_one/history"],
    ["destinations/SVC_one", "GET", "service-direct-briefs/offerings/SVC_one"],
  ]) expect(servicesRequestTarget(path.split("/"), method, new URLSearchParams())).toBe(target);
  for (const [path, method, query] of [
    ["briefs/SCB_one/publish", "GET", ""], ["briefs/SVC_one", "GET", ""],
    ["briefs", "GET", "organization_ref=BUS_other"], ["briefs", "GET", "offset=1&offset=2"],
    ["briefs", "GET", "offset=10001"], ["postings/available", "GET", ""],
    ["proposals/SPF_one", "DELETE", ""], ["postings/SPR_one/accept/extra", "POST", ""],
    ["proposals", "GET", "offering_ref=SVC_one&provider=false"],
  ]) expect(servicesRequestTarget(path.split("/"), method, new URLSearchParams(query))).toBeNull();
});

it("does not contact the backend with another context, missing session, stale binding or cross-site writes", async () => {
  expect((await GET(request("briefs?organization_ref="), context("briefs"))).status).toBe(404);
  expect((await GET(request("briefs", "GET", undefined, {"X-Shida-Session": "stale"}), context("briefs"))).status).toBe(401);
  expect((await POST(request("briefs", "POST", "{}", {Origin: "https://attacker.test"}), context("briefs"))).status).toBe(403);
  expect((await GET(request("briefs", "GET", undefined, {"sec-fetch-site": "cross-site"}), context("briefs"))).status).toBe(403);
  jar.clear();
  expect((await GET(request("briefs"), context("briefs"))).status).toBe(401);
  expect(upstream).not.toHaveBeenCalled();
});

it("forwards the exact operation and cookie, never a caller-supplied authorization header", async () => {
  const payload = {operation_id: "same-retry", revision: 2, summary_digest: "a".repeat(64)};
  const response = await POST(request("briefs/SCB_one/review", "POST", JSON.stringify(payload), {Authorization: "caller-data"}), context("briefs/SCB_one/review"));
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("private, no-store");
  const [url, init] = upstream.mock.calls[0];
  expect(String(url)).toBe("https://backend.test/api/dashboard/service-briefs/SCB_one/review");
  expect(init?.headers).toEqual({Accept: "application/json", Origin: "https://nihiloba.com", Cookie: `shida_dashboard_session=${token}`, "Content-Type": "application/json"});
  expect(JSON.parse(new TextDecoder().decode(init?.body as Uint8Array))).toEqual(payload);
  expect(init?.redirect).toBe("manual");
});

it("bounds PDF bytes and requires an exact retry identity and draft revision", async () => {
  const path = "briefs/SCB_one/document-upload";
  const headers = {"Content-Type": "application/pdf", "X-Operation-Id": "upload-one", "X-Brief-Revision": "2"};
  expect((await POST(request(path, "POST", new Uint8Array(10 * 1024 * 1024 + 1), headers), context(path))).status).toBe(413);
  expect((await POST(request(path, "POST", "%PDF-1.4", {...headers, "X-Brief-Revision": "0"}), context(path))).status).toBe(422);
  expect(upstream).not.toHaveBeenCalled();
  expect((await POST(request(path, "POST", "%PDF-1.4", headers), context(path))).status).toBe(200);
  expect(upstream.mock.calls[0][1]?.headers).toMatchObject(headers);
});

it("forces private PDF attachment responses and does not forward storage URLs or cookies", async () => {
  upstream.mockResolvedValueOnce(new Response("%PDF-1.4", {headers: {"Content-Type": "application/pdf", "Set-Cookie": "untrusted", Location: "https://storage.test"}}));
  const path = "briefs/SCB_one/documents/SCD_one/download";
  const response = await GET(request(path), context(path));
  expect(await response.text()).toBe("%PDF-1.4");
  expect(response.headers.get("content-disposition")).toContain("attachment");
  expect(response.headers.get("content-security-policy")).toBe("sandbox");
  expect(response.headers.get("set-cookie")).toBeNull();
  expect(response.headers.get("location")).toBeNull();
});

it("keeps safe recovery codes and drops arbitrary validation details", async () => {
  upstream.mockResolvedValueOnce(Response.json({detail: "service_brief_stale"}, {status: 409}));
  expect(await (await POST(request("briefs/SCB_one/save", "POST", "{}"), context("briefs/SCB_one/save"))).json()).toEqual({detail: "service_brief_stale"});
  upstream.mockResolvedValueOnce(Response.json({detail: [{input: "private customer text"}]}, {status: 422}));
  expect(await (await GET(request("briefs"), context("briefs"))).json()).toEqual({detail: "service_brief_unavailable"});
  upstream.mockResolvedValueOnce(Response.json({detail: "expired"}, {status: 401}));
  expect((await GET(request("briefs"), context("briefs"))).status).toBe(401);
  expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
});
