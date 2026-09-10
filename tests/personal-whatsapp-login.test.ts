import { beforeEach, describe, expect, it, vi } from "vitest";
const jar = new Map<string, string>();
const set = vi.fn((name: string, value: string) => { if (value) jar.set(name, value); else jar.delete(name); });
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (key: string) => jar.has(key) ? { value: jar.get(key) } : undefined, set }) }));
import { GET, POST, DELETE } from "../app/api/shida/personal/auth/whatsapp/[[...path]]/route";
import { PERSONAL_SESSION_COOKIE } from "../app/api/shida/employment/route-utils";
import { personalLoginCopy } from "../app/lib/personal-login-copy";
const ref = "DWC_isolated_fixture", verifier = "v".repeat(43), token = "s".repeat(43);
const ctx = (path: string[] = []) => ({ params: Promise.resolve({ path }) });
const req = (method: string, origin = "https://nihiloba.com") => new Request("https://nihiloba.com/api/shida/personal/auth/whatsapp/", { method, headers: { origin } });
function bound() { jar.set("nihiloba_personal_challenge", `${ref}.${Date.now() + 300000}.${verifier}`); }
beforeEach(() => { jar.clear(); set.mockClear(); vi.unstubAllGlobals(); });
describe("Personal WhatsApp restricted gateway", () => {
  it("forwards public Origin behind the hosting proxy, never its internal URL or spoofed headers", async () => {
    bound();
    const fetcher = vi.fn(async () => Response.json({ status: "pending" })); vi.stubGlobal("fetch", fetcher);
    const request = new Request("http://internal-render:10000/api/shida/personal/auth/whatsapp/", { headers: { origin: "https://nihiloba.com", "x-forwarded-host": "attacker.example" } });
    expect((await GET(request, ctx([ref]))).status).toBe(200);
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: { Accept: "application/json", Origin: "https://nihiloba.com", Cookie: `shida_dashboard_challenge=${verifier}` } }));
  });
  it("creates a fresh attempt after an expired binding through an internal HTTP URL", async () => {
    jar.set("nihiloba_personal_challenge", `${ref}.1.${verifier}`);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ challenge_ref: ref, expires_at: new Date(Date.now() + 300000).toISOString(), whatsapp_url: "https://wa.me/243000000000?text=fixture" }, { headers: { "set-cookie": `shida_dashboard_challenge=${verifier}; HttpOnly` } })));
    expect((await POST(new Request("http://internal-render:10000/api/shida/personal/auth/whatsapp/", { method: "POST", headers: { origin: "https://nihiloba.com" } }), ctx())).status).toBe(201);
    expect(jar.get("nihiloba_personal_challenge")).not.toContain(".1.");
  });
  it("creates without identity or OTP; stores only HttpOnly verifier and preserves exact returned link", async () => {
    const link = "https://wa.me/243000000000?text=SHIDA%20BUSINESS%20LOGIN%20fixture";
    const fetcher = vi.fn(async () => Response.json({ challenge_ref: ref, expires_at: new Date(Date.now() + 300000).toISOString(), whatsapp_url: link, private: "hidden" }, { headers: { "set-cookie": `shida_dashboard_challenge=${verifier}; HttpOnly; Path=/` } })); vi.stubGlobal("fetch", fetcher);
    const result = await POST(req("POST"), ctx()); const body = await result.json();
    expect(result.status).toBe(201); expect(body.whatsapp_url).toBe(link); expect(JSON.stringify(body)).not.toContain(verifier); expect(body.private).toBeUndefined();
    expect(set).toHaveBeenCalledWith("nihiloba_personal_challenge", expect.stringContaining(verifier), expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/api/shida" }));
    expect(fetcher).toHaveBeenCalledWith("https://api.nihiloba.com/api/dashboard/auth/whatsapp-challenge", expect.objectContaining({ cache: "no-store", redirect: "manual", method: "POST" }));
    expect((fetcher.mock.calls as unknown[][])[0][1]).not.toHaveProperty("body");
    expect(result.headers.get("cache-control")).toContain("private, no-store");
  });
  it.each(["", "https://attacker.example"])("rejects missing/cross-origin %s", async origin => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await POST(req("POST", origin), ctx())).status).toBe(403); expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects missing, wrong-reference and expired browser bindings before exchange", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await POST(req("POST"), ctx([ref, "session"]))).status).toBe(404);
    bound(); expect((await POST(req("POST"), ctx(["DWC_different_fixture", "session"]))).status).toBe(404);
    jar.set("nihiloba_personal_challenge", `${ref}.1.${verifier}`);
    expect((await POST(req("POST"), ctx([ref, "session"]))).status).toBe(404); expect(fetcher).not.toHaveBeenCalled();
  });
  it("forwards only the bound verifier; Backend denies a wrong verifier", async () => {
    bound(); const fetcher = vi.fn(async () => Response.json({}, { status: 404 })); vi.stubGlobal("fetch", fetcher);
    expect((await GET(req("GET"), ctx([ref]))).status).toBe(404);
    expect(fetcher).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ Cookie: `shida_dashboard_challenge=${verifier}` }) })); expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
  });
  it.each(["pending", "verified", "expired", "cancelled"])("status %s never creates a session", async status => {
    bound(); vi.stubGlobal("fetch", vi.fn(async () => Response.json({ status, reason: "onboarding_required", phone: "private" })));
    const result = await GET(req("GET"), ctx([ref])); expect(await result.json()).toEqual({ status, reason: "onboarding_required" }); expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
  });
  it("exchanges once into shared session, clears challenge and prevents duplicate exchange", async () => {
    bound(); const fetcher = vi.fn(async () => Response.json({ authenticated: true, user: { display_name: "Private" } }, { headers: { "set-cookie": `shida_dashboard_session=${token}; Path=/; HttpOnly` } })); vi.stubGlobal("fetch", fetcher);
    expect(await (await POST(req("POST"), ctx([ref, "session"]))).json()).toEqual({ authenticated: true });
    expect(jar.get(PERSONAL_SESSION_COOKIE)).toBe(token); expect(jar.has("nihiloba_personal_challenge")).toBe(false);
    expect((await POST(req("POST"), ctx([ref, "session"]))).status).toBe(404); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("cancel removes browser binding without fabricating a Backend cancellation endpoint", async () => {
    bound(); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    expect((await DELETE(req("DELETE"), ctx(["DWC_obsolete_fixture"]))).status).toBe(200); expect(jar.has("nihiloba_personal_challenge")).toBe(true);
    expect((await DELETE(req("DELETE"), ctx([ref]))).status).toBe(200); expect(jar.has("nihiloba_personal_challenge")).toBe(false); expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([429, 503, 409])("retains safe %s failure without issuing session", async status => {
    bound(); vi.stubGlobal("fetch", vi.fn(async () => Response.json({ detail: "private" }, { status })));
    const result = await POST(req("POST"), ctx([ref, "session"])); expect(result.status).toBe(status); expect(await result.text()).not.toContain("private"); expect(jar.has(PERSONAL_SESSION_COOKIE)).toBe(false);
  });
  it("has all shared lifecycle labels in EN/FR/LN/SW", () => {
    for (const labels of Object.values(personalLoginCopy)) expect(Object.keys(labels).sort()).toEqual(Object.keys(personalLoginCopy.en).sort());
  });
});
