export function validInventoryQuery(path: string, query: URLSearchParams): boolean {
  const listing = /\/inventory$/.test(path);
  const history = /\/history$/.test(path);
  const allowed = listing ? ["language", "page", "page_size", "low_stock", "search", "stock_kind", "stock_state"] : history ? ["language", "page_size", "before_id", "days"] : ["language"];
  for (const [key, value] of query) {
    if (!allowed.includes(key) || query.getAll(key).length !== 1) return false;
    if (key === "language" && !["fr", "en", "ln", "sw"].includes(value)) return false;
    if (key === "search") { if (value.length > 160) return false; continue; }
    if (key === "stock_kind") { if (!["prepared", "packaged", "ingredient", "other"].includes(value)) return false; continue; }
    if (key === "stock_state") { if (!["attention", "out"].includes(value)) return false; continue; }
    if (key === "low_stock") { if (!["true", "false"].includes(value)) return false; continue; }
    if (key !== "language" && (!/^[1-9]\d{0,6}$/.test(value) || key === "page_size" && Number(value) > 50 || key === "days" && Number(value) > 730)) return false;
  }
  return true;
}
function inventoryObject(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
export function validInventoryBody(path: string, value: unknown): boolean {
  if (!inventoryObject(value)) return false;
  const keys = Object.keys(value);
  const operation = typeof value.operation_key === "string" && value.operation_key.length >= 1 && value.operation_key.length <= 200;
  const revision = Number.isSafeInteger(value.expected_revision) && Number(value.expected_revision) >= 1;
  const amount = (v: unknown) => typeof v === "string" && /^\d{1,15}(?:\.\d{1,3})?$/.test(v);
  if (/\/inventory\/items$/.test(path)) return operation && keys.every(k => ["operation_key", "name", "purpose", "stock_kind", "unit", "opening_quantity", "display_label", "low_stock_threshold"].includes(k)) &&
    typeof value.name === "string" && !!value.name.trim() && value.name.length <= 160 && ["sellable", "ingredient"].includes(String(value.purpose)) &&
    (value.stock_kind == null || value.stock_kind === "ingredient" && value.purpose === "ingredient" || ["prepared", "packaged"].includes(String(value.stock_kind)) && value.purpose === "sellable" && ["piece", "portion", "boule", "bottle", "can", "tray"].includes(String(value.unit))) &&
    ["piece", "portion", "boule", "bottle", "can", "tray", "g", "kg", "ml", "l"].includes(String(value.unit)) && amount(value.opening_quantity) &&
    (value.low_stock_threshold == null || amount(value.low_stock_threshold)) && (value.display_label == null || typeof value.display_label === "string" && value.display_label.length <= 80);
  if (/\/movements$/.test(path)) return operation && revision && keys.every(k => ["operation_key", "action", "amount", "expected_revision", "linked_movement_ref", "private_note"].includes(k)) &&
    ["stock_received", "preparation_produced", "manual_increase", "return_to_stock", "manual_issue", "waste", "spoilage", "damaged", "internal_use", "count"].includes(String(value.action)) && amount(value.amount) &&
    (value.linked_movement_ref == null || typeof value.linked_movement_ref === "string" && /^RIM_[A-Za-z0-9_-]+$/.test(value.linked_movement_ref)) &&
    (value.private_note == null || typeof value.private_note === "string" && value.private_note.length <= 500);
  if (/\/kind$/.test(path)) return operation && revision && keys.every(k => ["operation_key", "stock_kind", "expected_revision"].includes(k)) && ["prepared", "packaged", "ingredient"].includes(String(value.stock_kind));
  if (/\/archive$/.test(path)) return operation && revision && keys.every(k => ["operation_key", "expected_revision"].includes(k));
  if (/\/binding$/.test(path)) return operation && keys.every(k => ["operation_key", "item_ref", "factor", "expected_revision", "active"].includes(k)) &&
    typeof value.item_ref === "string" && /^RII_[A-Za-z0-9_-]+$/.test(value.item_ref) && Number.isSafeInteger(value.factor) && Number(value.factor) > 0 &&
    Number.isSafeInteger(value.expected_revision) && Number(value.expected_revision) >= 0 && (value.active === undefined || typeof value.active === "boolean");
  return false;
}
