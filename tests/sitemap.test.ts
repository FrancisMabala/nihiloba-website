import { beforeEach, describe, expect, it, vi } from "vitest";

const getApartments = vi.fn();
const getHotels = vi.fn();
const getWenzeStores = vi.fn();
const getServices = vi.fn();
const getJobs = vi.fn();

vi.mock("../app/services/shida/public-client", () => ({ getApartments, getHotels, getWenzeStores, getServices, getJobs }));

describe("marketplace sitemap", () => {
  beforeEach(() => {
    getApartments.mockReset();
    getHotels.mockReset();
    getWenzeStores.mockReset();
    getServices.mockReset();
    getJobs.mockReset();
  });

  it("includes apartment and owner canonicals without indexing filter combinations", async () => {
    getApartments.mockResolvedValue({
      items: [{
        public_ref: "APT-1", slug: "bright-flat", owner: { public_ref: "AOP-1", slug: "bright-agency" },
      }],
      count: 1, total: 1, page: 1, page_size: 20, filters: { property_types: ["apartment"] },
    });
    getHotels.mockResolvedValue({ items: [], count: 0 });
    getWenzeStores.mockResolvedValue({ items: [{ public_ref: "WNZ-1", slug: "mado-fashion" }], count: 1 });
    getServices.mockResolvedValue({ items: [{ public_ref: "SVC-1", slug: "consultation", provider: { slug: "patrick" } }], count: 1, total: 1, page: 1, page_size: 20 });
    getJobs.mockResolvedValue({ items: [{ public_ref: "JOB-1", slug: "it-support", employer: { public_ref: "EMP-1", slug: "rawbank" } }], pagination: { page: 1, page_size: 50, total_items: 1, total_pages: 1 } });
    const { default: sitemap } = await import("../app/sitemap");
    const urls = (await sitemap()).map((item) => item.url);
    expect(urls).toContain("https://nihiloba.com/shida/appartements");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements");
    expect(urls).toContain("https://nihiloba.com/shida/appartements/bright-flat");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements/bright-flat");
    expect(urls).toContain("https://nihiloba.com/shida/appartements/proprietaires/bright-agency");
    expect(urls).toContain("https://nihiloba.com/fr/shida/appartements/proprietaires/bright-agency");
    expect(urls.some((url) => url.includes("?"))).toBe(false);
    expect(urls).toContain("https://nihiloba.com/shida/wenze/mado-fashion");
    expect(urls).toContain("https://nihiloba.com/shida/services/consultation");
    expect(urls).toContain("https://nihiloba.com/fr/shida/services/providers/patrick");
    expect(urls).toContain("https://nihiloba.com/shida/emplois");
    expect(urls).toContain("https://nihiloba.com/fr/shida/emplois");
    expect(urls).toContain("https://nihiloba.com/shida/emplois/it-support");
    expect(urls).toContain("https://nihiloba.com/fr/shida/emplois/employeurs/rawbank");
    expect(urls).toContain("https://nihiloba.com/shida/terms");
    expect(urls).toContain("https://nihiloba.com/shida/terms/1.0");
    expect(urls).toContain("https://nihiloba.com/fr/shida/confidentialite/1.0");
    expect(urls).toContain("https://nihiloba.com/fr/shida/business/conditions");
  });
});
