import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { localizedPath } from "../app/lib/i18n";

describe("production architecture regressions", () => {
  it("keeps canonical English and localized French marketplace paths", () => {
    expect(localizedPath("en", "/shida/appartements/example")).toBe("/shida/appartements/example");
    expect(localizedPath("fr", "/shida/appartements/example")).toBe("/fr/shida/appartements/example");
  });

  it("retains hardened headers on the Node web service", () => {
    const render = readFileSync("render.yaml", "utf8");
    expect(render).toContain("runtime: node");
    for (const header of [
      "Content-Security-Policy", "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy",
      "X-Content-Type-Options", "X-Frame-Options", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy",
    ]) expect(render).toContain(`name: ${header}`);
  });

  it("does not regress to static export and keeps the exact image allowlist", () => {
    const config = readFileSync("next.config.ts", "utf8");
    expect(config).not.toContain('output: "export"');
    expect(config).toContain('hostname: "res.cloudinary.com"');
    expect(config).toContain('pathname: "/dbrxpvmzp/image/upload/**"');
  });
});
