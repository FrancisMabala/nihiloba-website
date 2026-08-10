import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apartmentSearchQuery,
  getApartment,
  getApartmentOwner,
  getApartments,
  getHotel,
  getHotels,
  getWenzeProduct, getWenzeStore, getWenzeStores,
  parseApartmentSearchParams,
  ShidaApiError,
} from "../app/services/shida/public-client";

const owner = {
  public_ref: "AOP-1", slug: "bright-agency", public_name: "Bright Agency", city: "Kinshasa", area: "Gombe",
  active_listing_count: 1, public_detail_url: "https://nihiloba.com/shida/appartements/proprietaires/bright-agency",
};

const apartment = {
  public_ref: "APT-1", slug: "bright-flat", title: "Bright flat", city: "Kinshasa", area: null,
  commune: "Gombe", quartier: null, rent: 500, currency: "USD", number_of_rooms: 2,
  description: "A public description", property_type: "apartment", availability_state: "available",
  images: [{ url: "https://res.cloudinary.com/dbrxpvmzp/image/upload/v1/shida/apartments/a.jpg", alt: "Flat" }],
  owner,
  public_detail_url: "https://nihiloba.com/shida/appartements/bright-flat", visit_url: "https://wa.me/1",
};

const apartmentCollection = { items: [apartment], count: 1, total: 1, page: 1, page_size: 12, filters: { property_types: ["apartment", "studio"] } };

const hotel = {
  public_ref: "HOT-1", slug: "hotel-one", name: "Hotel One", description: "A hotel", country_code: "CD",
  city: "Kinshasa", area: null, commune: "Gombe", quartier: null, address_line: "Public avenue", landmark: null,
  room_types: [{ name: "Standard", price: 80, currency: "USD", rental_period: "night", capacity: 2, total_rooms: 4, image_reference: null, image_references: [], description: null }],
  public_detail_url: "https://nihiloba.com/shida/hotels/hotel-one", booking_url: "https://wa.me/2",
};

afterEach(() => vi.unstubAllGlobals());

describe("SHIDA public client", () => {
  it("parses apartment and hotel collections", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(apartmentCollection), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [hotel], count: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await getApartments()).items[0].title).toBe("Bright flat");
    expect((await getHotels()).items[0].room_types[0].name).toBe("Standard");
  });

  it("serializes every supported apartment filter safely", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(apartmentCollection), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await getApartments({ query: "2 bedrooms", city: "Kinshasa", area: "Gombe", property_type: "apartment", bedrooms: 2, min_price: 300, max_price: 700, page: 2, page_size: 12 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.nihiloba.com/api/public/shida/apartments?query=2+bedrooms&city=Kinshasa&area=Gombe&property_type=apartment&bedrooms=2&min_price=300&max_price=700&page=2&page_size=12",
      expect.any(Object),
    );
  });

  it("omits malformed numeric URL parameters and unsupported property types", () => {
    expect(parseApartmentSearchParams({ bedrooms: "2x", min_price: "-1", max_price: "Infinity", page: "0", page_size: "1000", property_type: "villa", query: [" Gombe ", "ignored"] })).toEqual({ query: "Gombe" });
    expect(apartmentSearchQuery({ query: "Gombe & Limete", page: 2 })).toBe("?query=Gombe+%26+Limete&page=2");
  });

  it("parses owner summaries and profiles while discarding all private fields", async () => {
    const profile = {
      public_ref: owner.public_ref, slug: owner.slug, public_name: owner.public_name, city: owner.city, area: owner.area,
      description: "Public agency description", active_apartment_count: 1, apartments: [{ ...apartment, owner_phone: "+000", private_address: "secret" }],
      public_detail_url: owner.public_detail_url, whatsapp_url: "https://wa.me/private", email: "private@example.com", business_id: 99, user_id: 42,
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(profile), { status: 200 })));
    const parsed = await getApartmentOwner("bright-agency-profile-test");
    expect(parsed.public_name).toBe("Bright Agency");
    expect(parsed.apartments[0].owner?.public_name).toBe("Bright Agency");
    for (const privateField of ["whatsapp_url", "email", "business_id", "user_id"]) expect(parsed).not.toHaveProperty(privateField);
    expect(parsed.apartments[0]).not.toHaveProperty("owner_phone");
    expect(parsed.apartments[0]).not.toHaveProperty("private_address");
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

  it("prefers normalized Hotel room image arrays and filters blanks", async () => {
    const normalizedHotel = { ...hotel, room_types: [{
      ...hotel.room_types[0],
      image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/legacy.jpg",
      image_references: [" https://res.cloudinary.com/dbrxpvmzp/image/upload/one.jpg ", "", "https://res.cloudinary.com/dbrxpvmzp/image/upload/two.jpg"],
    }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [normalizedHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/one.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/two.jpg",
    ]);
  });

  it("accepts an authoritative empty array without reviving a legacy value", async () => {
    const emptyHotel = { ...hotel, room_types: [{ ...hotel.room_types[0], image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/legacy.jpg", image_references: [] }] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [emptyHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([]);
  });

  it("falls back to newline-separated legacy images only when the normalized field is absent", async () => {
    const legacyRoom = { ...hotel.room_types[0], image_reference: "https://res.cloudinary.com/dbrxpvmzp/image/upload/a.jpg\n\nhttps://res.cloudinary.com/dbrxpvmzp/image/upload/b.jpg" };
    const olderRoom = { ...legacyRoom };
    Reflect.deleteProperty(olderRoom, "image_references");
    const legacyHotel = { ...hotel, room_types: [olderRoom] };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [legacyHotel], count: 1 }), { status: 200 })));
    expect((await getHotels()).items[0].room_types[0].image_references).toEqual([
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/a.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/b.jpg",
    ]);
  });

  it("parses public Wenze stores and products without retaining seller PII", async () => {
    const product={public_ref:"WNP-1",slug:"dress",name:"Dress",description:null,category:"fashion_clothing",price:"25",currency:"USD",price_negotiable:true,available_stock:3,has_variants:true,variant_type:"size",variants:[{public_ref:"WNV-1",label:"M",variant_type:"size",stock_quantity:2,available_stock:2,is_available:true},{public_ref:"WNV-2",label:"L",variant_type:"size",stock_quantity:1,available_stock:0,is_available:false}],images:[{url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/wenze/a.jpg",alt:"Product",display_order:1}],public_detail_url:"https://nihiloba.com/shida/wenze/products/dress",buy_url:"https://wa.me/1"};
    const store={public_ref:"WNZ-1",slug:"mado",name:"Mado",description:null,category:"fashion_clothing",country_code:"CD",city:"Kinshasa",area:"Gombe",commune:null,quartier:null,address:"Commerce 12",landmark:null,products:[product],public_detail_url:"https://nihiloba.com/shida/wenze/mado",whatsapp_url:"https://wa.me/1",owner_phone:"private"};
    vi.stubGlobal("fetch",vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({items:[store],count:1}))).mockResolvedValueOnce(new Response(JSON.stringify(store))).mockResolvedValueOnce(new Response(JSON.stringify({...product,store}))));
    expect((await getWenzeStores({city:"Kinshasa",category:"fashion_clothing"})).items[0]).not.toHaveProperty("owner_phone");
    expect((await getWenzeStore("mado-test")).products[0].available_stock).toBe(3);
    const parsed=await getWenzeProduct("dress-test");expect(parsed.store?.name).toBe("Mado");expect(parsed.variants[1]).toMatchObject({label:"L",available_stock:0,is_available:false});
  });
});
