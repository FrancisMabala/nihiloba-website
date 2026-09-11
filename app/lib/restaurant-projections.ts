// Additive projections: absent fields support an older Backend; malformed fields fail closed.
type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue => !!v && typeof v === 'object' && !Array.isArray(v);
const keys = (v: ObjectValue, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k));
const count = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) >= 0;
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && [...v].length <= max;
export type FoodPreview = {available:boolean;groups:{kind:'standalone'|'plate';plate_number:number|null;lines:{name:string;currency:string;quantity?:number;sale_unit_label?:string;selected_amount?:string}[];remaining_lines:number}[];total_groups:number|null;total_lines:number|null;remaining_groups:number|null;remaining_lines:number|null;truncated:boolean};
export function validFoodPreview(v: unknown): v is FoodPreview {
 if (!object(v) || !keys(v,['available','groups','total_groups','total_lines','remaining_groups','remaining_lines','truncated']) || !Array.isArray(v.groups) || typeof v.truncated !== 'boolean') return false;
 const counts=['total_groups','total_lines','remaining_groups','remaining_lines'];
 if(v.available===false)return !v.groups.length && !v.truncated && counts.every(k=>v[k]===null);
 if(v.available!==true || !counts.every(k=>count(v[k]) && Number(v[k])<=200) || !v.groups.length || v.groups.length>3)return false;
 let shown=0, omitted=0, plate=0;
 for(const [i,g] of v.groups.entries()){
  if(!object(g) || !keys(g,['kind','plate_number','lines','remaining_lines']) || !count(g.remaining_lines) || !Array.isArray(g.lines) || !g.lines.length)return false;
  if(g.kind==='standalone'){if(i!==0 || g.plate_number!==null)return false;}
  else if(g.kind==='plate'){if(!count(g.plate_number) || g.plate_number<=plate || g.plate_number>200)return false;plate=g.plate_number;}
  else return false;
  for(const line of g.lines){
   if(!object(line) || !keys(line,['name','currency','quantity','sale_unit_label','selected_amount']) || !text(line.name,200) || !['CDF','USD'].includes(String(line.currency)))return false;
   if('quantity' in line){if(!count(line.quantity) || line.quantity===0 || !text(line.sale_unit_label,80) || 'selected_amount' in line)return false;}
   else if(!text(line.selected_amount,19) || !/^\d{1,16}(\.\d{1,2})?$/.test(line.selected_amount) || !/[1-9]/.test(line.selected_amount) || 'sale_unit_label' in line)return false;
  }
  shown+=g.lines.length;omitted+=g.remaining_lines;
 }
 return shown<=6 && v.total_groups===v.groups.length+Number(v.remaining_groups) && v.total_lines===shown+Number(v.remaining_lines) && Number(v.remaining_lines)>=omitted+Number(v.remaining_groups) && (v.remaining_groups!==0 || v.remaining_lines===omitted) && v.truncated===(Number(v.remaining_lines)>0);
}
export type MenuPreview = {items:{name:string;category_name:string|null;text:string}[];count:number;total:number;page:number;page_size:number;preview:true};
export function validMenuPreview(v:unknown, query:URLSearchParams):v is MenuPreview {
 if(!object(v) || !keys(v,['items','count','total','page','page_size','preview']) || v.preview!==true || !Array.isArray(v.items) || !count(v.total) || v.page!==Number(query.get('page')??1) || v.page_size!==Number(query.get('page_size')??5) || v.count!==v.items.length || v.items.length>Number(v.page_size))return false;
 if(v.items.length!==Math.min(Number(v.page_size),Math.max(0,v.total-(Number(v.page)-1)*Number(v.page_size))))return false;
 return v.items.every(i=>object(i) && keys(i,['name','category_name','text']) && text(i.name,200) && (i.category_name===null || text(i.category_name,200)) && text(i.text,20000));
}
export function validOrderProjections(v:unknown):boolean {
 return object(v) && (v.food_preview===undefined || validFoodPreview(v.food_preview)) && (v.response_deadline===undefined || v.response_deadline===null || typeof v.response_deadline==='string' && v.response_deadline.length<=64 && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(v.response_deadline) && Number.isFinite(Date.parse(v.response_deadline)));
}
