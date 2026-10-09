// Exact 09B1 guest adapter. Public navigation refs carry no authority.
export const GUEST_COOKIE = "__Secure-restaurant-visit";
export const GUEST_PROXY = "/api/shida/restaurant-guests";
export const GUEST_BACKEND = "/api/restaurant-guests";
const ref = "[A-Za-z0-9_-]{1,64}";
export const guestReference = (value: unknown): value is string => typeof value === "string" && new RegExp(`^${ref}$`).test(value);
export function guestRoute(path: string, method: string) {
  const base = `establishments/${ref}`, visit = `${base}/visits/${ref}`;
  const rules: [string, string[]][] = [
    [`${base}/entry`, ["GET"]], [`${base}/visits`, ["POST"]],
    [visit, ["GET", "DELETE"]], [`${visit}/close`, ["POST"]],
    [`${visit}/baskets`, ["POST"]], [`${visit}/baskets/${ref}`, ["GET", "PATCH"]],
    [`${visit}/baskets/${ref}/(?:quote|submit)`, ["POST"]],
    [`${visit}/orders/${ref}(?:/pickup-code)?`, ["GET"]],
    [`${visit}/orders/${ref}/(?:cancel|request_cancellation)`, ["POST"]],
  ];
  return rules.some(([pattern, methods]) => methods.includes(method) && new RegExp(`^${pattern}$`).test(path));
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(key => keys.includes(key));
const string = (v: unknown, max: number) => typeof v === "string" && !!v.trim() && v.length <= max;
const line = (v: unknown) => object(v) && exact(v, ["key", "item_ref", "quantity", "selected_amount"]) && string(v.key,64) && guestReference(v.item_ref) &&
  (v.quantity === undefined ? typeof v.selected_amount === "string" && /^\d{1,16}(\.\d{1,2})?$/.test(v.selected_amount) : v.selected_amount === undefined && Number.isSafeInteger(v.quantity) && Number(v.quantity) > 0);
export function guestSelections(v: unknown) {
  return object(v) && exact(v,["standalone","plates"]) && Array.isArray(v.standalone) && v.standalone.length <= 50 && v.standalone.every(line) &&
    Array.isArray(v.plates) && v.plates.length <= 20 && v.plates.every(p => object(p) && exact(p,["key","components"]) && string(p.key,64) && Array.isArray(p.components) && p.components.length > 0 && p.components.length <= 20 && p.components.every(line));
}
export function guestBody(path: string, v: unknown) {
  if (!object(v)) return false;
  if (path.endsWith("/visits")) return exact(v,["entry_context"]) && string(v.entry_context,2048);
  if (!string(v.operation_key,200)) return false;
  if (path.endsWith("/baskets")) return exact(v,["operation_key"]);
  if (!Number.isSafeInteger(v.expected_revision) || Number(v.expected_revision) < 1) return false;
  if (path.endsWith("/submit")) return exact(v,["operation_key","expected_revision","quote_ref","confirm"]) && guestReference(v.quote_ref) && v.confirm === true;
  if (path.endsWith("/request_cancellation")) return exact(v,["operation_key","expected_revision"]);
  if (path.endsWith("/cancel")) return exact(v,["operation_key","expected_revision","reason"]) && v.reason === "customer_cancelled";
  const quote = path.endsWith("/quote");
  return exact(v,["operation_key","expected_revision","selections","fulfillment_method","window_ref",...(!quote ? ["food_preference"] : [])]) && guestSelections(v.selections) && v.fulfillment_method === "pickup" &&
    (quote ? guestReference(v.window_ref) : v.window_ref == null || guestReference(v.window_ref)) &&
    (v.food_preference == null || typeof v.food_preference === "string" && v.food_preference.length <= 400 && !/[\u0000-\u0009\u000b-\u001f\u007f]/.test(v.food_preference));
}
