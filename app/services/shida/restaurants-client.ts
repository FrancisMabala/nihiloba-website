import { request, ShidaApiError } from "./public-client";
import { safePublicActionUrl, safePublicImageUrl } from "../../lib/safe-public-url";

export type RestaurantLocale = "en" | "fr" | "ln" | "sw";
export type RestaurantSearch = Record<string, string | string[] | undefined>;
const root = "/api/public/shida";
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ShidaApiError("malformed");
  return value as Record<string, unknown>;
}
function text(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function required(value: unknown): string { const result = text(value); if (!result) throw new ShidaApiError("malformed"); return result; }
function array(value: unknown): unknown[] { if (!Array.isArray(value)) throw new ShidaApiError("malformed"); return value; }
function integer(value: unknown): number { if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new ShidaApiError("malformed"); return value; }
function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (!choices.includes(value as T)) throw new ShidaApiError("malformed"); return value as T;
}
function reference(value: unknown): string { const result = required(value); if (!/^[A-Za-z0-9_-]+$/.test(result)) throw new ShidaApiError("malformed"); return result; }
function amount(value: unknown): string | null { if (value == null) return null; const result = required(value); if (!/^\d+(?:\.\d+)?$/.test(result)) throw new ShidaApiError("malformed"); return result; }
function identity(value: unknown) { const data = object(value); return { public_ref: reference(data.public_ref), name: text(data.name) }; }
function hours(value: unknown) {
  const data = object(value);
  const schedule = data.schedule == null ? null : object(data.schedule);
  return {
    timezone_name: text(data.timezone_name),
    status: choice(data.status, ["open", "closed", "unknown"]),
    basis: choice(data.basis, ["exceptional_closure", "weekly_schedule", "unknown"]),
    windows: schedule ? array(schedule.windows).map((value) => {
      const row = object(value), weekday = integer(row.weekday);
      const start = required(row.start), end = required(row.end);
      if (weekday > 6 || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(end)) throw new ShidaApiError("malformed");
      return { weekday, start, end };
    }) : [],
    closures: array(data.exceptional_closures ?? []).map((value) => { const row = object(value); return { starts_at: required(row.starts_at), ends_at: required(row.ends_at) }; }),
    evaluated_at: text(data.evaluated_at),
  };
}
export function parseRestaurant(value: unknown) {
  const data = object(value), location = object(data.location);
  const summary = data.menu_summary == null ? null : object(data.menu_summary);
  const logo = data.logo == null ? null : object(data.logo);
  return {
    ...identity(data), description: text(data.description), type_label: text(data.type_label),
    // Deliberately exclude all non-public fields, raw addresses, contact details and restriction reasons.
    location: [text(location.city), text(location.commune), text(location.quartier), ...(location.address_visibility === "public" ? [text(location.address), text(location.landmark)] : [])].filter((part): part is string => !!part).filter((part, index, all) => all.indexOf(part) === index).join(", "),
    hours: hours(data.hours), opening_information: text(data.opening_information),
    service_modes: array(data.service_modes ?? []).map(required),
    images: array(data.images ?? []).map((value) => { const row = object(value); return { url: safePublicImageUrl(text(row.url)), alt: text(row.alt) }; }).filter((image) => image.url),
    logo: logo ? { url: safePublicImageUrl(text(logo.url)), alt: text(logo.alt) } : null,
    menu_summary: summary ? { available: integer(summary.available_count), sold_out: integer(summary.sold_out_count), temporarily_unavailable: integer(summary.temporarily_unavailable_count) } : null,
    owning_business: data.owning_business == null ? null : identity(data.owning_business),
  };
}
export type Restaurant = ReturnType<typeof parseRestaurant>;
export function parseMenuItem(value: unknown) {
  const data = object(value), category = object(data.category);
  if (data.visible !== true || category.visible !== true) throw new ShidaApiError("malformed");
  const dated = data.dated_offering == null ? null : object(data.dated_offering);
  if (dated && dated.state !== "current") throw new ShidaApiError("malformed");
  return {
    ...identity(data), establishment_ref: reference(data.establishment_ref),
    category: identity(category), description: text(data.description), image_url: safePublicImageUrl(text(data.image_url)),
    presentation: choice(data.presentation, ["fixed_dish", "component"]),
    pricing_model: choice(data.pricing_model, ["UNKNOWN", "UNIT_PRICED", "AMOUNT_PRICED"]),
    currency: data.currency == null ? null : choice(data.currency, ["CDF", "USD"]),
    unit_price: amount(data.unit_price), allowed_amounts: data.allowed_amounts == null ? [] : array(data.allowed_amounts).map((value) => { const result = amount(value); if (result === null) throw new ShidaApiError("malformed"); return result; }), minimum_amount: amount(data.minimum_amount),
    sale_unit_label: text(data.sale_unit_label), availability: choice(data.availability, ["available", "sold_out", "temporarily_unavailable"]),
    dated_offering: dated ? { starts_at: required(dated.starts_at), ends_at: required(dated.ends_at), timezone_name: required(dated.timezone_name) } : null,
  };
}
export type RestaurantMenuItem = ReturnType<typeof parseMenuItem>;
function envelope<T>(value: unknown, parser: (value: unknown) => T) {
  const data = object(value), page = integer(data.page), page_size = integer(data.page_size);
  if (page < 1 || page_size < 1 || page_size > 50) throw new ShidaApiError("malformed");
  return { items: array(data.items).map(parser), total: integer(data.total), page, page_size };
}
export function restaurantQuery(raw: RestaurantSearch): URLSearchParams {
  const result = new URLSearchParams();
  for (const key of ["query", "name", "city", "area", "food_type", "service_mode", "dish"]) {
    const value = raw[key], first = Array.isArray(value) ? value[0] : value;
    if (first?.trim()) result.set(key, first.trim().slice(0, 200));
  }
  if (raw.open_now === "true") result.set("open_now", "true");
  const page = Array.isArray(raw.page) ? raw.page[0] : raw.page;
  if (page && /^\d+$/.test(page) && Number.isSafeInteger(Number(page)) && Number(page) > 0) result.set("page", String(Number(page)));
  return result;
}
function query(locale: RestaurantLocale, params = new URLSearchParams()) { const result = new URLSearchParams(params); result.set("language", locale); return `?${result}`; }
export async function getRestaurants(locale: RestaurantLocale, raw: RestaurantSearch) {
  const data = object(await request(`${root}/restaurants${query(locale, restaurantQuery(raw))}`, false));
  return { ...envelope(data, parseRestaurant), service_mode_options: array(data.service_mode_options ?? []).map(required) };
}
export async function getRestaurant(locale: RestaurantLocale, id: string) { return parseRestaurant(await request(`${root}/restaurants/${encodeURIComponent(id)}${query(locale)}`, false)); }
export async function getRestaurantMenu(locale: RestaurantLocale, id: string, page = "1") {
  const data = object(await request(`${root}/restaurants/${encodeURIComponent(id)}/menu${query(locale, restaurantQuery({ page }))}`, false));
  if (data.establishment_ref !== id) throw new ShidaApiError("malformed");
  const result = envelope(data, parseMenuItem);
  if (result.items.some((item) => item.establishment_ref !== id)) throw new ShidaApiError("malformed");
  return { ...result, hours: hours(data.hours) };
}
export async function getRestaurantActions(locale: RestaurantLocale, id: string) {
  const data = object(await request(`${root}/entity-actions/restaurant/${encodeURIComponent(id)}${query(locale)}`, false));
  if (data.public_ref !== id || data.target_type !== "restaurant") throw new ShidaApiError("malformed");
  return {
    save: data.can_save_in_shida === true ? safePublicActionUrl(text(data.save_url)) : null,
    follow: data.can_follow_in_shida === true ? safePublicActionUrl(text(data.follow_url)) : null,
    share: data.link_destination_available === true ? safePublicActionUrl(text(data.share_url)) : null,
    menu: data.link_destination_available === true ? safePublicActionUrl(text(data.menu_share_url)) : null,
  };
}
export function parseBusiness(value: unknown) {
  const data = object(value);
  return { ...identity(data), activities: envelope(data.activities, (value) => {
    const activity = object(value);
    return { ...identity(activity), marketplace: choice(activity.marketplace, ["restaurants", "services", "wenze", "jobs"]) };
  }) };
}
export async function getRestaurantBusiness(locale: RestaurantLocale, id: string, page = "1") {
  const result = parseBusiness(await request(`${root}/businesses/${encodeURIComponent(id)}${query(locale, restaurantQuery({ page }))}`, false));
  if (result.public_ref !== id) throw new ShidaApiError("malformed");
  return result;
}
