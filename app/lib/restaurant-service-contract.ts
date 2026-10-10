// RM-V11-10B2. Relative to an exact establishment; worker locators live in query.
const reference = '[A-Za-z0-9_-]{1,64}';
const parent = 'RST_[A-Za-z0-9_-]+';
const prefix = parent + '/(?:service|stations/service)';
export const serviceRoutes: [RegExp, readonly string[]][] = [
 [new RegExp('^'+prefix+'$'), ['GET']],
 [new RegExp('^'+prefix+'/baskets$'), ['POST']],
 [new RegExp('^'+prefix+'/baskets/'+reference+'$'), ['GET','PATCH']],
 [new RegExp('^'+prefix+'/baskets/'+reference+'/(quote|submit)$'), ['POST']],
 [new RegExp('^'+prefix+'/orders/'+reference+'(?:/receipt)?$'), ['GET']],
 [new RegExp('^'+prefix+'/orders/'+reference+'/actions/assisted_handover$'), ['POST']],
 [new RegExp('^'+prefix+'/rounds/'+reference+'$'), ['GET']],
 [new RegExp('^'+prefix+'/groups$'), ['GET','POST']],
 [new RegExp('^'+prefix+'/groups/'+reference+'$'), ['GET']],
 [new RegExp('^'+prefix+'/groups/'+reference+'/(close|proposals)$'), ['POST']],
];
export const isServicePath = (path:string) => serviceRoutes.some(([pattern])=>pattern.test(path));
const obj = (v:unknown):v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const exact = (v:Record<string,unknown>, keys:string[]) => Object.keys(v).every(k=>keys.includes(k));
const ref = (v:unknown):v is string => typeof v==='string' && new RegExp('^'+reference+'$').test(v);
const positive = (v:unknown) => Number.isSafeInteger(v) && Number(v)>0;
const key = (v:unknown) => typeof v==='string' && !!v.trim() && v.length<=200;
const line = (v:unknown) => obj(v) && exact(v,['key','item_ref','quantity','selected_amount']) &&
 typeof v.key==='string' && !!v.key.trim() && v.key.length<=64 && ref(v.item_ref) &&
 (v.quantity===undefined ? typeof v.selected_amount==='string' && /^\d{1,16}(?:\.\d{1,2})?$/.test(v.selected_amount) : v.selected_amount===undefined && positive(v.quantity));
export function serviceSelections(v:unknown):boolean {
 if(!obj(v)||!exact(v,['standalone','plates'])||!Array.isArray(v.standalone)||v.standalone.length>50||!v.standalone.every(line)||
 !Array.isArray(v.plates)||v.plates.length>20||!v.plates.every(p=>obj(p)&&exact(p,['key','components'])&&typeof p.key==='string'&&!!p.key.trim()&&p.key.length<=64&&Array.isArray(p.components)&&p.components.length>0&&p.components.length<=20&&p.components.every(line)))return false;
 const keys=[...v.standalone.map(l=>l.key),...v.plates.flatMap(p=>[p.key,...p.components.map((l:Record<string,unknown>)=>l.key)])];
 return keys.length<=200 && new Set(keys).size===keys.length;
}
export function validServiceQuery(path:string,method:string,q:URLSearchParams):boolean {
 const worker=path.includes('/stations/service');
 const allowed=[...(worker?['assignment_ref','assignment_revision']:[]),...(method==='GET'&&path.endsWith('/groups')?['page']:[]),...(method==='GET'&&/\/(?:stations\/)?service$/.test(path)?['language']:[])];
 for(const [k,v] of q){
  if(!allowed.includes(k)||q.getAll(k).length!==1)return false;
  if(k==='assignment_ref'){if(!ref(v))return false;}
  else if(k==='language'){if(!['fr','en','ln','sw'].includes(v))return false;}
  else if(!/^[1-9]\d{0,6}$/.test(v))return false;
 }
 return !worker || q.has('assignment_ref')&&q.has('assignment_revision');
}
export function validServiceBody(path:string,v:unknown):boolean {
 if(!obj(v)||!key(v.operation_key))return false;
 if(/\/(groups|baskets)$/.test(path))return exact(v,['operation_key']);
 if(!positive(v.expected_revision))return false;
 if(path.endsWith('/assisted_handover'))return exact(v,['operation_key','expected_revision','confirm'])&&v.confirm===true;
 if(path.endsWith('/close'))return exact(v,['operation_key','expected_revision']);
 if(path.endsWith('/proposals'))return exact(v,['operation_key','expected_revision','order_ref'])&&ref(v.order_ref);
 if(path.endsWith('/submit'))return exact(v,['operation_key','expected_revision','quote_ref','confirm','group_ref','expected_group_revision'])&&
 ref(v.quote_ref)&&v.confirm===true&&(v.group_ref===undefined&&v.expected_group_revision===undefined||ref(v.group_ref)&&positive(v.expected_group_revision));
 return exact(v,['operation_key','expected_revision','selections','food_preference'])&&serviceSelections(v.selections)&&
 (v.food_preference==null||typeof v.food_preference==='string'&&v.food_preference.length<=400&&!/[\u0000-\u0009\u000b-\u001f\u007f]/.test(v.food_preference));
}
export type ServiceAssignment={assignment_ref:string;assignment_revision:number};
export type ServiceRound={preparation?:import("./restaurant-preparation-contract").Preparation;order_ref:string;entry_source:string;channel:string;fulfillment_method:string;state:string;revision:number;cancellation_pending:boolean;currency:'CDF'|'USD';amount:string;submitted_at:string;payment_verified:false};
export type ServiceGroup={group_ref:string;revision:number;state:'open'|'closed';guest_confirmed:boolean;can_add_round:boolean;order_until:string;rounds:ServiceRound[];payment_verified:false};
export type ServiceEnvelope=Readonly<{path:string;method:string;body:string}>;
export function servicePath(path:string,suffix:string,assignment?:ServiceAssignment,query:Record<string,string>={}){
 const q=new URLSearchParams(query);
 if(assignment){q.set('assignment_ref',assignment.assignment_ref);q.set('assignment_revision',String(assignment.assignment_revision));}
 return path+(assignment?'/stations/service':'/service')+suffix+(q.size?'?'+q:'');
}
export const serviceEnvelope=(path:string,method:string,body:unknown):ServiceEnvelope=>Object.freeze({path,method,body:JSON.stringify(body)});
