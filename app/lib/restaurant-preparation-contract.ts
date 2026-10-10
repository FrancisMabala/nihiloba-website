import { validFoodPreview } from './restaurant-projections';
// RM-V11-10B3: preparation only. Assignment generations belong in every query.
export type Station = 'kitchen' | 'bar';
export type Progress = 'waiting' | 'preparing' | 'ready' | 'cancelled';
export type Preparation = { kitchen?: Progress; bar?: Progress };
export type PreparationAssignment = { assignment_ref: string; assignment_revision: number; bootstrap_page?: number };
export type StationLine = { key: string; name: string; pricing_model: 'UNIT_PRICED' | 'AMOUNT_PRICED'; currency: 'CDF' | 'USD'; quantity?: number; sale_unit_label?: string; selected_amount?: string };
export type StationOrder = {
  order_ref: string; state: string; revision: number; submitted_at: string; updated_at: string;
  cancellation_pending: boolean; fulfillment_method: string; food_preference: string | null;
  standalone: StationLine[]; plates: { key: string; components: StationLine[] }[];
  station: Station; station_state: Progress | string; stations: Preparation; legacy_whole_order: boolean;
  food_preview?: import('./restaurant-projections').FoodPreview;
};
export type StationList = { items: StationOrder[]; total: number; page: number; page_size: number; as_of: string; copy: Record<string, string> };
export type StationFeed = { full_refresh: boolean; changed: StationOrder[]; removed: string[]; cursor: string; expires_at: string; as_of: string };
export type StationResult = { operation_outcome: { order_ref: string; state: string; revision: number }; current_order: StationOrder };
const ref = '[A-Za-z0-9_-]{1,64}', parent = `RST_${ref}`, station = '(kitchen|bar)';
export const preparationRoutes: [RegExp, readonly string[]][] = [
  [new RegExp(`^${parent}/(?:stations/)?preparation/${station}/(orders|feed)$`), ['GET']],
  [new RegExp(`^${parent}/(?:stations/)?preparation/${station}/orders/${ref}$`), ['GET']],
  [new RegExp(`^${parent}/(?:stations/)?preparation/${station}/orders/${ref}/actions/(start|ready)$`), ['POST']],
  [new RegExp(`^${parent}/orders/${ref}/preparation/${station}$`), ['GET']],
  [new RegExp(`^${parent}/orders/${ref}/preparation/${station}/actions/(start|ready)$`), ['POST']],
  [new RegExp(`^${parent}/orders/${ref}/preparation/${station}/recover$`), ['POST']],
  [new RegExp(`^${parent}/preparation-routing$`), ['GET']],
  [new RegExp(`^${parent}/preparation-routing/RMI_${ref}$`), ['PUT']],
];
export const isPreparationPath = (path: string) => /\/preparation(?:\/|-routing(?:\/|$))/.test(path);
export function validPreparationQuery(path: string, method: string, q: URLSearchParams) {
  const worker = path.includes('/stations/preparation/');
  const queue = method === 'GET' && path.endsWith('/orders'), feed = path.endsWith('/feed'), routing = path.endsWith('/preparation-routing');
  const allowed = [...(worker ? ['assignment_ref', 'assignment_revision'] : []), ...(queue ? ['page', 'page_size', 'language'] : routing ? ['page'] : []), ...(feed ? ['cursor', 'limit'] : [])];
  for (const [key, value] of q) {
    if (!allowed.includes(key) || q.getAll(key).length !== 1) return false;
    if (key === 'language') { if (!['fr', 'en', 'ln', 'sw'].includes(value)) return false; }
    else if (['assignment_ref', 'cursor'].includes(key)) { if (!/^[A-Za-z0-9_-]{1,64}$/.test(value)) return false; }
    else if (!/^[1-9]\d{0,6}$/.test(value) || key === 'page_size' && Number(value) > 20 || key === 'limit' && Number(value) > 50) return false;
  }
  return !worker || q.has('assignment_ref') && q.has('assignment_revision');
}
export function validPreparationBody(path: string, value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.operation_key !== 'string' || !v.operation_key.trim() || v.operation_key.length > 200) return false;
  const routing = path.includes('/preparation-routing/'), recovery = path.endsWith('/recover');
  const keys = routing ? ['operation_key', 'expected_updated_at', 'station', 'supported_non_alcoholic_drink'] : ['operation_key', 'expected_revision', ...(recovery ? ['confirm', 'reason'] : [])];
  if (Object.keys(v).some(k => !keys.includes(k))) return false;
  if (routing) return typeof v.expected_updated_at === 'string' && !!v.expected_updated_at && v.expected_updated_at.length <= 64 && ['kitchen', 'bar'].includes(String(v.station)) && (v.supported_non_alcoholic_drink === undefined || typeof v.supported_non_alcoholic_drink === 'boolean') && (v.station !== 'bar' || v.supported_non_alcoholic_drink === true);
  return Number.isSafeInteger(v.expected_revision) && Number(v.expected_revision) >= 1 && (!recovery || v.confirm === true && ['cannot_fulfill', 'other'].includes(String(v.reason)));
}
export function preparationPath(path: string, suffix: string, assignment?: PreparationAssignment) {
  return path + suffix + (assignment ? ((path + suffix).includes('?') ? '&' : '?') + new URLSearchParams({ assignment_ref: assignment.assignment_ref, assignment_revision: String(assignment.assignment_revision) }) : '');
}
export const preparationEnvelope = (url: string, method: 'POST' | 'PUT', body: unknown, binding: string, detailUrl: string) => Object.freeze({ url, method, body: JSON.stringify(body), binding, detailUrl });

const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, max = 64): v is string => typeof v === 'string' && !!v.trim() && v.length <= max;
export function validStationOrder(value: unknown): value is StationOrder {
  if (!object(value) || Object.keys(value).some(k => !['order_ref','state','revision','submitted_at','updated_at','cancellation_pending','fulfillment_method','food_preference','standalone','plates','station','station_state','stations','legacy_whole_order','food_preview'].includes(k))) return false;
  if (!text(value.order_ref) || !['accepted','preparing','ready','cancelled','completed','out_for_delivery','uncollected','delivery_failed'].includes(String(value.state)) || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || ![value.submitted_at,value.updated_at].every(v=>text(v) && Number.isFinite(Date.parse(v))) || typeof value.cancellation_pending !== 'boolean' || !['pickup','delivery','assisted'].includes(String(value.fulfillment_method)) || !(value.food_preference === null || typeof value.food_preference === 'string' && value.food_preference.length <= 400) || !['kitchen','bar'].includes(String(value.station)) || typeof value.legacy_whole_order !== 'boolean' || !object(value.stations)) return false;
  if (Object.entries(value.stations).some(([k,v]) => !['kitchen','bar'].includes(k) || !['waiting','preparing','ready','cancelled'].includes(String(v)))) return false;
  if (value.legacy_whole_order ? value.station !== 'kitchen' || Object.keys(value.stations).length > 0 || value.station_state !== value.state : value.stations[String(value.station)] !== value.station_state || !Object.keys(value.stations).length || value.food_preview !== undefined) return false;
  if (value.food_preview !== undefined && !validFoodPreview(value.food_preview)) return false;
  if (!Array.isArray(value.standalone) || !Array.isArray(value.plates) || value.plates.length > 200) return false;
  const keys = new Set<string>();
  const line = (v: unknown) => {
    if (!object(v) || Object.keys(v).some(k=>!['key','name','pricing_model','currency','quantity','sale_unit_label','selected_amount'].includes(k)) || !text(v.key) || keys.has(v.key) || !text(v.name,200) || !['CDF','USD'].includes(String(v.currency))) return false;
    keys.add(v.key);
    return v.pricing_model === 'UNIT_PRICED' ? Number.isSafeInteger(v.quantity) && Number(v.quantity)>0 && text(v.sale_unit_label,80) && v.selected_amount === undefined : v.pricing_model === 'AMOUNT_PRICED' && text(v.selected_amount,19) && /^\d{1,16}(\.\d{1,2})?$/.test(v.selected_amount) && /[1-9]/.test(v.selected_amount) && v.quantity === undefined && v.sale_unit_label === undefined;
  };
  if (!value.standalone.every(line) || !value.plates.every(p=>object(p) && Object.keys(p).every(k=>['key','components'].includes(k)) && text(p.key) && Array.isArray(p.components) && p.components.length>0 && p.components.every(line))) return false;
  return keys.size>0 && keys.size<=200;
}
export function validPreparationResponse(path: string, method: string, value: unknown) {
  if (!object(value)) return false;
  if (path.includes('/preparation-routing')) return true;
  if (method === 'POST') return object(value.operation_outcome) && text(value.operation_outcome.order_ref) && Number.isSafeInteger(value.operation_outcome.revision) && validStationOrder(value.current_order);
  if (path.endsWith('/orders')) return Array.isArray(value.items) && value.items.length<=20 && value.items.every(validStationOrder);
  if (path.endsWith('/feed')) return typeof value.full_refresh==='boolean' && Array.isArray(value.changed) && value.changed.length<=50 && value.changed.every(validStationOrder) && Array.isArray(value.removed) && value.removed.length<=50 && value.removed.every(v=>text(v)) && text(value.cursor);
  return validStationOrder(value);
}
