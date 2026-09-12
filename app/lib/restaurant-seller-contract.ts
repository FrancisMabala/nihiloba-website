import { isOrderPath, orderRoutes, validOrderBody, validOrderQuery } from './restaurant-orders-contract';
// Exact Personal seller surface, not a general Dashboard proxy.
export const sellerRoutes: [RegExp, readonly string[]][] = [
  ...orderRoutes,
  [/^RST_[A-Za-z0-9_-]+\/menu-preview$/, ["GET"]],
  [/^$/, ["GET", "POST"]],
  [/^RST_[A-Za-z0-9_-]+$/, ["GET", "PATCH"]],
  [/^RST_[A-Za-z0-9_-]+\/preview$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/lifecycle\/(publish|unpublish)$/, ["POST"]],
  [/^RST_[A-Za-z0-9_-]+\/menu\/(categories|items|offerings)$/, ["GET", "POST"]],
  [/^RST_[A-Za-z0-9_-]+\/menu\/categories\/RMC_[A-Za-z0-9_-]+$/, ["GET", "PATCH"]],
  [/^RST_[A-Za-z0-9_-]+\/menu\/items\/RMI_[A-Za-z0-9_-]+$/, ["GET", "PATCH"]],
  [/^RST_[A-Za-z0-9_-]+\/menu\/offerings\/RDO_[A-Za-z0-9_-]+$/, ["GET", "PATCH"]],
  [/^RST_[A-Za-z0-9_-]+\/hours$/, ["GET", "PUT"]],
  [/^RST_[A-Za-z0-9_-]+\/links\/(restaurant|menu)$/, ["POST"]],
];
export const profileKeys = ["name", "description", "food_business_type", "city", "commune", "quartier", "public_address", "landmark", "address_visibility", "timezone_name", "opening_information", "service_modes", "logo_url", "logo_secure_url"];
export const itemKeys = ["name", "description", "image_url", "category_ref", "presentation", "pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount", "visible", "availability", "permanent"];
export function allowedSellerRoute(path: string, method: string): boolean {
  return path.length < 400 && sellerRoutes.some(([pattern, methods]) => pattern.test(path) && methods.includes(method));
}
export function validSellerQuery(path: string, method: string, query: URLSearchParams): boolean {
  if (isOrderPath(path)) return validOrderQuery(path, method, query);
  const preview = path.endsWith("/menu-preview");
  const list = preview || method === "GET" && (!path || /\/menu\/(categories|items|offerings)$/.test(path));
  const allowed = /\/links\//.test(path) ? [] : ["language", ...(list ? ["page", "page_size", ...(!path ? ["status"] : [])] : [])];
  for (const [key, value] of query) {
    if (!allowed.includes(key) || query.getAll(key).length !== 1) return false;
    if (key === "language" && !["en", "fr", "ln", "sw"].includes(value)) return false;
    if (key === "status" && !["draft", "active", "inactive"].includes(value)) return false;
    if (["page", "page_size"].includes(key) && (!/^[1-9]\d{0,6}$/.test(value) || (key === "page_size" && Number(value) > (preview ? 5 : 50)))) return false;
  }
  return true;
}
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
export function validSellerBody(path: string, method: string, value: unknown): boolean {
  if (isOrderPath(path)) return validOrderBody(path, value);
  if (!object(value)) return false;
  const create = path === "";
  const lifecycle = path.includes("/lifecycle/");
  const profile = !create && !path.includes("/");
  const keys = create ? ["operation_key", "name", "food_business_type", "description", "city", "commune", "quartier", "opening_information", "service_modes"] : lifecycle ? ["expected_updated_at"] : ["expected_updated_at", "fields", ...(profile ? [] : ["operation_key"])];
  if (Object.keys(value).some(key => !keys.includes(key))) return false;
  if (!create && (typeof value.expected_updated_at !== "string" || !value.expected_updated_at || value.expected_updated_at.length > 64)) return false;
  if ((create || (!lifecycle && !profile)) && (typeof value.operation_key !== "string" || !value.operation_key || value.operation_key.length > 200)) return false;
  if (create) return typeof value.name === "string" && !!value.name.trim() && typeof value.food_business_type === "string";
  if (lifecycle) return true;
  if (!object(value.fields) || !Object.keys(value.fields).length) return false;
  const allowed = profile ? [...profileKeys, "confirm_location"] : path.includes("/categories") ? ["name", "visible"] : path.includes("/items") ? itemKeys : path.includes("/offerings") ? ["item_ref", "starts_at", "ends_at", "visible", "availability", "confirm", ...(method === "POST" ? ["copy_from"] : [])] : ["windows", "closures", "confirm"];
  return Object.keys(value.fields).every(key => allowed.includes(key));
}

export const sellerErrorCodes = new Set(["restaurant_stale", "restaurant_idempotency_conflict", "restaurant_incomplete", "restaurant_location_confirmation_required", "restaurant_invalid_profile", "restaurant_menu_invalid", "restaurant_menu_currency_conflict", "restaurant_operation_key_required", "restaurant_time_invalid", "restaurant_time_ambiguous", "restaurant_time_overlap", "restaurant_time_expired", "restaurant_time_confirmation_required", "restaurant_timezone_unavailable", "restaurant_hours_timezone_conflict", "restaurant_invalid_input", "restaurant_unavailable", "restaurant_destination_unavailable"]);

export function validShare(value: unknown, ref: string, destination: string): value is { establishment_ref: string; destination: string; public_url: string; qr_content: string } {
  if (!object(value) || value.establishment_ref !== ref || value.destination !== destination) return false;
  return [value.public_url, value.qr_content].every(input => {
    if (typeof input !== "string" || input.length > 2048) return false;
    try { const url = new URL(input); return ["https://api.nihiloba.com", "https://nihiloba.com"].includes(url.origin) && /^\/go\/[A-Za-z0-9_-]+$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password; } catch { return false; }
  });
}

for (const code of ['restaurant_feed_refresh_required','restaurant_quote_changed','restaurant_order_state_conflict','restaurant_operation_expired','restaurant_intake_closed','restaurant_category_review_required','restaurant_item_review_required','restaurant_selection_invalid','restaurant_confirmation_required','restaurant_reason_required','restaurant_order_unknown_price','restaurant_order_item_unavailable']) sellerErrorCodes.add(code);

for (const code of ["restaurant_window_past", "restaurant_window_bounds", "restaurant_window_hours", "restaurant_window_closure", "restaurant_time_invalid", "restaurant_time_ambiguous", "restaurant_timezone_unavailable", "restaurant_time_overlap", "restaurant_stale", "restaurant_intake_closed"]) sellerErrorCodes.add(code);
