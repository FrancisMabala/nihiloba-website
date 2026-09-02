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
  JobCollection, JobSearch, PublicEntityActions, PublicJob, PublicJobEmployer, PublicJobEmployerSummary, PublicJobLifecycle, PublicJobLocation, PublicJobSummary,
  PublicService, PublicServiceProvider, PublicServiceSummary, ServiceAvailability, ServiceAvailabilitySlot,
  ServiceCollection, ServiceLocation, ServiceOffering, ServiceRating, ServiceSearch, ServiceReviewCollection,
  WenzeFulfillment, WenzeImage, WenzeProduct, WenzeProductVariant, WenzeSearch, WenzeStore, WenzeStoreSummary, WenzeStoreType,
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
function optionalImage(value:unknown):PublicImage|null { return value==null?null:image(value); }
function serviceLocation(value:unknown):ServiceLocation { const item=record(value); const visibility=text(item.address_visibility,true); if(visibility!=="public"&&visibility!=="private")throw new ShidaApiError("malformed"); return {country_code:text(item.country_code),city:text(item.city),area:text(item.area),commune:text(item.commune),quartier:text(item.quartier),address_visibility:visibility,address:visibility==="public"?text(item.address):null,landmark:visibility==="public"?text(item.landmark):null}; }
function serviceRating(value:unknown):ServiceRating { const item=record(value); const average=number(item.average_rating),count=integer(item.rating_count,true)!; if(average!=null&&(average<0||average>5))throw new ShidaApiError("malformed"); return {average_rating:average,rating_count:count}; }
function serviceOffering(value:unknown):ServiceOffering { const item=record(value); return {public_ref:text(item.public_ref,true)!,name:text(item.name,true)!,duration_minutes:integer(item.duration_minutes),price:text(item.price),currency:text(item.currency),description:text(item.description),booking_url:text(item.booking_url)}; }
function availabilityMode(value:unknown):"time_slots"|"flexible" { if(value!=="time_slots"&&value!=="flexible")throw new ShidaApiError("malformed"); return value; }
function serviceSummary(value:unknown):PublicServiceSummary { const item=record(value),provider=record(item.provider); return {public_ref:text(item.public_ref,true)!,slug:text(item.slug,true)!,provider:{public_ref:text(provider.public_ref,true)!,slug:text(provider.slug,true)!,name:text(provider.name,true)!,profile_image:optionalImage(provider.profile_image)},service_name:text(item.service_name,true)!,category:text(item.category,true)!,short_description:text(item.short_description),duration_minutes:integer(item.duration_minutes),starting_price:item.starting_price==null?null:serviceOffering(item.starting_price),location:serviceLocation(item.location),location_type:text(item.location_type),external_intervention_available:flag(item.external_intervention_available),availability_mode:availabilityMode(item.availability_mode),rating:serviceRating(item.rating),image_preview:optionalImage(item.image_preview),public_detail_url:text(item.public_detail_url,true)!,booking_url:text(item.booking_url)}; }
function service(value:unknown):PublicService { const item=record(value),base=serviceSummary(value); if(!Array.isArray(item.offerings)||!Array.isArray(item.images))throw new ShidaApiError("malformed"); return {...base,description:text(item.description),offerings:item.offerings.map(serviceOffering),images:item.images.map(image),social_link:text(item.social_link),completion_mode:text(item.completion_mode),availability_endpoint:text(item.availability_endpoint,true)!}; }
function serviceProvider(value:unknown):PublicServiceProvider { const item=record(value); if(!Array.isArray(item.categories)||!Array.isArray(item.services))throw new ShidaApiError("malformed"); return {public_ref:text(item.public_ref,true)!,slug:text(item.slug,true)!,name:text(item.name,true)!,profile_image:optionalImage(item.profile_image),location:serviceLocation(item.location),categories:item.categories.map((v)=>text(v,true)!),service_count:integer(item.service_count,true)!,rating:serviceRating(item.rating),services:item.services.map(serviceSummary)}; }
function serviceSlot(value:unknown):ServiceAvailabilitySlot { const item=record(value); return {date:text(item.date,true)!,start_time:text(item.start_time,true)!,end_time:text(item.end_time,true)!,is_available:flag(item.is_available),booking_url:text(item.booking_url)}; }
function serviceAvailability(value:unknown):ServiceAvailability { const item=record(value); if(!Array.isArray(item.slots))throw new ShidaApiError("malformed"); return {service_ref:text(item.service_ref,true)!,offering_ref:text(item.offering_ref),availability_mode:availabilityMode(item.availability_mode),requested_time_requires_provider_confirmation:flag(item.requested_time_requires_provider_confirmation),from:text(item.from),to:text(item.to),slots:item.slots.map(serviceSlot),booking_url:text(item.booking_url)}; }
function publicRef(value:unknown,prefix?:string):string { const parsed=text(value,true)!;const pattern=prefix?new RegExp(`^${prefix}_[A-Za-z0-9_-]+$`):/^[A-Z][A-Z0-9]*_[A-Za-z0-9_-]+$/;if(!pattern.test(parsed))throw new ShidaApiError("malformed");return parsed; }
function jobEmployer(value:unknown):PublicJobEmployerSummary { const item=record(value),identity=text(item.identity_type)??"shida_employer";if(identity!=="shida_employer"&&identity!=="organization_directory")throw new ShidaApiError("malformed");return {public_ref:publicRef(item.public_ref),slug:text(item.slug),name:text(item.name,true)!,profile_image:optionalImage(item.profile_image),city:text(item.city),area:text(item.area),identity_type:identity}; }
function jobLocation(value:unknown):PublicJobLocation { const item=record(value);return {country_code:text(item.country_code),city:text(item.city),area:text(item.area),commune:text(item.commune),quartier:text(item.quartier),display:text(item.display)}; }
const jobLifecycleStates=["published","active","open","expired","archived","closed","source_invalid"] as const;
function lifecycle(value:unknown):PublicJobLifecycle { const parsed=text(value,true)!;if(!jobLifecycleStates.includes(parsed as PublicJobLifecycle))throw new ShidaApiError("malformed");return parsed as PublicJobLifecycle; }
function jobSummary(value:unknown):PublicJobSummary { const item=record(value),offerType=item.offer_type??"individual",origin=item.origin??"direct",relationships=record(item.relationship_capabilities??{can_save:true,save_target_type:"job",save_target_ref:item.public_ref,can_share:true,can_follow_employer:false,follow_target_type:null,follow_target_ref:null}),status=lifecycle(item.status),state=lifecycle(item.lifecycle_state??item.status),action=item.external_application_action==null?null:record(item.external_application_action);if((offerType!=="enterprise"&&offerType!=="individual")||(origin!=="direct"&&origin!=="external")||!Array.isArray(item.capabilities??[]))throw new ShidaApiError("malformed");let externalAction:null|{mode:"redirect"|"instructions";action:"redirect"|"instructions";endpoint:string}=null;if(action){const mode=text(action.mode,true),actionName=text(action.action,true),endpoint=text(action.endpoint,true)!;if((mode!=="redirect"&&mode!=="instructions")||actionName!==mode||!/^\/api\/public\/shida\/jobs\/JOB_[A-Za-z0-9_-]+\/external-action$/.test(endpoint))throw new ShidaApiError("malformed");externalAction={mode,action:actionName,endpoint};}const canSave=relationships.can_save,canShare=relationships.can_share,canFollow=relationships.can_follow_employer;if(typeof canSave!=="boolean"||typeof canShare!=="boolean"||typeof canFollow!=="boolean")throw new ShidaApiError("malformed");return {public_ref:publicRef(item.public_ref,"JOB"),slug:text(item.slug,true)!,title:text(item.title,true)!,offer_type:offerType,origin,capabilities:((item.capabilities??[]) as unknown[]).map((value)=>text(value,true)!),professional_category:text(item.professional_category),vacancies:integer(item.vacancies),contract_type:text(item.contract_type),seniority:text(item.seniority),work_mode:text(item.work_mode),work_schedule:text(item.work_schedule),application_deadline:text(item.application_deadline),employer:jobEmployer(item.employer),location:jobLocation(item.location),description_preview:text(item.description_preview),compensation:text(item.compensation),published_at:text(item.published_at),status,lifecycle_state:state,public_url:text(item.public_url,true)!,apply_url:text(item.apply_url),apply_label:text(item.apply_label,true)!,deadline_label:text(item.deadline_label),relationship_capabilities:{can_save:canSave,save_target_type:"job",save_target_ref:publicRef(relationships.save_target_ref,"JOB"),can_share:canShare,can_follow_employer:canFollow,follow_target_type:canFollow?"organization_directory":null,follow_target_ref:canFollow?publicRef(relationships.follow_target_ref):null},external_application_action:externalAction,external_verified_label:text(item.external_verified_label),external_verified:item.external_verified===true,application_available:item.application_available===undefined?status==="open":flag(item.application_available)}; }
function job(value:unknown):PublicJob { const item=record(value),requirements=record(item.requirements_document),salary=item.salary==null?null:record(item.salary),source=item.external_source==null?null:record(item.external_source);if(requirements.url!==null||typeof requirements.available!=="boolean")throw new ShidaApiError("malformed");let externalSource:PublicJob["external_source"]=null;if(source){const mode=text(source.application_mode,true);if(mode!=="redirect"&&mode!=="instructions"&&mode!=="email_assisted")throw new ShidaApiError("malformed");externalSource={explanation:text(source.explanation,true)!,canonical_url:text(source.canonical_url),source_label:text(source.source_label,true)!,application_mode:mode,application_instructions:text(source.application_instructions),email_assisted_available:source.email_assisted_available===true};}return {...jobSummary(value),description:text(item.description),short_summary:text(item.short_summary),workplace_reference:text(item.workplace_reference),start_date:text(item.start_date),benefits:text(item.benefits),salary:salary?{minimum:text(salary.minimum),maximum:text(salary.maximum),currency:text(salary.currency),period:text(salary.period)}:null,requirements_document:{available:requirements.available,url:null},public_social_link:text(item.public_social_link),external_source:externalSource}; }
function jobEmployerDetail(value:unknown):PublicJobEmployer { const item=record(value);if(!Array.isArray(item.jobs))throw new ShidaApiError("malformed");return {...jobEmployer(value),description:text(item.description),open_job_count:integer(item.open_job_count,true)!,jobs:item.jobs.map(jobSummary)}; }
function entityActions(value:unknown):PublicEntityActions { const item=record(value);if(typeof item.can_save_in_shida!=="boolean"||typeof item.can_follow_in_shida!=="boolean")throw new ShidaApiError("malformed");return {target_type:text(item.target_type,true)!,public_ref:publicRef(item.public_ref),can_save_in_shida:item.can_save_in_shida,can_follow_in_shida:item.can_follow_in_shida,save_url:text(item.save_url),follow_url:text(item.follow_url)}; }
function wenzeImage(value:unknown):WenzeImage { const item=record(value); return {url:text(item.url,true)!,alt:text(item.alt),display_order:integer(item.display_order)??0}; }
function wenzeVariant(value:unknown):WenzeProductVariant { const item=record(value); return {public_ref:text(item.public_ref,true)!,label:text(item.label,true)!,variant_type:text(item.variant_type),stock_quantity:integer(item.stock_quantity),available_stock:integer(item.available_stock),is_available:flag(item.is_available),buy_url:text(item.buy_url)}; }
function wenzeFulfillment(value:unknown):WenzeFulfillment { if(value==null)return{methods:[],delivery:null};const item=record(value);if(!Array.isArray(item.methods))throw new ShidaApiError("malformed");const methods=item.methods.map((method)=>{if(method!=="pickup"&&method!=="delivery")throw new ShidaApiError("malformed");return method});let delivery:WenzeFulfillment["delivery"]=null;if(item.delivery!=null){const data=record(item.delivery),feeType=text(data.fee_type),areas=data.areas??[];if(feeType!==null&&feeType!=="free"&&feeType!=="fixed"||!Array.isArray(areas))throw new ShidaApiError("malformed");delivery={fee_type:feeType,fee:text(data.fee),currency:text(data.currency),areas:areas.map((area)=>text(area,true)!)};}return{methods:[...new Set(methods)],delivery}; }
function wenzeStoreType(value:unknown):WenzeStoreType|null { if(value==null)return null;if(value==="online_only"||value==="online_and_physical")return value;throw new ShidaApiError("malformed"); }
function wenzeStore(value:unknown, detail=false):WenzeStore { const item=record(value); const products=item.products??[]; if(!Array.isArray(products)) throw new ShidaApiError("malformed"); const base:WenzeStoreSummary={public_ref:text(item.public_ref,true)!,slug:text(item.slug),name:text(item.name,true)!,description:text(item.description),category:text(item.category),store_type:wenzeStoreType(item.store_type),country_code:text(item.country_code),city:text(item.city),area:text(item.area),commune:text(item.commune),quartier:text(item.quartier),address:text(item.address),landmark:text(item.landmark),public_detail_url:text(item.public_detail_url,true)!,whatsapp_url:text(item.whatsapp_url),order_url:text(item.order_url),fulfillment:wenzeFulfillment(item.fulfillment)}; return {...base,products:detail?products.map((p)=>wenzeProduct(p)):[]}; }
function wenzeProduct(value:unknown):WenzeProduct { const item=record(value),variants=item.variants??[]; if(!Array.isArray(item.images)||!Array.isArray(variants)) throw new ShidaApiError("malformed"); return {public_ref:text(item.public_ref,true)!,slug:text(item.slug),name:text(item.name,true)!,description:text(item.description),category:text(item.category),price:text(item.price),currency:text(item.currency),price_negotiable:flag(item.price_negotiable),available_stock:integer(item.available_stock),has_variants:item.has_variants===undefined?variants.length>0:flag(item.has_variants),variant_type:text(item.variant_type),variants:variants.map(wenzeVariant),images:item.images.map(wenzeImage).sort((a,b)=>a.display_order-b.display_order),public_detail_url:text(item.public_detail_url,true)!,buy_url:text(item.buy_url),store:item.store==null?null:wenzeStore(item.store),fulfillment:wenzeFulfillment(item.fulfillment)}; }

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

const serviceSearchKeys = ["query", "city", "area", "commune", "category", "location_type"] as const;
export function parseServiceSearchParams(value:ApartmentRawSearchParams):ServiceSearch { const result:ServiceSearch={}; for(const key of serviceSearchKeys){const parsed=firstQueryValue(value[key]);if(parsed)result[key]=parsed;} const rating=numericQuery(value.min_rating,{min:0,max:5}),page=numericQuery(value.page,{integer:true,min:1,max:100_000}),size=numericQuery(value.page_size,{integer:true,min:1,max:50}); if(rating!=null)result.min_rating=rating;if(page!=null)result.page=page;if(size!=null)result.page_size=size;return result; }
export function serviceSearchQuery(search:ServiceSearch):string { const params=new URLSearchParams();for(const key of serviceSearchKeys){const value=search[key]?.trim();if(value)params.set(key,value.slice(0,120));} if(search.min_rating!=null&&search.min_rating>=0&&search.min_rating<=5)params.set("min_rating",String(search.min_rating));if(search.page&&Number.isInteger(search.page)&&search.page>0)params.set("page",String(search.page));if(search.page_size&&Number.isInteger(search.page_size)&&search.page_size>0&&search.page_size<=50)params.set("page_size",String(search.page_size));return params.size?`?${params}`:""; }
function serviceCollection(value:unknown):ServiceCollection { const data=record(value),base=collection(value,serviceSummary),page=integer(data.page,true)!,size=integer(data.page_size,true)!;if(page<1||size<1||size>50)throw new ShidaApiError("malformed");return {...base,total:integer(data.total,true)!,page,page_size:size}; }
export async function getServices(search:ServiceSearch={}):Promise<ServiceCollection> { return serviceCollection(await request(`/api/public/shida/services${serviceSearchQuery(search)}`,60)); }
export const getService=cache(async(key:string):Promise<PublicService>=>service(await request(`/api/public/shida/services/${encodeURIComponent(key)}`,false)));
export const getServiceProvider=cache(async(key:string):Promise<PublicServiceProvider>=>serviceProvider(await request(`/api/public/shida/services/providers/${encodeURIComponent(key)}`,false)));
export async function getServiceAvailability(key:string,from:string,to:string,offeringRef?:string):Promise<ServiceAvailability> { const params=new URLSearchParams({from,to});if(offeringRef)params.set("offering",offeringRef);return serviceAvailability(await request(`/api/public/shida/services/${encodeURIComponent(key)}/availability?${params}`,false)); }
export async function getServiceReviews(key:string,page=1,pageSize=10):Promise<ServiceReviewCollection> { const data=record(await request(`/api/public/shida/services/${encodeURIComponent(key)}/reviews?page=${page}&page_size=${pageSize}`,60)),base=collection(data,(value)=>{const item=record(value),rating=integer(item.rating,true)!,display=text(item.reviewer_display,true);if(rating<1||rating>5||display!=="verified_customer")throw new ShidaApiError("malformed");return {rating,comment:text(item.comment,true)!,reviewer_display:"verified_customer" as const,created_at:text(item.created_at)};});return {...base,total:integer(data.total,true)!,page:integer(data.page,true)!,page_size:integer(data.page_size,true)!}; }

const jobSearchKeys=["query","city","area","commune"] as const;
export function parseJobSearchParams(value:ApartmentRawSearchParams):JobSearch { const result:JobSearch={};for(const key of jobSearchKeys){const parsed=firstQueryValue(value[key]);if(parsed)result[key]=parsed;}const page=numericQuery(value.page,{integer:true,min:1,max:100_000}),size=numericQuery(value.page_size,{integer:true,min:1,max:50});if(page!=null)result.page=page;if(size!=null)result.page_size=size;return result; }
export function jobSearchQuery(search:JobSearch):string { const params=new URLSearchParams();for(const key of jobSearchKeys){const value=search[key]?.trim();if(value)params.set(key,value.slice(0,120));}if(search.page&&Number.isInteger(search.page)&&search.page>0)params.set("page",String(search.page));if(search.page_size&&Number.isInteger(search.page_size)&&search.page_size>0&&search.page_size<=50)params.set("page_size",String(search.page_size));return params.size?`?${params}`:""; }
function jobCollection(value:unknown):JobCollection { const item=record(value),pagination=record(item.pagination);if(!Array.isArray(item.items))throw new ShidaApiError("malformed");const page=integer(pagination.page,true)!,pageSize=integer(pagination.page_size,true)!,totalItems=integer(pagination.total_items,true)!,totalPages=integer(pagination.total_pages,true)!;if(page<1||pageSize<1||pageSize>50)throw new ShidaApiError("malformed");return {items:item.items.map(jobSummary),pagination:{page,page_size:pageSize,total_items:totalItems,total_pages:totalPages}}; }
export async function getJobs(search:JobSearch={},language:"en"|"fr"="en"):Promise<JobCollection> { const query=new URLSearchParams(jobSearchQuery(search).slice(1));query.set("language",language);return jobCollection(await request(`/api/public/shida/jobs?${query}`,60)); }
export const getJob=cache(async(key:string,language:"en"|"fr"="en"):Promise<PublicJob>=>job(await request(`/api/public/shida/jobs/${encodeURIComponent(key)}?language=${language}`,false)));
export const getJobEmployer=cache(async(key:string):Promise<PublicJobEmployer>=>jobEmployerDetail(await request(`/api/public/shida/jobs/employers/${encodeURIComponent(key)}`,false)));
export const getPublicEntityActions=cache(async(targetType:string,publicIdentity:string):Promise<PublicEntityActions>=>entityActions(await request(`/api/public/shida/entity-actions/${encodeURIComponent(targetType)}/${encodeURIComponent(publicIdentity)}`,false)));
