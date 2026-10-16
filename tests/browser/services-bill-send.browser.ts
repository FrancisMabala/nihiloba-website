import {test,expect} from '@playwright/test';
import {servicesText} from '../../app/components/shida/services-transaction-copy';
for(const [locale,sendLabel,retryLabel,accepted] of [['en','Send bill','Retry WhatsApp notice','Accepted by Meta'],['fr','Envoyer la facture','Réessayer la notification WhatsApp','Accepté par Meta'],['ln','Tinda facture','Meka lisusu koyebisa na WhatsApp','Meta endimi'],['sw','Tuma bili','Jaribu tena taarifa ya WhatsApp','Imekubaliwa na Meta']] as const)test(`Personal provider send and retry ${locale}`,async({page})=>{
 const t=(key:string)=>servicesText(locale,key);
 const bill={bill_ref:'SBF_one',version_ref:'SBV_one',revision:2,status:'issued',source_kind:'accepted_quote',currency:'USD',total:'15.25',issue_date:'2026-10-16',due_date:'2026-10-23',lines:[{ordinal:1,label:'Agreed work',amount:'15.25'}]};
 const booking={reservation_ref:'RSV_one',offering_ref:'SVC_one',service_name:'Repairs',requester_name:'Customer',status:'confirmed',revision:1,can_respond:false};
 let deliveries:Record<string,unknown>[]=[];let writes=0;
 await page.route('**/api/shida/**',route=>{
  const path=new URL(route.request().url()).pathname,tx=path.split('/transactions/')[1];
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_free',access_policy:'pilot',purchase_required:false,capabilities:['reservations','messages','bills']}});
  if(tx?.endsWith('/send')||tx?.endsWith('/retry')){writes++;deliveries=[{version_ref:'SBV_one',revision:2,status:tx.endsWith('/send')?'retryable_failure':'sent',attempts:writes,created_at:'2026-10-16T12:00:00Z',can_retry:tx.endsWith('/send')}];return route.fulfill({json:{deliveries}});}
  const responses:Record<string,unknown>={requests:{requests:[]},reservations:{reservations:[booking]},'reservations/RSV_one':booking,'reservations/RSV_one/lifecycle':{...booking,actions:[],rescheduling:{actions:[],proposal:null}},'reservations/RSV_one/bills':{bill_ref:'SBF_one',current:bill},'bills/SBF_one/history':{versions:[bill]},'bills/SBF_one/deliveries':{deliveries}};
  return route.fulfill({json:responses[tx]??{profiles:[]}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services`);
 const workspace=page.getByRole('region',{name:t('workspace')});
 await workspace.getByRole('button',{name:t('reservations'),exact:true}).click();
 await workspace.getByRole('button',{name:/Repairs/}).click();
 await page.getByRole('button',{name:sendLabel,exact:true}).click();
 await page.getByRole('button',{name:retryLabel,exact:true}).click();
 await expect(page.getByText(new RegExp(accepted))).toBeVisible();expect(writes).toBe(2);
 await expect(page.getByRole('button',{name:retryLabel})).toHaveCount(0);
});
