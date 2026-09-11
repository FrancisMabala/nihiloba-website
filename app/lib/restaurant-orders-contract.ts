// C1-C/C1-E Personal-only, bounded DTOs. Domain eligibility remains authoritative.
export const orderStates = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled', 'expired', 'uncollected', 'delivery_failed'];
export const orderActions = ['accept', 'reject', 'start', 'ready', 'dispatch', 'complete', 'delivery_failed', 'cancel', 'approve_cancellation', 'deny_cancellation', 'uncollected'];
export const orderReasons = ['customer_cancelled', 'unavailable_food', 'cannot_fulfill', 'not_collected', 'other', 'destination_inaccessible', 'recipient_unavailable', 'unable_to_complete'];
const ref = '[A-Za-z0-9_-]{1,64}';
export const orderRoutes: [RegExp, readonly string[]][] = [
  [new RegExp(`^RST_${ref}/(order-configuration|orders|order-feed|order-summary)$`), ['GET']],
  [new RegExp(`^RST_${ref}/orders/${ref}(/(receipt|destination))?$`), ['GET']],
  [new RegExp(`^RST_${ref}/orders/${ref}/actions/(${orderActions.join('|')})$`), ['POST']],
  [new RegExp(`^RST_${ref}/(pickup-intake|delivery-intake)$`), ['PUT']],
  [new RegExp(`^RST_${ref}/(counter-baskets|order-operations/recover|order-measurement|menu-batches)$`), ['POST']],
  [new RegExp(`^RST_${ref}/counter-baskets/${ref}$`), ['GET', 'PATCH']],
  [new RegExp(`^RST_${ref}/counter-baskets/${ref}/(quote|finalize)$`), ['POST']],
];
export const isOrderPath = (path: string) => /\/(orders|order-|counter-baskets|pickup-intake|delivery-intake|menu-batches)/.test(path);
const obj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const str = (v: unknown, n = 200): v is string => typeof v === 'string' && !!v.trim() && v.length <= n;
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
const decimal = (v: unknown) => typeof v === 'string' && /^[0-9]{1,16}(\.[0-9]{1,2})?$/.test(v);
const enumOf = (v: unknown, values: string[]) => typeof v === 'string' && values.includes(v);
const list = (v: unknown, max: number, check: (x: unknown) => boolean, min = 0) => Array.isArray(v) && v.length >= min && v.length <= max && v.every(check);
const line = (v: unknown) => obj(v) && exact(v, ['key','item_ref','quantity','selected_amount']) && str(v.key,64) && str(v.item_ref,64) && (v.quantity == null || Number.isSafeInteger(v.quantity) && Number(v.quantity)>0) && (v.selected_amount == null || decimal(v.selected_amount)) && (v.quantity != null) !== (v.selected_amount != null);
export function validOrderQuery(path: string, method: string, q: URLSearchParams) {
  const orders = method === 'GET' && /\/orders$/.test(path), feed = /\/order-feed$/.test(path), summary = /\/order-summary$/.test(path);
  const allowed = ['language', ...(orders || summary ? ['page','page_size'] : []), ...(orders ? ['states','as_of'] : []), ...(feed ? ['cursor','states','limit'] : []), ...(summary ? ['from_date','to_date','start_offset','end_offset'] : [])];
  for (const [key,value] of q) {
    if (!allowed.includes(key) || (key !== 'states' && q.getAll(key).length !== 1)) return false;
    if (key === 'language' && !enumOf(value,['en','fr','ln','sw'])) return false;
    if (key === 'states' && (!orderStates.includes(value) || q.getAll(key).length > orderStates.length)) return false;
    if (['page','page_size','limit'].includes(key) && (!/^[1-9]\d{0,6}$/.test(value) || key !== 'page' && Number(value)>50)) return false;
    if (['from_date','to_date'].includes(key) && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    if (['start_offset','end_offset'].includes(key) && !/^[+-]\d{2}:\d{2}$/.test(value)) return false;
    if (key === 'cursor' && !/^[A-Za-z0-9_-]{1,200}$/.test(value)) return false;
    if (key === 'as_of' && (value.length>100 || !/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value)))) return false;
  }
  return !summary || q.has('from_date') && q.has('to_date');
}
function itemFields(v: unknown) {
  if (!obj(v) || !Object.keys(v).length) return false;
  return Object.entries(v).every(([k,x]) => {
    if (k === 'name') return str(x,200);
    if (['description','image_url'].includes(k)) return x === null || typeof x === 'string' && x.length <= (k === 'description' ? 4000 : 2000);
    if (k === 'presentation') return enumOf(x,['fixed_dish','component']);
    if (k === 'pricing_model') return enumOf(x,['UNKNOWN','UNIT_PRICED','AMOUNT_PRICED']);
    if (k === 'currency') return x === null || enumOf(x,['CDF','USD']);
    if (['unit_price','minimum_amount'].includes(k)) return x === null || decimal(x);
    if (k === 'allowed_amounts') return x === null || list(x,20,decimal,1);
    if (k === 'sale_unit_label') return x === null || str(x,80);
    if (['visible','permanent'].includes(k)) return typeof x === 'boolean';
    return k === 'availability' && enumOf(x,['available','sold_out','temporarily_unavailable']);
  });
}
export function validOrderBody(path: string, value: unknown): boolean {
  if (!obj(value)) return false;
  const v = value;
  if (/\/order-measurement$/.test(path)) return !Object.keys(v).length;
  const batch = /\/menu-batches$/.test(path);
  if (!str(v.operation_key,batch ? 120 : 200)) return false;
  if (batch) return exact(v,['operation_key','expected_updated_at','category_ref','category_name','rows']) && str(v.expected_updated_at,64) && (v.category_ref != null) !== (v.category_name != null) && (v.category_ref == null || str(v.category_ref,64)) && (v.category_name == null || str(v.category_name,200)) && list(v.rows,20,r => obj(r) && exact(r,['key','fields','target_ref','separate','skip']) && str(r.key,64) && (r.target_ref == null || str(r.target_ref,64)) && (r.separate === undefined || typeof r.separate === 'boolean') && (r.skip === undefined || typeof r.skip === 'boolean') && [r.target_ref != null,r.separate === true,r.skip === true].filter(Boolean).length <= 1 && (r.skip === true && r.fields === undefined || itemFields(r.fields)),1) && new Set((v.rows as Record<string,unknown>[]).map(r=>r.key)).size === (v.rows as unknown[]).length && (v.rows as Record<string,unknown>[]).some(r=>r.skip !== true);
  if (/\/counter-baskets$/.test(path)) return exact(v,['operation_key']);
  if (/\/order-operations\/recover$/.test(path)) return exact(v,['operation_key','kind','target_ref']) && str(v.target_ref,64) && enumOf(v.kind,['basket','intake','delivery_config','edit','quote','submit','destination','delivery_quote','delivery_submit','counter_handoff','action']);
  if (/\/(pickup|delivery)-intake$/.test(path)) {
    const delivery = path.endsWith('/delivery-intake');
    return exact(v,['operation_key','expected_updated_at','enabled','windows',...(delivery ? ['fee','areas'] : [])]) && str(v.expected_updated_at,64) && typeof v.enabled === 'boolean' && list(v.windows,20,w=>obj(w) && exact(w,['starts_at','ends_at']) && str(w.starts_at,100) && str(w.ends_at,100)) && (!delivery || obj(v.fee) && exact(v.fee,['amount','currency']) && decimal(v.fee.amount) && enumOf(v.fee.currency,['CDF','USD']) && list(v.areas,100,a=>obj(a) && exact(a,['country','city','commune','quartier','scope']) && ['country','city','commune'].every(k=>str(a[k])) && (a.quartier == null || str(a.quartier)) && enumOf(a.scope,['whole_commune','quartier']),1));
  }
  if (!Number.isSafeInteger(v.expected_revision) || Number(v.expected_revision)<1) return false;
  if (path.includes('/actions/')) return exact(v,['operation_key','expected_revision','reason']) && (v.reason == null || enumOf(v.reason,orderReasons));
  if (path.endsWith('/finalize')) return exact(v,['operation_key','expected_revision','quote_ref','confirm','handoff_confirmed','fulfillment_method']) && str(v.quote_ref,64) && v.confirm === true && v.handoff_confirmed === true && enumOf(v.fulfillment_method,['on_premise','takeaway']);
  return exact(v,['operation_key','expected_revision','selections','fulfillment_method','window_ref']) && enumOf(v.fulfillment_method,['on_premise','takeaway']) && v.window_ref == null && obj(v.selections) && exact(v.selections,['standalone','plates']) && list(v.selections.standalone,50,line) && list(v.selections.plates,20,p=>obj(p) && exact(p,['key','components']) && str(p.key,64) && list(p.components,20,line,1));
}
