const root='RST_[A-Za-z0-9_-]+/service/';
const day='[0-9]{4}-[0-9]{2}-[0-9]{2}';
const currency='(?:CDF|USD)';
export const dailyRoutes:[RegExp,readonly string[]][]=[
 [new RegExp('^'+root+'financial/entries$'),['GET','POST']],
 [new RegExp('^'+root+'financial/recover$'),['POST']],
 [new RegExp('^'+root+'daily/time-zone$'),['GET','PUT']],
 [new RegExp('^'+root+'daily/reports$'),['GET']],
 [new RegExp('^'+root+'daily/days/'+day+'/(?:preview|report)$'),['GET']],
 [new RegExp('^'+root+'daily/days/'+day+'/adjustments$'),['GET']],
 [new RegExp('^'+root+'daily/days/'+day+'/(?:opening|count)/'+currency+'$'),['PUT']],
 [new RegExp('^'+root+'daily/days/'+day+'/close$'),['POST']],
];
export const isDailyPath=(path:string)=>dailyRoutes.some(([pattern])=>pattern.test(path));
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const exact=(value:Record<string,unknown>,keys:string[])=>Object.keys(value).every(key=>keys.includes(key));
const key=(value:unknown)=>typeof value==='string'&&value.length>=1&&value.length<=64;
const revision=(value:unknown)=>Number.isSafeInteger(value)&&Number(value)>=0;
const ref=(value:unknown)=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value);
const amount=(value:unknown,zero=false)=>typeof value==='string'&&/^\d{1,15}(?:\.\d{1,2})?$/.test(value)&&(zero||Number(value)>0);
const text=(value:unknown,max:number)=>typeof value==='string'&&value.trim().length>0&&value.length<=max&&!/[\r\n]/.test(value);
export function validDailyQuery(path:string,method:string,query:URLSearchParams):boolean{
 if(method!=='GET')return query.size===0;
 const allowed=path.endsWith('/financial/entries')?['after_revision','limit']:path.endsWith('/daily/reports')?['before','limit']:path.endsWith('/adjustments')?['after','limit']:[];
 for(const [name,value] of query){if(!allowed.includes(name)||query.getAll(name).length!==1)return false;
  if(name==='before'){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;}
  else if(!/^\d{1,9}$/.test(value)||name==='limit'&&Number(value)>(path.includes('/financial/')||path.endsWith('/adjustments')?100:31)||name==='limit'&&Number(value)<1)return false;
 }return true;
}
export function validDailyBody(path:string,value:unknown):boolean{
 if(!object(value)||!key(value.operation_key)||!revision(value.expected_revision))return false;
 if(path.includes('/financial/')){
  const kind=value.kind;
  if(!['expense','reversal','replacement','recovery','cash_addition','cash_removal'].includes(String(kind))||!amount(value.amount)||!['CDF','USD'].includes(String(value.currency)))return false;
  const target=['reversal','replacement','recovery'].includes(String(kind));
  const method=['expense','replacement','recovery'].includes(String(kind));
  const category=['expense','replacement'].includes(String(kind));
  const reason=kind!=='expense';
  const keys=['kind','operation_key','expected_revision','amount','currency',...(target?['target_ref']:[]),...(method?['method_ref']:[]),...(category?['category','description','declared_occurred_at']:[]),...(reason?['reason']:[]),...(kind==='recovery'?['actually_recovered']:[])];
  return exact(value,keys)&&(!target||ref(value.target_ref))&&(!method||ref(value.method_ref))&&(!category||text(value.category,40)&& (value.description===undefined||typeof value.description==='string'&&value.description.length<=240))&&(!reason||text(value.reason,240))&&(kind!=='recovery'||value.actually_recovered===true);
 }
 if(path.endsWith('/time-zone'))return exact(value,['time_zone','expected_revision','operation_key','confirm'])&&typeof value.time_zone==='string'&&/^[A-Za-z0-9_+\/-]{1,64}$/.test(value.time_zone)&&value.confirm===true;
 if(/\/(opening|count)\/(CDF|USD)$/.test(path))return exact(value,['amount','expected_revision','operation_key','attested'])&&amount(value.amount,true)&&value.attested===true;
 if(path.endsWith('/close'))return exact(value,['expected_revision','preview_revision','operation_key','confirm','acknowledge_discrepancy','acknowledge_unresolved','reason'])&&typeof value.preview_revision==='string'&&/^[0-9a-f]{64}$/.test(value.preview_revision)&&value.confirm===true&&typeof value.acknowledge_discrepancy==='boolean'&&typeof value.acknowledge_unresolved==='boolean'&&(value.reason===undefined||typeof value.reason==='string'&&value.reason.length<=240);
 return false;
}
