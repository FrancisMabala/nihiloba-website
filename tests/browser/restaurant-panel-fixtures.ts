import type {Page} from '@playwright/test';
import {restaurantFixture} from './responsive-rollout-fixtures';

const at='2026-11-18T12:00:00Z';
export async function restaurantPanelFixture(page:Page,count=1){
 const account=await restaurantFixture(page,count);
 await page.route('**/today-orders/**',route=>route.fulfill({json:{version:1,intake_released:true,sections:Object.fromEntries(['pending','ready','preparing'].map(key=>[key,{items:[],total:0,as_of:at}]))}}));
 await page.route('**/service/daily/summary/**',route=>route.fulfill({json:{as_of:at,time_zone:'Africa/Kinshasa',currencies:{CDF:{recorded_net:'3000',balance_due:'0'},USD:{recorded_net:'5',balance_due:'0'}}}}));
 await page.route('**/RST_0/hours/**',route=>route.fulfill({json:{revision:at,result:{status:'known',timezone_name:'Africa/Kinshasa',schedule:{windows:[{weekday:0,start:'09:00',end:'17:00'}]},exceptional_closures:[]}}}));
 await page.route('**/service/financial/invoices/**',route=>route.fulfill({json:{items:[],has_more:false}}));
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/time-zone'))return route.fulfill({json:{time_zone:'Africa/Kinshasa',time_zone_revision:1,confirmed_at:at}});
  if(p.endsWith('/reports'))return route.fulfill({json:{reports:[],next_before:null}});
  if(p.includes('/days/')&&p.endsWith('/preview')){
   const cash={opening:null,counted:null,cash_receipts_net:'3000',actual_cash_refunds:'0',cash_expense_effect:'0',cash_movements:'0',expected:null,discrepancy:null};
   return route.fulfill({json:{local_date:p.split('/days/')[1].split('/')[0],time_zone:'Africa/Kinshasa',revision:1,closed:false,preview_revision:'a'.repeat(64),currencies:{CDF:{opening:null,counted:null},USD:{opening:null,counted:null}},cash:{CDF:cash,USD:{...cash,cash_receipts_net:'0'}},expenses:{CDF:'0',USD:'0'},outstanding:{CDF:{balance_due:'0',refund_owed:'0'},USD:{balance_due:'0',refund_owed:'0'}},open_orders:{count:0,refs:[]},stock_exceptions:{count:0,refs:[]},methods:[],supplemental_adjustment_count:0,supplemental_adjustments:[]}});
  }
  if(p.endsWith('/service/financial/entries'))return route.fulfill({json:{entries:[],financial_revision:0,next_after_revision:null}});
  if(p.endsWith('/service/financial/activity'))return route.fulfill({json:{items:[],next_before:null}});
  if(p.endsWith('/service/payment-methods'))return route.fulfill({json:{items:[{method_ref:'RPM_cash',label:'Espèces',kind:'cash',currencies:['CDF','USD'],enabled:true}]}});
  // Settings reads this after mounting. A missing fixture is a real 404/access
  // denial, not a recoverable panel error or a successful disabled setting.
  if(p.endsWith('/guest-auto-accept'))return route.fulfill({json:{enabled:false,revision:1}});
  // This destination deliberately exercises recoverable read failures. A 404
  // means access loss in this workflow and must retain its real denial behavior.
  if(p.endsWith('/insights')||p.endsWith('/order-summary'))return route.fulfill({status:503,json:{detail:'synthetic_read_failure'}});
  return route.fallback();
 });
 return account;
}
