export type PublicCollection<T> = {
  items: T[];
  count: number;
};

export const apartmentPropertyTypes = [
  "apartment", "house", "studio", "room", "office", "commercial", "land", "other",
] as const;

export type ApartmentPropertyType = (typeof apartmentPropertyTypes)[number];

export type ApartmentSearch = {
  query?: string;
  city?: string;
  area?: string;
  property_type?: ApartmentPropertyType;
  bedrooms?: number;
  min_price?: number;
  max_price?: number;
  page?: number;
  page_size?: number;
};

export type PublicApartmentOwnerSummary = {
  public_ref: string;
  slug: string | null;
  public_name: string;
  city: string | null;
  area: string | null;
  active_listing_count: number | null;
  public_detail_url: string | null;
};

export type PublicImage = {
  url: string;
  alt: string | null;
};

export type ApartmentListing = {
  public_ref: string;
  slug: string;
  title: string;
  city: string | null;
  area: string | null;
  commune: string | null;
  quartier: string | null;
  rent: number | null;
  currency: string | null;
  number_of_rooms: number | null;
  description: string | null;
  property_type: ApartmentPropertyType | null;
  availability_state: string | null;
  images: PublicImage[];
  owner: PublicApartmentOwnerSummary | null;
  public_detail_url: string;
  visit_url: string | null;
};

export type ApartmentCollection = PublicCollection<ApartmentListing> & {
  total: number;
  page: number;
  page_size: number;
  filters: { property_types: ApartmentPropertyType[] };
};

export type PublicApartmentOwnerProfile = {
  public_ref: string;
  slug: string | null;
  public_name: string;
  city: string | null;
  area: string | null;
  description: string | null;
  active_apartment_count: number;
  apartments: ApartmentListing[];
  public_detail_url: string | null;
};

export type HotelRoomType = {
  name: string;
  price: number | null;
  currency: string | null;
  rental_period: string | null;
  capacity: number | null;
  total_rooms: number | null;
  image_reference: string | null;
  image_references: string[];
  description: string | null;
};

export type HotelListing = {
  public_ref: string;
  slug: string;
  name: string;
  description: string | null;
  country_code: string | null;
  city: string | null;
  area: string | null;
  commune: string | null;
  quartier: string | null;
  address_line: string | null;
  landmark: string | null;
  room_types: HotelRoomType[];
  public_detail_url: string;
  booking_url: string | null;
};

export type WenzeImage = PublicImage & { display_order: number };
export type WenzeProductVariant = { public_ref:string; label:string; variant_type:string|null; stock_quantity:number|null; available_stock:number|null; is_available:boolean; buy_url:string|null };
export type WenzeFulfillment = { methods:Array<"pickup"|"delivery">; delivery:{ fee_type:"free"|"fixed"|null; fee:string|null; currency:string|null; areas:string[] }|null };
export type WenzeStoreSummary = { public_ref:string; slug:string|null; name:string; description:string|null; category:string|null; country_code:string|null; city:string|null; area:string|null; commune:string|null; quartier:string|null; address:string|null; landmark:string|null; public_detail_url:string; whatsapp_url:string|null; fulfillment:WenzeFulfillment };
export type WenzeProduct = { public_ref:string; slug:string|null; name:string; description:string|null; category:string|null; price:string|null; currency:string|null; price_negotiable:boolean; available_stock:number|null; has_variants:boolean; variant_type:string|null; variants:WenzeProductVariant[]; images:WenzeImage[]; public_detail_url:string; buy_url:string|null; store:WenzeStoreSummary|null; fulfillment:WenzeFulfillment };
export type WenzeStore = WenzeStoreSummary & { products:WenzeProduct[] };
export type WenzeSearch = { query?:string; city?:string; area?:string; category?:string; limit?:number };
