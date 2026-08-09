import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApartmentCard, ApartmentDetail, HotelDetail } from "../app/components/shida/marketplace";
import type { ApartmentListing, HotelListing } from "../app/types/shida-public";

const apartment: ApartmentListing = {
  public_ref: "APT-1", slug: "bright-flat", title: "Bright flat", city: "Kinshasa", area: null, commune: "Gombe",
  quartier: "Centre", rent: 500, currency: "USD", number_of_rooms: 2, description: "A public description",
  availability_state: "available", images: [], public_detail_url: "https://nihiloba.com/shida/appartements/bright-flat",
  visit_url: "https://wa.me/46769709059?text=visit",
};
const hotel: HotelListing = {
  public_ref: "HOT-1", slug: "hotel-one", name: "Hotel One", description: "A hotel", country_code: "CD", city: "Kinshasa",
  area: null, commune: "Gombe", quartier: null, address_line: "Public avenue", landmark: "Central square",
  room_types: [{ name: "Standard", price: 80, currency: "USD", capacity: 2, total_rooms: 4, image_reference: null, description: "Quiet room" }],
  public_detail_url: "https://nihiloba.com/shida/hotels/hotel-one", booking_url: "https://wa.me/46769709059?text=book",
};

describe("marketplace presentation", () => {
  it("renders public apartment fields and canonical local detail link", () => {
    const html = renderToStaticMarkup(<ApartmentCard listing={apartment} locale="en"/>);
    expect(html).toContain("Bright flat");
    expect(html).toContain("Centre, Gombe, Kinshasa");
    expect(html).toContain("/shida/appartements/bright-flat");
  });

  it("uses backend action URLs unchanged with safe external-link attributes", () => {
    const html = renderToStaticMarkup(<ApartmentDetail listing={apartment} locale="en"/>);
    expect(html).toContain("https://wa.me/46769709059?text=visit");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders hotel room data and suppresses an unsafe booking URL", () => {
    const html = renderToStaticMarkup(<HotelDetail listing={{ ...hotel, booking_url: "javascript:alert(1)" }} locale="en"/>);
    expect(html).toContain("Standard");
    expect(html).toContain("Quiet room");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("temporarily unavailable");
  });
});
