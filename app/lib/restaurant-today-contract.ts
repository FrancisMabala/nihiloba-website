import {validOrderProjections} from './restaurant-projections';

export const todayOrderKeys=['pending','ready','preparing'] as const;
export type TodayOrderKey=typeof todayOrderKeys[number];
type TodayOrder={order_ref:string;state:string;submitted_at:string;fulfillment_method:string};
type OrderPage={items:TodayOrder[];total:number;as_of:string};
export type TodayOrders={version:1;intake_released?:boolean;sections:Record<TodayOrderKey,OrderPage>};
export function validTodayOrders(value:unknown):value is TodayOrders{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const result=value as Partial<TodayOrders>;
 if(result.version!==1||!result.sections||Object.keys(result.sections).sort().join(',')!=='pending,preparing,ready')return false;
 if('intake_released' in result&&typeof result.intake_released!=='boolean')return false;
 return todayOrderKeys.every(key=>{
  const page=result.sections![key];
  return !!page&&Array.isArray(page.items)&&page.items.length<=(key==='preparing'?1:5)&&page.items.every(row=>
   validOrderProjections(row)&&typeof row?.order_ref==='string'&&/^ROD_[A-Za-z0-9_-]+$/.test(row.order_ref)
   &&(key==='preparing'?['accepted','preparing'].includes(row.state):row.state===key)
   &&typeof row.submitted_at==='string'&&Number.isFinite(Date.parse(row.submitted_at))&&typeof row.fulfillment_method==='string')
   &&Number.isSafeInteger(page.total)&&page.total>=page.items.length&&typeof page.as_of==='string'&&Number.isFinite(Date.parse(page.as_of));
 });
}
