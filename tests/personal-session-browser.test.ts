import { afterEach, expect, it, vi } from "vitest";
import { restorePersonalSession, PersonalSessionError } from "../app/lib/personal-session-browser";
import { request } from "../app/lib/restaurant-seller-browser";
afterEach(() => vi.unstubAllGlobals());
it("retains private/no-store transport and supports cancellation", async () => {
 const fetcher = vi.fn().mockResolvedValue(Response.json({ binding: "a".repeat(64), user: { display_name: "Synthetic" } })); vi.stubGlobal("fetch", fetcher);
 const signal = new AbortController().signal;
 expect((await restorePersonalSession(signal)).user.display_name).toBe("Synthetic");
 expect(fetcher).toHaveBeenCalledWith("/api/shida/employment/session/", { cache: "no-store", credentials: "same-origin", signal });
});
it.each([401, 403, 503])("preserves status %s so transport failures cannot be mistaken for logout", async status => {
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({}, { status })));
 await expect(restorePersonalSession()).rejects.toMatchObject({ message: new PersonalSessionError(status).message, status });
});
it("fails closed on an invalid session binding", async () => {
 vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ binding: "invalid", user: { display_name: "Synthetic" } })));
 await expect(restorePersonalSession()).rejects.toMatchObject({ status: 401 });
});
it("avoids seller redirects while preserving locale, pagination and private transport", async () => {
 const fetcher = vi.fn().mockResolvedValue(Response.json({ items: [] })); vi.stubGlobal("fetch", fetcher);
 await request("personal/restaurants?language=ln&page=2", {}, "synthetic-binding");
 expect(fetcher).toHaveBeenCalledWith("/api/shida/personal/restaurants/?language=ln&page=2", expect.objectContaining({ cache: "no-store", credentials: "same-origin", headers: expect.objectContaining({ "X-Shida-Session": "synthetic-binding" }) }));
});
