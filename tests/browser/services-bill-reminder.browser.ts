import {servicesProviderOffering} from "./fixtures/services-provider";
import {test,expect} from '@playwright/test';
import {servicesText} from '../../app/components/shida/services-transaction-copy';
for(const [locale,sendLabel,retryLabel,accepted] of [['en','Send bill','Retry WhatsApp notice','Submitted to WhatsApp'],['fr','Envoyer la facture','Réessayer la notification WhatsApp','Transmis à WhatsApp'],['ln','Tinda facture','Meka lisusu koyebisa na WhatsApp','WhatsApp eyambi botindi'],['sw','Tuma bili','Jaribu tena taarifa ya WhatsApp','Imewasilishwa kwa WhatsApp']] as const)test(`Personal provider send and reminder opt-in/out ${locale}`,async({page})=>{
 const t=(key:string)=>servicesText(locale,key);
 const bill={bill_ref:'SBF_one',version_ref:'SBV_one',revision:2,status:'issued',source_kind:'accepted_quote',currency:'USD',total:'15.25',issue_date:'2026-10-16',due_date:'2026-10-23',lines:[{ordinal:1,label:'Agreed work',amount:'15.25'}]};
 const booking={reservation_ref:'RSV_one',offering_ref:'SVC_one',service_name:'Repairs',requester_name:'Customer',status:'confirmed',revision:1,can_respond:false};
 const labels={en:['Enable one reminder','Disable reminder'],fr:['Activer un rappel','Désactiver le rappel'],ln:['Fungola bokundoli moko','Kanga bokundoli'],sw:['Washa kikumbusho kimoja','Zima kikumbusho']}[locale];
 let reminder={version_ref:'SBV_one',revision:0,scheduled_at:'2030-01-02T09:00:00Z',state:'off',can_enable:false,can_disable:false,status:null};
 let deliveries:Record<string,unknown>[]=[];let writes=0;
 await page.route('**/api/shida/**',route=>{
  const path=new URL(route.request().url()).pathname,tx=path.split('/transactions/')[1];
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_free',access_policy:'pilot',purchase_required:false,capabilities:['reservations','messages','bills']}});
  if(tx?.endsWith('/reminder')){const body=route.request().postDataJSON();expect(body.reminder_revision).toBe(reminder.revision);reminder={...reminder,revision:reminder.revision+1,state:body.enabled?'scheduled':'off',can_enable:!body.enabled,can_disable:body.enabled};return route.fulfill({json:{deliveries,reminder}});}
  if(tx?.endsWith('/send')||tx?.endsWith('/retry')){writes++;reminder.can_enable=true;deliveries=[{version_ref:'SBV_one',revision:2,status:tx.endsWith('/send')?'retryable_failure':'sent',attempts:writes,created_at:'2026-10-16T12:00:00Z',can_retry:tx.endsWith('/send')}];return route.fulfill({json:{deliveries,reminder}});}
  const responses:Record<string,unknown>={requests:{requests:[]},reservations:{reservations:[booking]},'reservations/RSV_one':booking,'reservations/RSV_one/lifecycle':{...booking,actions:[],rescheduling:{actions:[],proposal:null}},'reservations/RSV_one/bills':{bill_ref:'SBF_one',current:bill},'bills/SBF_one/history':{versions:[bill]},'bills/SBF_one/deliveries':{deliveries,reminder}};
  return route.fulfill({json:responses[tx]??{profiles:[servicesProviderOffering]}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=work`);
 const workspace=page.getByRole('region',{name:t('workspace')});
 await workspace.getByRole('button',{name:t('reservations'),exact:true}).click();
 await workspace.getByRole('button',{name:/Repairs/}).click();
 await page.getByRole('button',{name:sendLabel,exact:true}).click();
 await page.getByRole('button',{name:retryLabel,exact:true}).click();
 await expect(page.getByText(accepted,{exact:true})).toBeVisible();expect(writes).toBe(2);
 await expect(page.getByRole('button',{name:retryLabel})).toHaveCount(0);
 await expect(page.locator('time[datetime="2030-01-02T09:00:00Z"]')).toContainText('Kinshasa');
 await expect(page.locator('time[datetime="2030-01-02T09:00:00Z"]')).toContainText('10:00');
 await page.getByRole('button',{name:labels[0],exact:true}).click();
 await page.getByRole('button',{name:labels[1],exact:true}).click();
 await expect(page.getByRole('button',{name:labels[0],exact:true})).toBeVisible();
});
