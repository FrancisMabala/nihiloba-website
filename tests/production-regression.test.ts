import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { localizedPath } from "../app/lib/i18n";
import nextConfig from "../next.config";

describe("production architecture regressions", () => {
  it("keeps canonical English and localized French marketplace paths", () => {
    expect(localizedPath("en", "/shida/appartements/example")).toBe("/shida/appartements/example");
    expect(localizedPath("fr", "/shida/appartements/example")).toBe("/fr/shida/appartements/example");
  });

  it("keeps the Render Blueprint valid for a Node web service", () => {
    const render = readFileSync("render.yaml", "utf8");
    expect(render).toContain("runtime: node");
    expect(render).toContain("startCommand: npm run start");
    expect(render).not.toContain("headers:");
  });

  it("applies the hardened headers from Next.js to every route", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");
    const rules = await nextConfig.headers!();
    const globalRule = rules.find((rule) => rule.source === "/:path*");
    expect(globalRule).toBeDefined();
    const headers = globalRule && "headers" in globalRule ? globalRule.headers : [];
    const headerMap = new Map(headers.map(({ key, value }) => [key, value]));
    for (const header of [
      "Content-Security-Policy", "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy",
      "X-Content-Type-Options", "X-Frame-Options", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy", "X-XSS-Protection",
    ]) expect(headerMap.has(header)).toBe(true);
    expect(headerMap.get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headerMap.get("Strict-Transport-Security")).toBe("max-age=31536000");
    const candidateRules = rules.filter((rule) => rule.source.includes("my-applications") || rule.source.includes("mes-candidatures"));
    expect(candidateRules).toHaveLength(3);
    for (const rule of candidateRules) {
      const privateHeaders = new Map(("headers" in rule ? rule.headers : []).map(({ key, value }) => [key, value]));
      expect(privateHeaders.get("Cache-Control")).toContain("no-store");
      expect(privateHeaders.get("X-Robots-Tag")).toContain("noindex");
    }
  });

  it("does not regress to static export and keeps the exact image allowlist", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).not.toContain('output: "export"');
    expect(config).toContain('hostname: "res.cloudinary.com"');
    expect(config).toContain('pathname: "/dbrxpvmzp/image/upload/**"');
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.productionBrowserSourceMaps).toBe(false);
  });
});
