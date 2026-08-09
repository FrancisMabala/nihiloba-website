import { cache } from "react";
import type {
  ApartmentListing,
  HotelListing,
  HotelRoomType,
  PublicCollection,
  PublicImage,
} from "../../types/shida-public";

const DEFAULT_API_BASE_URL = "https://api.nihiloba.com";
const REQUEST_TIMEOUT_MS = 8_000;

export class ShidaApiError extends Error {
  constructor(
    public readonly kind: "not-found" | "unavailable" | "malformed" | "configuration",
    public readonly status?: number,
  ) {
    super(`SHIDA public API ${kind}`);
    this.name = "ShidaApiError";
  }
}

function apiBaseUrl(): string {
  const configured = process.env.SHIDA_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" || url.username || url.password) throw new Error();
    return url.origin;
  } catch {
    throw new ShidaApiError("configuration");
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ShidaApiError("malformed");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, required = false): string | null {
  if (typeof value === "string" && (!required || value.trim())) return value;
  if (!required && value == null) return null;
  throw new ShidaApiError("malformed");
}

function number(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new ShidaApiError("malformed");
}

function image(value: unknown): PublicImage {
  const item = record(value);
  return { url: text(item.url, true)!, alt: text(item.alt) };
}

function apartment(value: unknown): ApartmentListing {
  const item = record(value);
  if (!Array.isArray(item.images)) throw new ShidaApiError("malformed");
  return {
    public_ref: text(item.public_ref, true)!, slug: text(item.slug, true)!, title: text(item.title, true)!,
    city: text(item.city), area: text(item.area), commune: text(item.commune), quartier: text(item.quartier),
    rent: number(item.rent), currency: text(item.currency), number_of_rooms: number(item.number_of_rooms),
    description: text(item.description), availability_state: text(item.availability_state),
    images: item.images.map(image), public_detail_url: text(item.public_detail_url, true)!, visit_url: text(item.visit_url),
  };
}

function roomType(value: unknown): HotelRoomType {
  const item = record(value);
  return {
    name: text(item.name, true)!, price: number(item.price), currency: text(item.currency),
    capacity: number(item.capacity), total_rooms: number(item.total_rooms), image_reference: text(item.image_reference),
    description: text(item.description),
  };
}

function hotel(value: unknown): HotelListing {
  const item = record(value);
  if (!Array.isArray(item.room_types)) throw new ShidaApiError("malformed");
  return {
    public_ref: text(item.public_ref, true)!, slug: text(item.slug, true)!, name: text(item.name, true)!,
    description: text(item.description), country_code: text(item.country_code), city: text(item.city), area: text(item.area),
    commune: text(item.commune), quartier: text(item.quartier), address_line: text(item.address_line), landmark: text(item.landmark),
    room_types: item.room_types.map(roomType), public_detail_url: text(item.public_detail_url, true)!, booking_url: text(item.booking_url),
  };
}

async function request(path: string, revalidate: number | false): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
  } catch {
    throw new ShidaApiError("unavailable");
  }
  if (response.status === 404) throw new ShidaApiError("not-found", 404);
  if (!response.ok) throw new ShidaApiError("unavailable", response.status);
  try {
    return await response.json();
  } catch {
    throw new ShidaApiError("malformed");
  }
}

function collection<T>(value: unknown, parse: (item: unknown) => T): PublicCollection<T> {
  const data = record(value);
  if (!Array.isArray(data.items) || typeof data.count !== "number") throw new ShidaApiError("malformed");
  return { items: data.items.map(parse), count: data.count };
}

export async function getApartments(): Promise<PublicCollection<ApartmentListing>> {
  return collection(await request("/api/public/shida/apartments", 60), apartment);
}

export async function getHotels(): Promise<PublicCollection<HotelListing>> {
  return collection(await request("/api/public/shida/hotels", 60), hotel);
}

export const getApartment = cache(async (slug: string): Promise<ApartmentListing> =>
  apartment(await request(`/api/public/shida/apartments/${encodeURIComponent(slug)}`, false)),
);

export const getHotel = cache(async (slug: string): Promise<HotelListing> =>
  hotel(await request(`/api/public/shida/hotels/${encodeURIComponent(slug)}`, false)),
);
