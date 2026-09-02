export type PublicCollection<T> = {
  items: T[];
  count: number;
};

export const serviceCategories = [
  "beauty_wellness", "health", "home_housing", "repair_maintenance", "transport",
  "education_training", "photo_video", "food_catering", "restaurant",
  "professional_services", "public_services", "church_pastoral", "cleaning", "other",
] as const;

export type ServiceCategory = (typeof serviceCategories)[number];
export type ServiceSearch = {
  query?: string; city?: string; area?: string; commune?: string; category?: string;
  location_type?: string; min_rating?: number; page?: number; page_size?: number;
};
export type ServiceLocation = {
  country_code: string | null; city: string | null; area: string | null;
  commune: string | null; quartier: string | null; address_visibility: "public" | "private";
  address: string | null; landmark: string | null;
};
export type ServiceRating = { average_rating: number | null; rating_count: number };
export type ServiceProviderSummary = { public_ref: string; slug: string; name: string; profile_image: PublicImage | null };
export type ServiceOffering = { public_ref: string; name: string; duration_minutes: number | null; price: string | null; currency: string | null; description: string | null; booking_url: string | null };
export type PublicServiceSummary = {
  public_ref: string; slug: string; provider: ServiceProviderSummary; service_name: string;
  category: string; short_description: string | null; duration_minutes: number | null;
  starting_price: ServiceOffering | null; location: ServiceLocation; location_type: string | null;
  external_intervention_available: boolean; availability_mode: "time_slots" | "flexible";
  rating: ServiceRating; image_preview: PublicImage | null; public_detail_url: string; booking_url: string | null;
};
export type PublicService = PublicServiceSummary & {
  description: string | null; offerings: ServiceOffering[]; images: PublicImage[];
  social_link: string | null; completion_mode: string | null; availability_endpoint: string;
};
export type PublicServiceProvider = {
  public_ref: string; slug: string; name: string; profile_image: PublicImage | null;
  location: ServiceLocation; categories: string[]; service_count: number; rating: ServiceRating;
  services: PublicServiceSummary[];
};
export type ServiceCollection = PublicCollection<PublicServiceSummary> & { total: number; page: number; page_size: number };
export type ServiceAvailabilitySlot = { date: string; start_time: string; end_time: string; is_available: boolean; booking_url: string | null };
export type ServiceAvailability = {
  service_ref: string; offering_ref?: string | null; availability_mode: "time_slots" | "flexible";
  requested_time_requires_provider_confirmation: boolean; from: string | null; to: string | null;
  slots: ServiceAvailabilitySlot[]; booking_url: string | null;
};
export type PublicServiceReview = { rating: number; comment: string; reviewer_display: "verified_customer"; created_at: string | null };
export type ServiceReviewCollection = PublicCollection<PublicServiceReview> & { total: number; page: number; page_size: number };

export type JobSearch = {
  query?: string;
  city?: string;
  area?: string;
  commune?: string;
  page?: number;
  page_size?: number;
};

export type PublicJobOfferType = "enterprise" | "individual";
export type JobPromotionDuration = 7 | 14 | 30;
export type PublicJobPromotion = { duration_days: JobPromotionDuration; starts_at: string; ends_at: string };
export type PublicJobSalary = {
  minimum: string | null;
  maximum: string | null;
  currency: string | null;
  period: string | null;
};

export type PublicJobEmployerSummary = {
  public_ref: string;
  slug: string | null;
  name: string;
  profile_image: PublicImage | null;
  city: string | null;
  area: string | null;
  identity_type: "shida_employer" | "organization_directory";
};

export type PublicJobOrigin = "direct" | "external";
export type PublicJobLifecycle = "published" | "active" | "open" | "expired" | "archived" | "closed" | "source_invalid";
export type PublicJobExternalAction = {
  mode: "redirect" | "instructions";
  action: "redirect" | "instructions";
  endpoint: string;
};
export type PublicJobRelationships = {
  can_save: boolean;
  save_target_type: "job";
  save_target_ref: string;
  can_share: boolean;
  can_follow_employer: boolean;
  follow_target_type: "organization_directory" | null;
  follow_target_ref: string | null;
};
export type PublicEntityActions = {
  target_type: string;
  public_ref: string;
  can_save_in_shida: boolean;
  can_follow_in_shida: boolean;
  save_url: string | null;
  follow_url: string | null;
};

export type PublicJobLocation = {
  country_code: string | null;
  city: string | null;
  area: string | null;
  commune: string | null;
  quartier: string | null;
  display: string | null;
};

export type PublicJobSummary = {
  public_ref: string;
  slug: string;
  title: string;
  offer_type: PublicJobOfferType;
  origin: PublicJobOrigin;
  capabilities: string[];
  professional_category: string | null;
  vacancies: number | null;
  contract_type: string | null;
  seniority: string | null;
  work_mode: string | null;
  work_schedule: string | null;
  application_deadline: string | null;
  employer: PublicJobEmployerSummary;
  location: PublicJobLocation;
  description_preview: string | null;
  compensation: string | null;
  published_at: string | null;
  status: PublicJobLifecycle;
  lifecycle_state: PublicJobLifecycle;
  public_url: string;
  apply_url: string | null;
  apply_label: string;
  deadline_label: string | null;
  relationship_capabilities: PublicJobRelationships;
  external_application_action: PublicJobExternalAction | null;
  external_verified_label: string | null;
  external_verified: boolean;
  application_available: boolean;
};

export type PublicJob = PublicJobSummary & {
  description: string | null;
  short_summary: string | null;
  workplace_reference: string | null;
  start_date: string | null;
  benefits: string | null;
  salary: PublicJobSalary | null;
  requirements_document: { available: boolean; url: null };
  public_social_link: string | null;
  external_source: null | {
    explanation: string;
    canonical_url: string | null;
    source_label: string;
    application_mode: "redirect" | "instructions" | "email_assisted";
    application_instructions: string | null;
    email_assisted_available: boolean;
  };
};

export type PublicJobEmployer = PublicJobEmployerSummary & {
  description: string | null;
  open_job_count: number;
  jobs: PublicJobSummary[];
};

export type JobCollection = {
  items: PublicJobSummary[];
  pagination: { page: number; page_size: number; total_items: number; total_pages: number };
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
export type WenzeStoreType = "online_only" | "online_and_physical";
export type WenzeStoreSummary = { public_ref:string; slug:string|null; name:string; description:string|null; category:string|null; store_type?:WenzeStoreType|null; country_code:string|null; city:string|null; area:string|null; commune:string|null; quartier:string|null; address:string|null; landmark:string|null; public_detail_url:string; whatsapp_url:string|null; order_url?:string|null; fulfillment:WenzeFulfillment };
export type WenzeProduct = { public_ref:string; slug:string|null; name:string; description:string|null; category:string|null; price:string|null; currency:string|null; price_negotiable:boolean; available_stock:number|null; has_variants:boolean; variant_type:string|null; variants:WenzeProductVariant[]; images:WenzeImage[]; public_detail_url:string; buy_url:string|null; store:WenzeStoreSummary|null; fulfillment:WenzeFulfillment };
export type WenzeStore = WenzeStoreSummary & { products:WenzeProduct[] };
export type WenzeSearch = { query?:string; city?:string; area?:string; category?:string; limit?:number };
