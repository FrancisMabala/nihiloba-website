import { beforeEach, describe, expect, it, vi } from "vitest";

const getApartments = vi.fn();
const getHotels = vi.fn();

vi.mock("../app/services/shida/public-client", () => ({ getApartments, getHotels }));

describe("marketplace sitemap", () => {
  beforeEach(() => {
    getApartments.mockReset();
    getHotels.mockReset();
  });

  it("includes apartment and owner canonicals without indexing filter combinations", async () => {
    getApartments.mockResolvedValue({
      items: [{
        public_ref: "APT-1", slug: "bright-flat", owner: { public_ref: "AOP-1", slug: "bright-agency" },
      }],
      count: 1, total: 1, page: 1, page_size: 20, filters: { property_types: ["apartment"] },
    });
    getHotels.mockResolvedValue({ items: [], count: 0 });
    const { default: sitemap } = await import("../app/sitemap");
    const urls = (await sitemap()).map((item) => item.url);
    expect(urls).toContain("https://nihiloba.com/shida/appartements");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements");
    expect(urls).toContain("https://nihiloba.com/shida/appartements/bright-flat");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements/bright-flat");
    expect(urls).toContain("https://nihiloba.com/shida/appartements/proprietaires/bright-agency");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements/proprietaires/bright-agency");
    expect(urls.some((url) => url.includes("?"))).toBe(false);
  });
});
