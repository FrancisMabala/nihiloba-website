import { describe, expect, it } from "vitest";
import { personalRequestOrigin } from "../app/lib/personal-request-origin";
const request = (origin?: string, url = "http://internal-render:10000/api/test", extra = {}) => new Request(url, { method: "POST", headers: { ...(origin === undefined ? {} : { origin }), ...extra } });
describe("explicit Personal origin policy", () => {
  it("accepts canonical public HTTPS independently of internal hosting", () => {
    expect(personalRequestOrigin(request("https://nihiloba.com"))).toBe("https://nihiloba.com");
  });
  it.each([undefined, "", "null", "https://attacker.example", "https://nihiloba.com/", "https://nihiloba.com/path", "https://nihiloba.com?x=1", "https://user@nihiloba.com", "https://nihiloba.com, https://attacker.example", "http://nihiloba.com"])("rejects malformed or untrusted origin %s", origin => {
    expect(personalRequestOrigin(request(origin))).toBeNull();
  });
  it("does not grant trust to a matching hostile request host or forwarded headers", () => {
    expect(personalRequestOrigin(request("https://attacker.example", "https://attacker.example/api/test", { host: "attacker.example", "x-forwarded-host": "attacker.example", "x-forwarded-proto": "https", forwarded: "host=attacker.example;proto=https" }))).toBeNull();
    expect(personalRequestOrigin(request("https://attacker.example", undefined, { "x-forwarded-host": "nihiloba.com" }))).toBeNull();
  });
  it("denies cross-site even with the public Origin", () => {
    expect(personalRequestOrigin(request("https://nihiloba.com", undefined, { "sec-fetch-site": "cross-site" }))).toBeNull();
  });
  it.each(["http://localhost:3013", "http://127.0.0.1:3013", "https://localhost:3014", "http://[::1]:3013"])("preserves exact local origin %s", origin => {
    expect(personalRequestOrigin(request(origin, `${origin}/api/test`))).toBe(origin);
    expect(personalRequestOrigin(request(origin))).toBeNull();
  });
  it("allows missing Origin only for explicitly enabled same-origin GET", () => {
    const read = new Request("http://internal-render:10000/api/test", { headers: { "sec-fetch-site": "same-origin" } });
    expect(personalRequestOrigin(read, true)).toBe("https://nihiloba.com");
    expect(personalRequestOrigin(read)).toBeNull();
    expect(personalRequestOrigin(request(undefined, undefined, { "sec-fetch-site": "same-origin" }), true)).toBeNull();
  });
});
