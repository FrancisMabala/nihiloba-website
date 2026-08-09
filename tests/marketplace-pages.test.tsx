import { afterEach, describe, expect, it, vi } from "vitest";
import { ApartmentOwnerPage, apartmentOwnerMetadata } from "../app/components/shida/marketplace-pages";

const profile = {
  public_ref: "AOP-1", slug: "bright-agency", public_name: "Bright Agency", city: "Kinshasa", area: "Gombe",
  description: null, active_apartment_count: 0, apartments: [],
  public_detail_url: "https://nihiloba.com/shida/appartements/proprietaires/bright-agency",
  whatsapp_url: "https://wa.me/private", email: "private@example.com",
};

afterEach(() => vi.unstubAllGlobals());

describe("apartment owner pages", () => {
  it("creates localized canonical and Open Graph metadata from public owner fields", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })));
    const metadata = await apartmentOwnerMetadata("fr", "bright-agency-metadata-test");
    expect(metadata.title).toContain("Bright Agency");
    expect(metadata.alternates?.canonical).toBe("/fr/shida/appartements/proprietaires/bright-agency");
    expect(metadata.openGraph && "url" in metadata.openGraph ? metadata.openGraph.url : null).toBe("/fr/shida/appartements/proprietaires/bright-agency");
    expect(JSON.stringify(metadata)).not.toContain("private@example.com");
    expect(JSON.stringify(metadata)).not.toContain("wa.me/private");
  });

  it("turns a missing owner endpoint into the Next.js not-found response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("not found", { status: 404 })));
    await expect(ApartmentOwnerPage({ locale: "en", owner: "missing-owner-page-test" })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });
});
