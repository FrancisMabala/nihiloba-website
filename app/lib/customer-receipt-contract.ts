export type ReceiptSource='wenze'|'restaurant';
export type ReceiptStatus='pending'|'accepted'|'expired'|'rejected'|'revoked';
export type ReceiptItem={request_ref:string;source:ReceiptSource;merchant_ref:string;receipt_ref:string;receipt_version:string;status:ReceiptStatus;revision:number;created_at:string;expires_at:string};
export type ReceiptDocument={merchant:string;reference:string;date:string;lines:{name:string;quantity:number|null;amount:string;currency:string;reversed:boolean;details?:string[]}[];totals:{amount:string;currency:string}[];payments:{method:string;amount:string;currency:string;reversal:boolean}[];deliveryFee?:{amount:string;currency:string};paid:boolean|null;paymentRecorded?:boolean;hasReversals:boolean};
export type ReceiptPreview=ReceiptItem&{receipt:ReceiptDocument;changed:boolean};
const record=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('receipt_invalid');return v as Record<string,unknown>;};
const text=(v:unknown,max=180)=>{if(typeof v!=='string'||v.length>max)throw Error('receipt_invalid');return v;};
const amount=(v:unknown)=>{const s=text(v,40);if(!/^-?\d{1,16}(\.\d{1,8})?$/.test(s))throw Error('receipt_invalid');return s;};
const currency=(v:unknown)=>{const s=text(v,3);if(!/^[A-Z]{3}$/.test(s))throw Error('receipt_invalid');return s;};
const array=(v:unknown,max=500)=>{if(!Array.isArray(v)||v.length>max)throw Error('receipt_invalid');return v;};
const date=(v:unknown)=>{const s=text(v,64);if(!Number.isFinite(Date.parse(s)))throw Error('receipt_invalid');return s;};
export function receiptItem(value:unknown):ReceiptItem{
 const v=record(value);if(!/^CRG_[a-f0-9]{32}$/.test(text(v.request_ref,40))||!['wenze','restaurant'].includes(String(v.source))||!['pending','accepted','expired','rejected','revoked'].includes(String(v.status))||!Number.isSafeInteger(v.revision)||Number(v.revision)<1||!/^[a-f0-9]{64}$/.test(text(v.receipt_version,64)))throw Error('receipt_invalid');
 return {request_ref:String(v.request_ref),source:v.source as ReceiptSource,merchant_ref:text(v.merchant_ref,64),receipt_ref:text(v.receipt_ref,96),receipt_version:String(v.receipt_version),status:v.status as ReceiptStatus,revision:Number(v.revision),created_at:date(v.created_at),expires_at:date(v.expires_at)};
}
export function receiptDocument(value:unknown,source:ReceiptSource):ReceiptDocument{
 const v=record(value),lines:ReceiptDocument['lines']=[],payments:ReceiptDocument['payments']=[];
 if(v.tax_invoice!==false||v.document_verifies_payment!==false)throw Error('receipt_invalid');
 if(source==='wenze'){
  for(const value of array(v.lines)){const l=record(value);if(typeof l.quantity!=='number'||!Number.isFinite(l.quantity)||l.quantity<0||typeof l.reversed!=='boolean')throw Error('receipt_invalid');lines.push({name:text(l.name),quantity:l.quantity,amount:amount(l.total),currency:currency(l.currency),reversed:l.reversed});}
  const totals=array(v.totals,20).map(value=>{const t=record(value);return {amount:amount(t.amount),currency:currency(t.currency)};});
  return {merchant:text(v.shop_name),reference:text(v.receipt_ref,96),date:date(v.sold_at??v.created_at),lines,totals,payments,paid:null,paymentRecorded:typeof v.payment==='string'&&v.payment.startsWith('seller_recorded_'),hasReversals:v.has_reversals===true};
 }
 const unit=currency(v.currency);
 for(const value of [...array(v.standalone),...array(v.plates,100).flatMap(plate=>array(plate))]){const l=record(value);if(l.quantity!=null&&(typeof l.quantity!=='number'||!Number.isFinite(l.quantity)||l.quantity<0))throw Error('receipt_invalid');lines.push({name:text(l.name),quantity:l.quantity==null?null:Number(l.quantity),amount:amount(l.subtotal),currency:unit,reversed:false,details:[...(l.portion_label?[text(l.portion_label)]:[]),...(l.sale_unit_label?[text(l.sale_unit_label)]:[]),...(l.extras?array(l.extras,50).map(extra=>text(record(extra).label)):[])]});}
 for(const value of array(v.payments,100)){const p=record(value);payments.push({method:text(p.method,80),amount:amount(p.amount),currency:unit,reversal:['refund','reversal'].includes(String(p.kind))});}
 return {merchant:text(v.restaurant),reference:text(v.number,96),date:date(v.date),lines,totals:[{amount:amount(v.total),currency:unit}],...(v.delivery_fee!=null?{deliveryFee:{amount:amount(v.delivery_fee),currency:unit}}:{}),payments,paid:v.paid===true,hasReversals:payments.some(p=>p.reversal)};
}
export function receiptPreview(value:unknown):ReceiptPreview{const v=record(value);if(typeof v.changed!=='boolean')throw Error('receipt_invalid');const item=receiptItem(v);return {...item,changed:v.changed,receipt:receiptDocument(v.receipt,item.source)};}
export const receiptCodes=new Set(['customer_receipt_unavailable','customer_number_invalid','customer_receipt_invalid','customer_number_retry','customer_receipt_idempotency_conflict','customer_receipt_changed','customer_receipt_stale','customer_receipt_expired','customer_receipt_rate_limited']);
export function customerRoute(path:string,method:string):string|null{
 if(path==='id'&&['GET','POST'].includes(method))return 'customer-id';
 if(path==='id/qr'&&method==='GET')return 'customer-id/qr';
 if(path==='receipts'&&method==='GET')return 'customer-receipts';
 if(/^receipts\/CRG_[a-f0-9]{32}(\/receipt)?$/.test(path)&&method==='GET')return path.replace('receipts','customer-receipts');
 if(/^receipts\/CRG_[a-f0-9]{32}\/(accept|reject|revoke)$/.test(path)&&method==='POST')return path.replace('receipts','customer-receipts');
 if(/^links\/(wenze\/WNZ_[A-Za-z0-9_-]+\/receipts\/WRC_[A-Za-z0-9_-]+|restaurant\/RST_[A-Za-z0-9_-]+\/receipts\/ROD_[A-Za-z0-9_-]+)$/.test(path)&&['GET','POST'].includes(method))return path.replace('links','receipt-links');
 if(/^links\/requests\/CRG_[a-f0-9]{32}\/revoke$/.test(path)&&method==='POST')return path.replace('links','receipt-links');
 return null;
}
export function receiptBody(path:string,value:unknown):boolean{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const v=value as Record<string,unknown>,keys=Object.keys(v).sort().join(',');
 if(path==='id'||/^links\/requests\//.test(path))return keys==='';
 if(path.startsWith('links/'))return keys==='customer_number,operation_key,receipt_version'&&typeof v.customer_number==='string'&&v.customer_number.length>=10&&v.customer_number.length<=32&&typeof v.operation_key==='string'&&v.operation_key.length>=1&&v.operation_key.length<=200&&typeof v.receipt_version==='string'&&/^[a-f0-9]{64}$/.test(v.receipt_version);
 return Number.isSafeInteger(v.expected_revision)&&Number(v.expected_revision)>=1&&(path.endsWith('/accept')?keys==='expected_revision,receipt_version'&&typeof v.receipt_version==='string'&&/^[a-f0-9]{64}$/.test(v.receipt_version):keys==='expected_revision');
}

export function customerNumberScan(raw:string):string|null{const match=/^SHIDA ID (\d{10})$/.exec(raw.trim());return match?.[1]??null;}
export function formatReceiptAmount(value:string,locale:string):string{amount(value);const [whole,fraction]=value.split('.');const formatter=new Intl.NumberFormat(locale==='ln'?'fr':locale,{maximumFractionDigits:0});const integer=formatter.format(BigInt(whole));const sign=whole.startsWith('-')&&BigInt(whole)===BigInt(0)?'-':'';const separator=new Intl.NumberFormat(locale==='ln'?'fr':locale).formatToParts(1.1).find(part=>part.type==='decimal')?.value??'.';return sign+integer+(fraction?separator+fraction:'');}
