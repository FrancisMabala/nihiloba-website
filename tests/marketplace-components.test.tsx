import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApartmentCard, ApartmentDetail, HotelCard, HotelDetail, HotelRoomCard } from "../app/components/shida/marketplace";
import { ApartmentFilters, ApartmentOwnerProfile, ApartmentPagination } from "../app/components/shida/apartment-marketplace";
import { resolveHotelRoomImages } from "../app/components/shida/hotel-room-images";
import { availabilityLabel } from "../app/components/shida/marketplace-primitives";
import type { ApartmentCollection, ApartmentListing, HotelListing, PublicApartmentOwnerProfile } from "../app/types/shida-public";

const apartment: ApartmentListing = {
  public_ref: "APT-1", slug: "bright-flat", title: "Bright flat", city: "Kinshasa", area: null, commune: "Gombe",
  quartier: "Centre", rent: 500, currency: "USD", number_of_rooms: 2, description: "A public description",
  property_type: "apartment", availability_state: "available", images: [], owner: null, public_detail_url: "https://nihiloba.com/shida/appartements/bright-flat",
  visit_url: "https://wa.me/46769709059?text=visit",
};
const hotel: HotelListing = {
  public_ref: "HOT-1", slug: "hotel-one", name: "Hotel One", description: "A hotel", country_code: "CD", city: "Kinshasa",
  area: null, commune: "Gombe", quartier: null, address_line: "Public avenue", landmark: "Central square",
  room_types: [{ name: "Standard", price: 80, currency: "USD", rental_period: "night", capacity: 2, total_rooms: 4, image_reference: null, image_references: [], description: "Quiet room" }],
  public_detail_url: "https://nihiloba.com/shida/hotels/hotel-one", booking_url: "https://wa.me/46769709059?text=book",
};
const owner = {
  public_ref: "AOP-1", slug: "bright-agency", public_name: "Bright Agency", city: "Kinshasa", area: "Gombe",
  active_listing_count: 2, public_detail_url: "https://nihiloba.com/shida/appartements/proprietaires/bright-agency",
};

describe("marketplace presentation", () => {
  it("renders public apartment fields and canonical local detail link", () => {
    const html = renderToStaticMarkup(<ApartmentCard listing={apartment} locale="en"/>);
    expect(html).toContain("Bright flat");
    expect(html).toContain("Centre, Gombe, Kinshasa");
    expect(html).toContain("/shida/appartements/bright-flat");
    expect(html).toContain("marketplace-card");
    expect(html).toContain("Available");
  });

  it("localizes backend availability values without exposing raw status codes", () => {
    const html = renderToStaticMarkup(<ApartmentCard listing={{ ...apartment, availability_state: "AVAILABLE" }} locale="fr"/>);
    expect(availabilityLabel("AVAILABLE", "fr")).toBe("Disponible");
    expect(availabilityLabel("RENTED", "fr")).toBe("Loué");
    expect(availabilityLabel("INACTIVE", "en")).toBe("Unavailable");
    expect(html).toContain("Disponible");
    expect(html).not.toContain(">AVAILABLE<");
    expect(html).toContain("/fr/shida/appartements/bright-flat");
  });

  it("uses backend action URLs unchanged with safe external-link attributes", () => {
    const html = renderToStaticMarkup(<ApartmentDetail listing={apartment} locale="en"/>);
    expect(html).toContain("https://wa.me/46769709059?text=visit");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("Request a visit with SHIDA");
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain("Home");
    expect(html).toContain("Image unavailable");
  });

  it("links safe owner summaries from apartment cards and details without breaking legacy listings", () => {
    const owned = { ...apartment, owner };
    const card = renderToStaticMarkup(<ApartmentCard listing={owned} locale="fr"/>);
    const detail = renderToStaticMarkup(<ApartmentDetail listing={owned} locale="en"/>);
    const legacy = renderToStaticMarkup(<ApartmentDetail listing={apartment} locale="en"/>);
    expect(card).toContain("Publié par");
    expect(card).toContain("/fr/shida/appartements/proprietaires/bright-agency");
    expect(detail).toContain("View all homes from");
    expect(detail).toContain("/shida/appartements/proprietaires/bright-agency");
    expect(legacy).not.toContain("Published by");
  });

  it("renders URL-driven filters and preserves them in pagination links", () => {
    const filters = renderToStaticMarkup(<ApartmentFilters locale="en" search={{ query: "Gombe", city: "Kinshasa", bedrooms: 2 }} propertyTypes={["apartment", "studio"]}/>);
    const collection: ApartmentCollection = { items: [apartment], count: 1, total: 25, page: 2, page_size: 12, filters: { property_types: ["apartment", "studio"] } };
    const pagination = renderToStaticMarkup(<ApartmentPagination locale="en" search={{ query: "Gombe", city: "Kinshasa", bedrooms: 2 }} collection={collection}/>);
    expect(filters).toContain('name="query"');
    expect(filters).toContain('value="Gombe"');
    expect(filters).toContain('name="property_type"');
    expect(filters).toContain("Apartment");
    expect(pagination).toContain("query=Gombe&amp;city=Kinshasa&amp;bedrooms=2");
    expect(pagination).toContain("page=3");
  });

  it("renders a public owner profile and only its reusable apartment cards", () => {
    const profile: PublicApartmentOwnerProfile = {
      public_ref: owner.public_ref, slug: owner.slug, public_name: owner.public_name, city: owner.city, area: owner.area,
      description: "A trusted public agency", active_apartment_count: 2,
      apartments: [{ ...apartment, owner }, { ...apartment, public_ref: "APT-2", slug: "second-flat", title: "Second flat", owner }],
      public_detail_url: owner.public_detail_url,
    };
    const html = renderToStaticMarkup(<ApartmentOwnerProfile locale="en" profile={profile}/>);
    expect(html).toContain("Bright Agency");
    expect(html).toContain("Kinshasa");
    expect(html).toContain("2 available homes");
    expect(html).toContain("Bright flat");
    expect(html).toContain("Second flat");
    for (const privateLabel of ["phone", "email", "business ID", "WhatsApp identifier", "private address"]) expect(html).not.toContain(privateLabel);
  });

  it("renders a valid owner with zero listings as an empty profile, not a missing profile", () => {
    const profile: PublicApartmentOwnerProfile = {
      public_ref: owner.public_ref, slug: owner.slug, public_name: owner.public_name, city: null, area: null,
      description: null, active_apartment_count: 0, apartments: [], public_detail_url: owner.public_detail_url,
    };
    const html = renderToStaticMarkup(<ApartmentOwnerProfile locale="fr" profile={profile}/>);
    expect(html).toContain("Aucun logement n’est actuellement disponible pour ce profil.");
    expect(html).not.toContain("introuvable");
  });

  it("renders a lightweight multi-image gallery with an image count", () => {
    const images = [1, 2, 3].map((number) => ({
      url: `https://res.cloudinary.com/dbrxpvmzp/image/upload/v1/shida/apartments/${number}.jpg`,
      alt: `Apartment view ${number}`,
    }));
    const html = renderToStaticMarkup(<ApartmentDetail listing={{ ...apartment, images }} locale="fr"/>);
    expect(html).toContain("1 / 3");
    expect(html).toContain('aria-label="Photos de l’appartement"');
    expect(html).toContain("Demander une visite avec SHIDA");
    expect(html).toContain('aria-label="Fil d’Ariane"');
  });

  it("renders hotel room data and suppresses an unsafe booking URL", () => {
    const html = renderToStaticMarkup(<HotelDetail listing={{ ...hotel, booking_url: "javascript:alert(1)" }} locale="en"/>);
    expect(html).toContain("Standard");
    expect(html).toContain("Quiet room");
    expect(html).not.toContain("javascript:");
    expect(html).toContain("temporarily unavailable");
  });

  it("renders a zero-image room with its useful content and fallback", () => {
    const html = renderToStaticMarkup(<HotelRoomCard room={hotel.room_types[0]} hotelName={hotel.name} locale="en"/>);
    expect(html).toContain("Image unavailable");
    expect(html).toContain("Standard");
    expect(html).toContain("Quiet room");
    expect(html).toContain("$80.00");
    expect(html).not.toContain("marketplace-thumbnails");
  });

  it("renders one room image without unnecessary gallery controls", () => {
    const room = { ...hotel.room_types[0], image_references: ["https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/one.jpg"] };
    const html = renderToStaticMarkup(<HotelRoomCard room={room} hotelName={hotel.name} locale="en"/>);
    expect(html).toContain("Standard - Hotel One - photo 1");
    expect(html).not.toContain("marketplace-thumbnails");
    expect(html).not.toContain("1 / 1");
  });

  it("renders multiple images while keeping two room galleries isolated", () => {
    const standard = { ...hotel.room_types[0], image_references: [
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/standard-a.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/standard-b.jpg",
    ] };
    const suite = { ...hotel.room_types[0], name: "Suite", description: null, image_references: [
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/suite-a.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/suite-b.jpg",
      "https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/hotels/suite-c.jpg",
    ] };
    const html = renderToStaticMarkup(<HotelDetail listing={{ ...hotel, room_types: [standard, suite] }} locale="fr"/>);
    const standardImages = resolveHotelRoomImages(standard, hotel.name);
    const suiteImages = resolveHotelRoomImages(suite, hotel.name);
    expect(standardImages.map((image) => image.url)).toEqual(standard.image_references);
    expect(suiteImages.map((image) => image.url)).toEqual(suite.image_references);
    expect(standardImages[1].alt).toBe("Standard - Hotel One - photo 2");
    expect(suiteImages[2].alt).toBe("Suite - Hotel One - photo 3");
    expect(html).toContain("1 / 2");
    expect(html).toContain("1 / 3");
    expect(html).toContain("standard-b.jpg");
    expect(html).toContain("suite-c.jpg");
    expect(html).not.toContain(">null<");
  });

  it("rejects unsupported room image URLs and keeps the collection fallback safe", () => {
    const unsafeRoom = { ...hotel.room_types[0], image_references: ["javascript:alert(1)", "https://historical.example/room.jpg"] };
    expect(resolveHotelRoomImages(unsafeRoom, hotel.name)).toEqual([]);
    const html = renderToStaticMarkup(<HotelCard listing={{ ...hotel, room_types: [unsafeRoom] }} locale="en"/>);
    expect(html).toContain("Image unavailable");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("historical.example");
  });

  it("preserves localized Hotel routes and the exact booking URL", () => {
    const english = renderToStaticMarkup(<HotelDetail listing={hotel} locale="en"/>);
    const french = renderToStaticMarkup(<HotelDetail listing={hotel} locale="fr"/>);
    expect(english).toContain("/shida/hotels");
    expect(french).toContain("/fr/shida/hotels");
    expect(english).toContain("https://wa.me/46769709059?text=book");
    expect(french).toContain("https://wa.me/46769709059?text=book");
  });
});
