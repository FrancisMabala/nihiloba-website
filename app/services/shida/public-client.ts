import { cache } from "react";
import type {
  ApartmentCollection,
  ApartmentListing,
  ApartmentPropertyType,
  ApartmentSearch,
  HotelListing,
  HotelRoomType,
  PublicApartmentOwnerProfile,
  PublicApartmentOwnerSummary,
  PublicCollection,
  PublicImage,
  WenzeImage, WenzeProduct, WenzeProductVariant, WenzeSearch, WenzeStore, WenzeStoreSummary,
} from "../../types/shida-public";
import { apartmentPropertyTypes } from "../../types/shida-public";

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

function integer(value: unknown, required = false): number | null {
  const parsed = number(value);
  if (parsed == null && !required) return null;
  if (parsed == null || !Number.isInteger(parsed) || parsed < 0) throw new ShidaApiError("malformed");
  return parsed;
}

function propertyType(value: unknown): ApartmentPropertyType | null {
  const parsed = text(value);
  if (parsed == null) return null;
  if (!apartmentPropertyTypes.includes(parsed as ApartmentPropertyType)) throw new ShidaApiError("malformed");
  return parsed as ApartmentPropertyType;
}

function textList(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new ShidaApiError("malformed");
  return value.map((item) => {
    if (typeof item !== "string") throw new ShidaApiError("malformed");
    return item.trim();
  }).filter(Boolean);
}

function image(value: unknown): PublicImage {
  const item = record(value);
  return { url: text(item.url, true)!, alt: text(item.alt) };
}

function apartmentOwner(value: unknown): PublicApartmentOwnerSummary | null {
  if (value == null) return null;
  const item = record(value);
  return {
    public_ref: text(item.public_ref, true)!,
    slug: text(item.slug),
    public_name: text(item.public_name, true)!,
    city: text(item.city),
    area: text(item.area),
    active_listing_count: integer(item.active_listing_count),
    public_detail_url: text(item.public_detail_url),
  };
}

function apartment(value: unknown): ApartmentListing {
  const item = record(value);
  if (!Array.isArray(item.images)) throw new ShidaApiError("malformed");
  return {
    public_ref: text(item.public_ref, true)!, slug: text(item.slug, true)!, title: text(item.title, true)!,
    city: text(item.city), area: text(item.area), commune: text(item.commune), quartier: text(item.quartier),
    rent: number(item.rent), currency: text(item.currency), number_of_rooms: number(item.number_of_rooms),
    description: text(item.description), property_type: propertyType(item.property_type), availability_state: text(item.availability_state),
    images: item.images.map(image), owner: apartmentOwner(item.owner),
    public_detail_url: text(item.public_detail_url, true)!, visit_url: text(item.visit_url),
  };
}

function apartmentOwnerProfile(value: unknown): PublicApartmentOwnerProfile {
  const item = record(value);
  if (!Array.isArray(item.apartments)) throw new ShidaApiError("malformed");
  return {
    public_ref: text(item.public_ref, true)!,
    slug: text(item.slug),
    public_name: text(item.public_name, true)!,
    city: text(item.city),
    area: text(item.area),
    description: text(item.description),
    active_apartment_count: integer(item.active_apartment_count, true)!,
    apartments: item.apartments.map(apartment),
    public_detail_url: text(item.public_detail_url),
  };
}

function roomType(value: unknown): HotelRoomType {
  const item = record(value);
  const legacyImageReference = text(item.image_reference);
  const normalizedImageReferences = textList(item.image_references);
  return {
    name: text(item.name, true)!, price: number(item.price), currency: text(item.currency),
    rental_period: text(item.rental_period), capacity: number(item.capacity), total_rooms: number(item.total_rooms),
    image_reference: legacyImageReference,
    image_references: normalizedImageReferences ?? legacyImageReference?.split(/\r?\n/).map((reference) => reference.trim()).filter(Boolean) ?? [],
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

function flag(value:unknown):boolean { if(typeof value!=="boolean") throw new ShidaApiError("malformed"); return value; }
function wenzeImage(value:unknown):WenzeImage { const item=record(value); return {url:text(item.url,true)!,alt:text(item.alt),display_order:integer(item.display_order)??0}; }
function wenzeVariant(value:unknown):WenzeProductVariant { const item=record(value); return {public_ref:text(item.public_ref,true)!,label:text(item.label,true)!,variant_type:text(item.variant_type),stock_quantity:integer(item.stock_quantity),available_stock:integer(item.available_stock),is_available:flag(item.is_available),buy_url:text(item.buy_url)}; }
function wenzeStore(value:unknown, detail=false):WenzeStore { const item=record(value); const products=item.products??[]; if(!Array.isArray(products)) throw new ShidaApiError("malformed"); const base:WenzeStoreSummary={public_ref:text(item.public_ref,true)!,slug:text(item.slug),name:text(item.name,true)!,description:text(item.description),category:text(item.category),country_code:text(item.country_code),city:text(item.city),area:text(item.area),commune:text(item.commune),quartier:text(item.quartier),address:text(item.address),landmark:text(item.landmark),public_detail_url:text(item.public_detail_url,true)!,whatsapp_url:text(item.whatsapp_url)}; return {...base,products:detail?products.map((p)=>wenzeProduct(p)):[]}; }
function wenzeProduct(value:unknown):WenzeProduct { const item=record(value),variants=item.variants??[]; if(!Array.isArray(item.images)||!Array.isArray(variants)) throw new ShidaApiError("malformed"); return {public_ref:text(item.public_ref,true)!,slug:text(item.slug),name:text(item.name,true)!,description:text(item.description),category:text(item.category),price:text(item.price),currency:text(item.currency),price_negotiable:flag(item.price_negotiable),available_stock:integer(item.available_stock),has_variants:item.has_variants===undefined?variants.length>0:flag(item.has_variants),variant_type:text(item.variant_type),variants:variants.map(wenzeVariant),images:item.images.map(wenzeImage).sort((a,b)=>a.display_order-b.display_order),public_detail_url:text(item.public_detail_url,true)!,buy_url:text(item.buy_url),store:item.store==null?null:wenzeStore(item.store)}; }

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
  if (!Array.isArray(data.items) || typeof data.count !== "number" || !Number.isInteger(data.count) || data.count < 0) throw new ShidaApiError("malformed");
  return { items: data.items.map(parse), count: data.count };
}

const searchTextKeys = ["query", "city", "area"] as const;

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  const normalized = candidate?.trim();
  return normalized ? normalized.slice(0, 120) : undefined;
}

function numericQuery(value: string | string[] | undefined, options: { integer?: boolean; min?: number; max?: number } = {}): number | undefined {
  const candidate = firstQueryValue(value);
  if (!candidate || !/^(?:\d+\.?\d*|\.\d+)$/.test(candidate)) return undefined;
  const parsed = Number(candidate);
  if (!Number.isFinite(parsed) || (options.integer && !Number.isInteger(parsed))) return undefined;
  if (parsed < (options.min ?? 0) || parsed > (options.max ?? Number.MAX_SAFE_INTEGER)) return undefined;
  return parsed;
}

export type ApartmentRawSearchParams = Record<string, string | string[] | undefined>;

export function parseApartmentSearchParams(value: ApartmentRawSearchParams): ApartmentSearch {
  const result: ApartmentSearch = {};
  for (const key of searchTextKeys) {
    const parsed = firstQueryValue(value[key]);
    if (parsed) result[key] = parsed;
  }
  const type = firstQueryValue(value.property_type);
  if (type && apartmentPropertyTypes.includes(type as ApartmentPropertyType)) result.property_type = type as ApartmentPropertyType;
  const bedrooms = numericQuery(value.bedrooms, { integer: true, min: 1, max: 100 });
  const minPrice = numericQuery(value.min_price, { integer: true, min: 0, max: 1_000_000_000 });
  const maxPrice = numericQuery(value.max_price, { integer: true, min: 0, max: 1_000_000_000 });
  const page = numericQuery(value.page, { integer: true, min: 1, max: 100_000 });
  const pageSize = numericQuery(value.page_size, { integer: true, min: 1, max: 50 });
  if (bedrooms != null) result.bedrooms = bedrooms;
  if (minPrice != null) result.min_price = minPrice;
  if (maxPrice != null) result.max_price = maxPrice;
  if (page != null) result.page = page;
  if (pageSize != null) result.page_size = pageSize;
  return result;
}

export function apartmentSearchQuery(search: ApartmentSearch): string {
  const params = new URLSearchParams();
  for (const key of searchTextKeys) {
    const value = search[key]?.trim();
    if (value) params.set(key, value.slice(0, 120));
  }
  if (search.property_type && apartmentPropertyTypes.includes(search.property_type)) params.set("property_type", search.property_type);
  for (const key of ["bedrooms", "min_price", "max_price", "page", "page_size"] as const) {
    const value = search[key];
    const maximum = key === "page_size" ? 50 : key === "bedrooms" ? 100 : key === "page" ? 100_000 : 1_000_000_000;
    const minimum = key === "bedrooms" || key === "page" || key === "page_size" ? 1 : 0;
    if (value != null && Number.isInteger(value) && value >= minimum && value <= maximum) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function apartmentCollection(value: unknown): ApartmentCollection {
  const data = record(value);
  const base = collection(value, apartment);
  const filters = record(data.filters);
  if (!Array.isArray(filters.property_types)) throw new ShidaApiError("malformed");
  const page = integer(data.page, true)!;
  const pageSize = integer(data.page_size, true)!;
  if (page < 1 || pageSize < 1 || pageSize > 50) throw new ShidaApiError("malformed");
  return {
    ...base,
    total: integer(data.total, true)!,
    page,
    page_size: pageSize,
    filters: { property_types: filters.property_types.map(propertyType).filter((item): item is ApartmentPropertyType => item !== null) },
  };
}

export async function getApartments(search: ApartmentSearch = {}): Promise<ApartmentCollection> {
  return apartmentCollection(await request(`/api/public/shida/apartments${apartmentSearchQuery(search)}`, 60));
}

export async function getHotels(): Promise<PublicCollection<HotelListing>> {
  return collection(await request("/api/public/shida/hotels", 60), hotel);
}

export const getApartment = cache(async (slug: string): Promise<ApartmentListing> =>
  apartment(await request(`/api/public/shida/apartments/${encodeURIComponent(slug)}`, false)),
);

export const getApartmentOwner = cache(async (refOrSlug: string): Promise<PublicApartmentOwnerProfile> =>
  apartmentOwnerProfile(await request(`/api/public/shida/apartment-owners/${encodeURIComponent(refOrSlug)}`, false)),
);

export const getHotel = cache(async (slug: string): Promise<HotelListing> =>
  hotel(await request(`/api/public/shida/hotels/${encodeURIComponent(slug)}`, false)),
);

export async function getWenzeStores(search:WenzeSearch={}):Promise<PublicCollection<WenzeStore>> { const params=new URLSearchParams(); for(const key of ["query","city","area","category"] as const){const value=search[key]?.trim();if(value)params.set(key,value.slice(0,120));} if(search.limit&&Number.isInteger(search.limit)&&search.limit>0&&search.limit<=50)params.set("limit",String(search.limit)); const suffix=params.size?`?${params}`:""; return collection(await request(`/api/public/shida/wenze/stores${suffix}`,60),(v)=>wenzeStore(v)); }
export const getWenzeStore=cache(async(key:string)=>wenzeStore(await request(`/api/public/shida/wenze/stores/${encodeURIComponent(key)}`,false),true));
export const getWenzeProduct=cache(async(key:string)=>wenzeProduct(await request(`/api/public/shida/wenze/products/${encodeURIComponent(key)}`,false)));
