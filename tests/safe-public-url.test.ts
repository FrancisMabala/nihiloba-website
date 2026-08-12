import { describe, expect, it } from "vitest";
import { safePublicActionUrl, safePublicExternalUrl, safePublicImageUrl } from "../app/lib/safe-public-url";

describe("public URL allowlists", () => {
  it("preserves approved action URLs exactly", () => {
    const value = "https://wa.me/46769709059?text=aB_123-xyz";
    expect(safePublicActionUrl(value)).toBe(value);
    expect(safePublicActionUrl("https://api.nihiloba.com/go/aB_123-xyz")).toBe("https://api.nihiloba.com/go/aB_123-xyz");
  });

  it("rejects unsafe schemes and lookalike hosts", () => {
    expect(safePublicActionUrl("javascript:alert(1)")).toBeNull();
    expect(safePublicActionUrl("http://wa.me/123")).toBeNull();
    expect(safePublicActionUrl("https://wa.me.evil.example/123")).toBeNull();
  });

  it("accepts only the configured Cloudinary account path", () => {
    expect(safePublicImageUrl("https://res.cloudinary.com/dbrxpvmzp/image/upload/v1/shida/apartments/a.jpg")).toBeTruthy();
    expect(safePublicImageUrl("https://res.cloudinary.com/another/image/upload/a.jpg")).toBeNull();
    expect(safePublicImageUrl("https://example.com/a.jpg")).toBeNull();
  });

  it("allows only credential-free HTTPS provider links", () => {
    expect(safePublicExternalUrl("https://example.com/provider")).toBe("https://example.com/provider");
    expect(safePublicExternalUrl("http://example.com/provider")).toBeNull();
    expect(safePublicExternalUrl("https://user:pass@example.com/provider")).toBeNull();
  });
});
