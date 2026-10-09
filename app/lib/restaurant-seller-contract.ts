import { isOrderPath, orderRoutes, validOrderBody, validOrderQuery } from './restaurant-orders-contract';
// Exact Personal seller surface, not a general Dashboard proxy.
export const sellerRoutes: [RegExp, readonly string[]][] = [
  ...orderRoutes,
  [/^RST_[A-Za-z0-9_-]+\/capabilities$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/bindings$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/items$/, ["POST"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/items\/RII_[A-Za-z0-9_-]+$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/items\/RII_[A-Za-z0-9_-]+\/(movements|archive)$/, ["POST"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/items\/RII_[A-Za-z0-9_-]+\/history$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/inventory\/menu\/RMI_[A-Za-z0-9_-]+\/binding$/, ["POST"]],
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
  [/^RST_[A-Za-z0-9_-]+\/reviews$/, ["GET"]],
  [/^RST_[A-Za-z0-9_-]+\/reviews\/RVW_[A-Za-z0-9_-]+\/(response|report)$/, ["PUT", "POST"]],
  [/^RST_[A-Za-z0-9_-]+\/links\/(restaurant|menu)$/, ["POST"]],
];

function inventoryPath(path: string): boolean { return /^RST_[A-Za-z0-9_-]+\/inventory(?:\/|$)/.test(path); }
function validInventoryQuery(path: string, query: URLSearchParams): boolean {
  const listing = /\/inventory$/.test(path);
  const history = /\/history$/.test(path);
  const allowed = listing ? ["language", "page", "page_size"] : history ? ["language", "page_size", "before_id", "days"] : ["language"];
  for (const [key, value] of query) {
    if (!allowed.includes(key) || query.getAll(key).length !== 1) return false;
    if (key === "language" && !["fr", "en", "ln", "sw"].includes(value)) return false;
    if (key !== "language" && (!/^[1-9]\d{0,6}$/.test(value) || key === "page_size" && Number(value) > 50 || key === "days" && Number(value) > 730)) return false;
  }
  return true;
}
function inventoryObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function validInventoryBody(path: string, value: unknown): boolean {
  if (!inventoryObject(value)) return false;
  const keys = Object.keys(value);
  const operation = typeof value.operation_key === "string" && value.operation_key.length >= 1 && value.operation_key.length <= 200;
  const revision = Number.isSafeInteger(value.expected_revision) && Number(value.expected_revision) >= 1;
  const amount = (v: unknown) => typeof v === "string" && /^\d{1,15}(?:\.\d{1,3})?$/.test(v);
  if (/\/inventory\/items$/.test(path)) return operation && keys.every(k => ["operation_key", "name", "purpose", "unit", "opening_quantity", "display_label", "low_stock_threshold"].includes(k)) &&
    typeof value.name === "string" && !!value.name.trim() && value.name.length <= 160 && ["sellable", "ingredient"].includes(String(value.purpose)) &&
    ["piece", "portion", "boule", "bottle", "can", "tray", "g", "kg", "ml", "l"].includes(String(value.unit)) && amount(value.opening_quantity) &&
    (value.low_stock_threshold == null || amount(value.low_stock_threshold)) && (value.display_label == null || typeof value.display_label === "string" && value.display_label.length <= 80);
  if (/\/movements$/.test(path)) return operation && revision && keys.every(k => ["operation_key", "action", "amount", "expected_revision", "linked_movement_ref", "private_note"].includes(k)) &&
    ["stock_received", "preparation_produced", "manual_increase", "return_to_stock", "manual_issue", "waste", "spoilage", "damaged", "internal_use", "count"].includes(String(value.action)) && amount(value.amount) &&
    (value.linked_movement_ref == null || typeof value.linked_movement_ref === "string" && /^RIM_[A-Za-z0-9_-]+$/.test(value.linked_movement_ref)) &&
    (value.private_note == null || typeof value.private_note === "string" && value.private_note.length <= 500);
  if (/\/archive$/.test(path)) return operation && revision && keys.every(k => ["operation_key", "expected_revision"].includes(k));
  if (/\/binding$/.test(path)) return operation && keys.every(k => ["operation_key", "item_ref", "factor", "expected_revision", "active"].includes(k)) &&
    typeof value.item_ref === "string" && /^RII_[A-Za-z0-9_-]+$/.test(value.item_ref) && Number.isSafeInteger(value.factor) && Number(value.factor) > 0 &&
    Number.isSafeInteger(value.expected_revision) && Number(value.expected_revision) >= 0 && (value.active === undefined || typeof value.active === "boolean");
  return false;
}

export const profileKeys = ["name", "description", "food_business_type", "city", "commune", "quartier", "public_address", "landmark", "address_visibility", "timezone_name", "opening_information", "service_modes", "logo_url", "logo_secure_url"];
export const itemKeys = ["name", "description", "image_url", "category_ref", "presentation", "pricing_model", "currency", "sale_unit_label", "unit_price", "allowed_amounts", "minimum_amount", "amount_mode", "amount_step", "visible", "availability", "permanent"];
export function allowedSellerRoute(path: string, method: string): boolean {
  return path.length < 400 && sellerRoutes.some(([pattern, methods]) => pattern.test(path) && methods.includes(method));
}
export function validSellerQuery(path: string, method: string, query: URLSearchParams): boolean {
  if (isOrderPath(path)) return validOrderQuery(path, method, query);
  if (inventoryPath(path)) return validInventoryQuery(path, query);
  const preview = path.endsWith("/menu-preview");
  const list = preview || method === "GET" && (!path || /\/menu\/(categories|items|offerings)$/.test(path) || /\/reviews$/.test(path));
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
  if (inventoryPath(path)) return validInventoryBody(path, value);
  if (!object(value)) return false;
  if (/\/reviews\/RVW_[A-Za-z0-9_-]+\/response$/.test(path)) return method === "PUT" &&
    Object.keys(value).sort().join(",") === "expected_revision,response" &&
    Number.isSafeInteger(value.expected_revision) && Number(value.expected_revision) > 0 &&
    typeof value.response === "string" && !!value.response.trim() && value.response.length <= 2000;
  if (/\/reviews\/RVW_[A-Za-z0-9_-]+\/report$/.test(path)) return method === "POST" &&
    Object.keys(value).every(key => ["reason","message"].includes(key)) &&
    ["harassment","inappropriate","inaccurate","privacy","spam","other"].includes(String(value.reason)) &&
    (value.message == null || typeof value.message === "string" && value.message.length <= 2000);
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

export const sellerErrorCodes = new Set(["restaurant_inventory_invalid_input", "restaurant_inventory_invalid_quantity", "restaurant_inventory_insufficient", "restaurant_inventory_entitlement_required", "restaurant_inventory_uninitialized", "restaurant_inventory_binding_invalid", "restaurant_inventory_legacy_obligation", "restaurant_inventory_item_in_use", "restaurant_stale", "restaurant_idempotency_conflict", "restaurant_incomplete", "restaurant_location_confirmation_required", "restaurant_invalid_profile", "restaurant_menu_invalid", "restaurant_menu_currency_conflict", "restaurant_operation_key_required", "restaurant_time_invalid", "restaurant_time_ambiguous", "restaurant_time_overlap", "restaurant_time_expired", "restaurant_time_confirmation_required", "restaurant_timezone_unavailable", "restaurant_hours_timezone_conflict", "restaurant_invalid_input", "restaurant_unavailable", "restaurant_destination_unavailable"]);

export function validShare(value: unknown, ref: string, destination: string): value is { establishment_ref: string; destination: string; public_url: string; qr_content: string } {
  if (!object(value) || value.establishment_ref !== ref || value.destination !== destination) return false;
  return [value.public_url, value.qr_content].every(input => {
    if (typeof input !== "string" || input.length > 2048) return false;
    try { const url = new URL(input); return ["https://api.nihiloba.com", "https://nihiloba.com"].includes(url.origin) && /^\/go\/[A-Za-z0-9_-]+$/.test(url.pathname) && !url.search && !url.hash && !url.username && !url.password; } catch { return false; }
  });
}

for (const code of ['restaurant_pickup_invalid','restaurant_pickup_locked','restaurant_pickup_unavailable','restaurant_delivery_invalid','restaurant_delivery_locked','restaurant_delivery_unavailable']) sellerErrorCodes.add(code);
for (const code of ['restaurant_feed_refresh_required','restaurant_quote_changed','restaurant_order_state_conflict','restaurant_operation_expired','restaurant_intake_closed','restaurant_category_review_required','restaurant_item_review_required','restaurant_selection_invalid','restaurant_confirmation_required','restaurant_reason_required','restaurant_order_unknown_price','restaurant_order_item_unavailable']) sellerErrorCodes.add(code);

for (const code of ["restaurant_window_past", "restaurant_window_bounds", "restaurant_window_hours", "restaurant_window_closure", "restaurant_time_invalid", "restaurant_time_ambiguous", "restaurant_timezone_unavailable", "restaurant_time_overlap", "restaurant_stale", "restaurant_intake_closed"]) sellerErrorCodes.add(code);
for (const code of ["review_stale", "review_invalid_text", "review_invalid_reason", "review_unavailable"]) sellerErrorCodes.add(code);
