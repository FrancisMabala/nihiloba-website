import { afterEach, describe, expect, it, vi } from "vitest";
import { getApartment, getApartments, getHotel, getHotels, ShidaApiError } from "../app/services/shida/public-client";

const apartment = {
  public_ref: "APT-1", slug: "bright-flat", title: "Bright flat", city: "Kinshasa", area: null,
  commune: "Gombe", quartier: null, rent: 500, currency: "USD", number_of_rooms: 2,
  description: "A public description", availability_state: "available",
  images: [{ url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/v1/shida/apartments/a.jpg", alt: "Flat" }],
  public_detail_url: "https://nihiloba.com/shida/appartements/bright-flat", visit_url: "https://wa.me/1",
};

const hotel = {
  public_ref: "HOT-1", slug: "hotel-one", name: "Hotel One", description: "A hotel", country_code: "CD",
  city: "Kinshasa", area: null, commune: "Gombe", quartier: null, address_line: "Public avenue", landmark: null,
  room_types: [{ name: "Standard", price: 80, currency: "USD", capacity: 2, total_rooms: 4, image_reference: null, description: null }],
  public_detail_url: "https://nihiloba.com/shida/hotels/hotel-one", booking_url: "https://wa.me/2",
};

afterEach(() => vi.unstubAllGlobals());

describe("SHIDA public client", () => {
  it("parses apartment and hotel collections", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [apartment], count: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [hotel], count: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await getApartments()).items[0].title).toBe("Bright flat");
    expect((await getHotels()).items[0].room_types[0].name).toBe("Standard");
  });

  it("parses detail responses without retaining extra private fields", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...apartment, owner_phone: "+000", id: 99 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...hotel, business_id: 99 }), { status: 200 })));
    const parsedApartment = await getApartment("detail-private-field-test");
    const parsedHotel = await getHotel("detail-private-field-test");
    expect(parsedApartment).not.toHaveProperty("owner_phone");
    expect(parsedApartment).not.toHaveProperty("id");
    expect(parsedHotel).not.toHaveProperty("business_id");
  });

  it("classifies backend and malformed-response failures", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: "wrong", count: 1 }), { status: 200 })));
    await expect(getApartments()).rejects.toMatchObject({ kind: "unavailable", status: 503 } satisfies Partial<ShidaApiError>);
    await expect(getHotels()).rejects.toMatchObject({ kind: "malformed" } satisfies Partial<ShidaApiError>);
  });

  it("classifies missing and network-failed details without exposing response content", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "private backend text" }), { status: 404 }))
      .mockRejectedValueOnce(new Error("private network details")));
    await expect(getApartment("missing-detail-test")).rejects.toMatchObject({ kind: "not-found", status: 404 });
    await expect(getHotel("network-failure-detail-test")).rejects.toMatchObject({ kind: "unavailable" });
  });
});
