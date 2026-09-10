import { request } from "./restaurant-seller-browser";

export type Fields = Record<string, unknown>;
export type Establishment = { public_ref: string; revision: string; status: string; profile: Record<string, string | null>; menu_currency: string | null; location_confirmed: boolean; missing_publication_fields: string[]; actions: string[]; preview?: Fields };
export type Page<T> = { items: T[]; total: number; page: number; page_size: number; actions?: string[] };
export type Row = Fields & { public_ref: string; name?: string; item?: Row; category?: Row; state?: string };
export type Envelope<T> = { revision: string; result: T; currency: string | null };
export type Window = { weekday: number; start: string; end: string };
export type Closure = { starts_at: string; ends_at: string; timezone_name?: string; confirmed_at?: string };
export type Hours = { schedule: { windows: Window[] } | null; exceptional_closures: Closure[]; status: string; timezone_name: string | null };
export type Kind = "create" | "profile" | "categories" | "items" | "offerings" | "copy" | "hours" | "publish" | "unpublish";
export type Operation = Readonly<{ path: string; method: string; body: string }>;
export const rootPath = () => "personal/restaurants";
export async function readRestaurant<T>(path: string, language: string, binding: string): Promise<T> {
  return await request(`${path}${path.includes("?") ? "&" : "?"}language=${language}`, {}, binding) as T;
}
export async function performRestaurant<T>(operation: Operation, binding: string): Promise<T> {
  return await request(operation.path, { method: operation.method, body: operation.body }, binding) as T;
}

// Monetary inputs stay decimal strings throughout. Quantities are never inferred.
export function money(value: string): string {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,16}(\.\d{1,2})?$/.test(normalized) || !/[1-9]/.test(normalized)) throw new Error("money");
  return normalized;
}
export function pricing(fields: Record<string, string>): Fields {
  const common = { pricing_model: fields.pricing_model, currency: fields.pricing_model === "UNKNOWN" ? null : fields.currency, unit_price: null, allowed_amounts: null, minimum_amount: null, sale_unit_label: null };
  if (fields.pricing_model === "UNIT_PRICED") return { ...common, unit_price: money(fields.unit_price), sale_unit_label: fields.sale_unit_label.trim() };
  if (fields.pricing_model === "AMOUNT_PRICED") return { ...common, allowed_amounts: fields.allowed_amounts.split(/[;\n]/).filter(s => s.trim()).map(money), minimum_amount: fields.minimum_amount ? money(fields.minimum_amount) : null };
  return common;
}
// Convert returned UTC instants for display/editing in the establishment zone.
// Include its matching offset so repeated DST clocks stay unambiguous.
export function localInstant(value: unknown, timezone: string | null): string {
  if (typeof value !== "string" || !value || !timezone) return "";
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "longOffset" }).formatToParts(date);
  const get = (name: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === name)?.value ?? "";
  const offset = get("timeZoneName").replace("GMT", "") || "+00:00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${offset}`;
}


