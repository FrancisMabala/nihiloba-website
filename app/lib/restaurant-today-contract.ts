import {validOrderProjections} from './restaurant-projections';

export const todayOrderKeys=['pending','ready','preparing'] as const;
export type TodayOrderKey=typeof todayOrderKeys[number];
type OrderPage={items:Record<string,unknown>[];total:number;as_of:string};
export type TodayOrders={version:1;sections:Record<TodayOrderKey,OrderPage>};
export function validTodayOrders(value:unknown):value is TodayOrders{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const result=value as Partial<TodayOrders>;
 if(result.version!==1||!result.sections||Object.keys(result.sections).sort().join(',')!=='pending,preparing,ready')return false;
 return todayOrderKeys.every(key=>{
  const page=result.sections![key];
  return !!page&&Array.isArray(page.items)&&page.items.length<=(key==='preparing'?1:5)&&page.items.every(validOrderProjections)
   &&Number.isSafeInteger(page.total)&&page.total>=page.items.length&&typeof page.as_of==='string'&&Number.isFinite(Date.parse(page.as_of));
 });
}
