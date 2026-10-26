import {test,expect} from '@playwright/test';
import {servicesProviderOffering} from './fixtures/services-provider';
import {counterCopy} from '../../app/lib/services-counter-copy';
import {counterAdjustmentCopy} from '../../app/lib/services-counter-adjustment-copy';
import type {CounterSale} from '../../app/components/shida/services-counter';

for(const [locale,width] of [['en',1440],['fr',390],['ln',820],['sw',320]] as const)test(`Counter refund and correction ${locale} ${width}`,async({page})=>{
 const t=counterCopy[locale],a=counterAdjustmentCopy[locale];
 let sale:CounterSale={sale_ref:'SCS_one',customer_name:'Original client',presentation:{display_name:'Belleza Salon'},currency:'USD',total:'30.00',received:'30.00',outstanding:'0.00',refund_due:'0.00',revision:1,effective_date:'2026-10-01',lines:[{offering_ref:'SVC_one',package_ref:null,service_name:'Hair styling',package_name:null,quantity:2,unit_price:'15.00',amount:'30.00'}],payments:[{receipt_ref:'SCR_one',amount:'30.00',method:'cash',effective_date:'2026-10-01'}],adjustments:[]};
 const original={...sale,payments:[],adjustments:[]};sale.original=original;sale.payments[0].document=original;
 const requests:Record<string,unknown>[]=[];
 await page.setViewportSize({width,height:1000});
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Owner'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','bills','manual_journal','basic_totals','structured_availability']});
  if(path.endsWith('/services'))return reply({profiles:[{...servicesProviderOffering,service_name:'Hair styling',packages:[]}]});
  if(path.endsWith('/bill-presentation'))return reply({preview:{display_name:'Belleza Salon'}});
  if(path.endsWith('/counter'))return reply({sales:[sale],next_offset:null});
  if(path.endsWith('/adjustments')){
   const body=route.request().postDataJSON();requests.push(body);
   if(body.kind==='refund'){
    sale={...sale,total:'25.00',received:'25.00',revision:2};
    sale.adjustments=[{adjustment_ref:'SCA_refund',kind:'refund',reason_code:'customer_refund',amount:'5.00',bill_delta:'-5.00',method:'cash',effective_date:body.effective_date,receipt_ref:null,document:{...sale,payments:[],adjustments:[]} as CounterSale}];
   }else{
    sale={...sale,customer_name:body.customer_name,total:'10.00',refund_due:'15.00',revision:3,lines:[{...sale.lines[0],quantity:1,amount:'15.00'}]};
    sale.adjustments=[...sale.adjustments!,{adjustment_ref:'SCA_correction',kind:'bill_correction',reason_code:body.reason_code,amount:'0.00',bill_delta:'-15.00',method:null,effective_date:body.effective_date,receipt_ref:null,document:{...sale,payments:[],adjustments:[]} as CounterSale}];
   }return reply(sale);
  }
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=counter`);
 await page.getByRole('button',{name:/Original client · 2026/}).click();
 const panel=page.locator('.svc-counter-adjustments');
 await panel.getByLabel(a.amount,{exact:true}).fill('5');
 await panel.getByRole('button',{name:a.refund,exact:true}).click();
 await expect(page.getByRole('region',{name:a.review})).toContainText('5 USD');
 await panel.getByRole('button',{name:t.confirm,exact:true}).click();
 await expect(page.locator('.svc-counter-receipt')).toContainText(a.refundReceipt);
 expect(requests[0]).toMatchObject({kind:'refund',amount:'5.00',expected_revision:1});
 await page.locator('.svc-counter-controls').getByRole('combobox',{name:t.receiptChoice,exact:true}).selectOption('SCR_one');
 await expect(page.locator('.svc-counter-receipt')).toContainText('30.00 USD');
 await panel.getByRole('combobox',{name:a.title,exact:true}).selectOption('bill_correction');
 await panel.getByLabel(t.customer,{exact:true}).fill('Corrected client');
 await panel.getByLabel(t.quantity,{exact:true}).fill('1');
 await panel.getByRole('button',{name:a.bill_correction,exact:true}).click();
 await expect(page.getByRole('region',{name:a.review})).toContainText('Corrected client');
 await panel.getByRole('button',{name:t.confirm,exact:true}).click();
 await expect(page.locator('.svc-counter-receipt')).toContainText(a.correctionReceipt);
 await expect(page.locator('.svc-counter-receipt')).toContainText(a.refundDue);
 expect(requests[1]).toMatchObject({kind:'bill_correction',expected_revision:2,customer_name:'Corrected client'});
 await page.locator('.svc-counter-controls').getByRole('combobox',{name:t.receiptChoice,exact:true}).selectOption('original');
 await expect(page.locator('.svc-counter-receipt')).toContainText('Original client');
 await page.locator('.svc-counter-controls').getByRole('combobox',{name:t.receiptChoice,exact:true}).selectOption('SCA_refund');
 await page.getByRole('combobox',{name:t.format,exact:true}).selectOption('58');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/counter-adjustment-${locale}-${width}.png`,fullPage:true});
 await page.evaluate(()=>{window.print=()=>{};});await page.getByRole('button',{name:t.print,exact:true}).click();await page.emulateMedia({media:'print'});
 await expect(page.locator('.svc-counter-print .svc-counter-receipt')).toContainText(a.refundReceipt);
 await expect(panel).toBeHidden();
});

test('payment reversal retries the identical request after an uncertain response',async({page})=>{
 const t=counterCopy.en,a=counterAdjustmentCopy.en;
 const sale:CounterSale={sale_ref:'SCS_retry',customer_name:'Retry client',presentation:{display_name:'Salon'},currency:'USD',total:'30.00',received:'10.00',outstanding:'20.00',revision:1,effective_date:'2026-10-01',lines:[{offering_ref:'SVC_one',package_ref:null,service_name:'Hair styling',package_name:null,quantity:2,unit_price:'15.00',amount:'30.00'}],payments:[{receipt_ref:'SCR_retry',amount:'10.00',method:'cash',effective_date:'2026-10-01'}],adjustments:[]};
 const envelopes:{key:string|undefined;body:string|null}[]=[];
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Owner'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','bills','manual_journal','basic_totals','structured_availability']});
  if(path.endsWith('/services'))return reply({profiles:[servicesProviderOffering]});
  if(path.endsWith('/bill-presentation'))return reply({preview:{display_name:'Salon'}});
  if(path.endsWith('/counter'))return reply({sales:[sale],next_offset:null});
  if(path.endsWith('/adjustments')){
   envelopes.push({key:route.request().headers()['idempotency-key'],body:route.request().postData()});
   if(envelopes.length===1)return route.fulfill({status:503,json:{detail:'unavailable'}});
   const doc={...sale,received:'0.00',outstanding:'30.00',revision:2};
   sale.received='0.00';sale.outstanding='30.00';sale.revision=2;sale.payments[0].reversed=true;
   sale.adjustments=[{adjustment_ref:'SCA_retry',kind:'payment_reversal',reason_code:'wrong_amount',amount:'10.00',bill_delta:'0.00',method:null,effective_date:'2026-10-26',receipt_ref:'SCR_retry',document:doc}];
   return reply(sale);
  }
  if(path.endsWith('/reviews'))return reply({reviews:[]});return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto('/shida/seller/services?view=counter');await page.getByRole('button',{name:/Retry client · 2026/}).click();
 const panel=page.locator('.svc-counter-adjustments');
 await panel.getByRole('combobox',{name:a.title,exact:true}).selectOption('payment_reversal');
 await panel.getByRole('combobox',{name:t.receiptChoice,exact:true}).selectOption('SCR_retry');
 await panel.getByRole('button',{name:a.payment_reversal,exact:true}).click();await panel.getByRole('button',{name:t.confirm,exact:true}).click();
 await expect(panel.getByRole('button',{name:t.retry,exact:true})).toBeVisible();
 await expect(panel.getByRole('combobox',{name:a.title,exact:true})).toBeDisabled();
 await panel.getByRole('button',{name:t.retry,exact:true}).click();
 await expect(page.locator('.svc-counter-receipt')).toContainText(a.reversalReceipt);
 expect(envelopes).toHaveLength(2);expect(envelopes[0].key).toBeTruthy();expect(envelopes[1]).toEqual(envelopes[0]);
});
