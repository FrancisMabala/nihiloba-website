import {receiptCodes} from './customer-receipt-contract';
import {customerReceiptCopy,type ReceiptLocale} from './customer-receipt-copy';
export class ReceiptError extends Error{constructor(public status:number,public code:string){super(code);}}
export async function customerRequest(path:string,binding:string,body?:unknown,signal?:AbortSignal):Promise<unknown>{
 const [pathname,query]=path.split('?');
 return receiptRequest(`/api/shida/personal/customer/${pathname}/${query?'?'+query:''}`,binding,body,signal);
}
export async function sellerReceiptRequest(path:string,binding:string,body?:unknown,signal?:AbortSignal,businessRef?:string){
 if(businessRef&&!/^BUS_[A-Za-z0-9_-]+$/.test(businessRef))throw Error();
 return receiptRequest(businessRef?`/api/shida/businesses/${businessRef}/receipt-links/${path}`:`/api/shida/personal/customer/links/${path}/`,binding,body,signal);
}
async function receiptRequest(target:string,binding:string,body?:unknown,signal?:AbortSignal):Promise<unknown>{
 const timeout=AbortSignal.timeout(12000);
 const response=await fetch(target,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',signal:signal?AbortSignal.any([signal,timeout]):timeout,headers:{'X-Shida-Session':binding,Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
 const value=await response.json().catch(()=>null);if(!response.ok)throw new ReceiptError(response.status,receiptCodes.has(value?.detail)?value.detail:'customer_receipt_unavailable');return value;
}
export function receiptErrorMessage(error:unknown,locale:ReceiptLocale){const c=customerReceiptCopy[locale];if(error instanceof ReceiptError){if(error.code==='customer_receipt_changed')return c.changed;if(error.code==='customer_receipt_expired')return c.expired;if(error.status===429)return c.rate;if(error.status===409)return c.stale;if(error.code==='customer_number_invalid')return c.invalid;}return c.error;}
