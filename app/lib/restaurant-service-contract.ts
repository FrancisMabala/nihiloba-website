// RM-V11-10B2. Relative to an exact establishment; worker locators live in query.
const reference = '[A-Za-z0-9_-]{1,64}';
const parent = 'RST_[A-Za-z0-9_-]+';
const prefix = parent + '/(?:service|stations/service)';
const ownerPrefix=parent+'/service';
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
 [new RegExp('^'+prefix+'/groups/'+reference+'/(bill|receipt|payment-methods)$'), ['GET']],
 [new RegExp('^'+prefix+'/groups/'+reference+'/(checkout|reopen)$'), ['POST']],
 [new RegExp('^'+prefix+'/groups/'+reference+'/money/(receipts|recover)$'), ['POST']],
 [new RegExp('^'+ownerPrefix+'/groups/'+reference+'/money/(reversals|refunds|reconcile-excess)$'), ['POST']],
 [new RegExp('^'+ownerPrefix+'/payment-methods$'), ['GET','POST']],
 [new RegExp('^'+ownerPrefix+'/payment-methods/'+reference+'$'), ['PUT']],
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
 const allowed=[...(worker?['assignment_ref','assignment_revision']:[]),...(method==='GET'&&path.endsWith('/groups')?['page']:[]),...(method==='GET'&&(/\/(?:stations\/)?service$/.test(path)||path.endsWith('/receipt'))?['language']:[])];
 for(const [k,v] of q){
  if(!allowed.includes(k)||q.getAll(k).length!==1)return false;
  if(k==='assignment_ref'){if(!ref(v))return false;}
  else if(k==='language'){if(!['fr','en','ln','sw'].includes(v))return false;}
  else if(!/^[1-9]\d{0,6}$/.test(v))return false;
 }
 return !worker || q.has('assignment_ref')&&q.has('assignment_revision');
}
export function validServiceBody(path:string,v:unknown):boolean {
 if(!obj(v))return false;
 if(path.includes('/payment-methods'))return exact(v,['expected_revision','label','kind','currencies','enabled'])&&Number.isSafeInteger(v.expected_revision)&&Number(v.expected_revision)>=0&&typeof v.label==='string'&&v.label.trim().length>0&&v.label.length<=80&&['cash','external_mobile_money'].includes(String(v.kind))&&Array.isArray(v.currencies)&&v.currencies.length>0&&v.currencies.every(c=>['CDF','USD'].includes(c))&&new Set(v.currencies).size===v.currencies.length&&typeof v.enabled==='boolean';
 if(!key(v.operation_key))return false;
 if(path.includes('/money/')){
  const suffix=path.split('/').pop(),kind=suffix==='recover'?v.kind:({receipts:'receipt',reversals:'reversal',refunds:'refund','reconcile-excess':'reconciliation'} as Record<string,string>)[suffix??''];
  if(!['receipt','reversal','refund','reconciliation'].includes(String(kind))||suffix==='recover'&&typeof v.kind!=='string'||path.includes('/stations/service/')&&kind!=='receipt')return false;
  const allowed=['operation_key','method_ref','currency','amount','change_returned','expected_bill_revision','expected_payment_revision',...(kind==='reversal'||kind==='refund'?['target_ref','reason']:[]),...(kind==='refund'?['actually_returned']:[]),...(kind==='reconciliation'?['order_ref','reason']:[]),...(suffix==='recover'?['kind']:[])];
  return exact(v,allowed)&&typeof v.operation_key==='string'&&v.operation_key.length<=64&&ref(v.method_ref)&&['CDF','USD'].includes(String(v.currency))&&typeof v.amount==='string'&&/^\d{1,15}(?:\.\d{1,2})?$/.test(v.amount)&&Number(v.amount)>0&&
   (v.change_returned===undefined||typeof v.change_returned==='string'&&/^\d{1,15}(?:\.\d{1,2})?$/.test(v.change_returned))&&typeof v.expected_bill_revision==='string'&&/^[0-9a-f]{64}$/.test(v.expected_bill_revision)&&Number.isSafeInteger(v.expected_payment_revision)&&Number(v.expected_payment_revision)>=0&&
   (kind!=='reversal'&&kind!=='refund'||ref(v.target_ref)&&typeof v.reason==='string'&&!!v.reason.trim()&&v.reason.length<=240)&&
   (kind!=='refund'||v.actually_returned===true)&&
   (kind!=='reconciliation'||ref(v.order_ref)&&v.reason==='received_before_conflict');
 }
 if(path.endsWith('/reopen'))return exact(v,['operation_key','expected_revision','expected_payment_revision'])&&positive(v.expected_revision)&&Number.isSafeInteger(v.expected_payment_revision)&&Number(v.expected_payment_revision)>=0;
 if(path.endsWith('/checkout'))return exact(v,['operation_key','expected_revision'])&&positive(v.expected_revision);
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
export type ServiceGroup={group_ref:string;revision:number;state:'open'|'checkout'|'closed';guest_confirmed:boolean;can_add_round:boolean;order_until:string;rounds:ServiceRound[];payment_verified:false};
export type ServiceEnvelope=Readonly<{path:string;method:string;body:string}>;
export function servicePath(path:string,suffix:string,assignment?:ServiceAssignment,query:Record<string,string>={}){
 const q=new URLSearchParams(query);
 if(assignment){q.set('assignment_ref',assignment.assignment_ref);q.set('assignment_revision',String(assignment.assignment_revision));}
 return path+(assignment?'/stations/service':'/service')+suffix+(q.size?'?'+q:'');
}
export const serviceEnvelope=(path:string,method:string,body:unknown):ServiceEnvelope=>Object.freeze({path,method,body:JSON.stringify(body)});
