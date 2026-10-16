import {providerCopy} from "../../app/lib/services-provider-copy";
import {test,expect} from '@playwright/test';

const labels={
 en:{history:'Past work with a customer',costs:'Job costs',category:'Expenses by category',trail:'Correction trail'},
 fr:{history:'Travaux passés avec un client',costs:'Coûts de la mission',category:'Dépenses par catégorie',trail:'Historique des corrections'},
 ln:{history:'Misala ya kala na client',costs:'Depanse ya mosala',category:'Depanse na lolenge',trail:'Lisolo ya mabongisi'},
 sw:{history:'Kazi za awali na mteja',costs:'Gharama za kazi',category:'Gharama kwa aina',trail:'Historia ya masahihisho'},
} as const;
const zero={billed:'0.00',declared_received:'0.00',outstanding:'0.00',unbilled_receipts:'0.00',declared_excess:'0.00',job_expenses:'0.00',services_overhead:'0.00',recorded_expenses:'0.00',declared_surplus:'0.00'};
const offering={public_ref:'SVC_one',provider_ref:'SVI_one',name:'Provider',service_name:'Repair',category:'repair_maintenance',description:'Repair work',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'no',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
const reservations=[{reservation_ref:'RSV_one',service_name:'Repair',requester_name:'Customer',status:'completed',revision:1},{reservation_ref:'RSV_two',service_name:'Repair',requester_name:'Customer',status:'confirmed',revision:1}];
const entries=[
 {entry_ref:'PSE_replace',measure:'recorded_expense',direction:1,amount:'9.00',currency:'USD',effective_date:'2026-10-14',category:'transport',effect:'replacement',correction_state:'replacement',recorded_at:'2026-10-14T12:00:00Z'},
 {entry_ref:'PSE_reverse',measure:'recorded_expense',direction:-1,amount:'12.00',currency:'USD',effective_date:'2026-10-14',category:'transport',effect:'reversal',correction_state:'reversal',recorded_at:'2026-10-14T12:00:00Z'},
 {entry_ref:'PSE_original',measure:'recorded_expense',direction:1,amount:'12.00',currency:'USD',effective_date:'2026-10-14',category:'transport',effect:'initial',correction_state:'corrected_original',recorded_at:'2026-10-14T11:00:00Z'},
];

for(const locale of ['en','fr','ln','sw'] as const)test(`IMP-16A Personal mobile review ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:850});
 await page.addInitScript(language=>localStorage.setItem('shida-language',language),locale);
 await page.route('**/api/shida/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_pro',access_policy:'pilot',purchase_required:false,capabilities:['profile','reservations','messages','basic_totals']}});
  if(path.endsWith('/services'))return route.fulfill({json:{profiles:[offering]}});
  if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith('/transactions/reservations'))return route.fulfill({json:{reservations}});
  if(path.endsWith('/transactions/reservations/RSV_one/lifecycle'))return route.fulfill({json:{...reservations[0],actions:[],rescheduling:{actions:[],proposal:null}}});
  if(path.endsWith('/transactions/reservations/RSV_one'))return route.fulfill({json:reservations[0]});
  if(path.endsWith('/transactions/finance/totals'))return route.fulfill({json:{currencies:{CDF:zero,USD:zero}}});
  if(path.endsWith('/transactions/finance/reservations/RSV_one/totals'))return route.fulfill({json:{currencies:{CDF:zero,USD:{...zero,declared_received:'30.00',job_expenses:'9.00',recorded_expenses:'9.00',declared_surplus:'21.00'}},expense_categories:{CDF:{},USD:{transport:'9.00'}}}});
  if(path.endsWith('/transactions/finance/entries'))return route.fulfill({json:{entries,next_offset:null}});
  if(path.endsWith('/transactions/reservations/RSV_one/customer-history'))return route.fulfill({json:{customer:'Customer',jobs:[{reservation_ref:'RSV_one',offering:'Repair',status:'completed',requested_date:'2030-02-02',request_ref:null,quote_ref:null,thread_ref:null,bill_family_ref:null},{reservation_ref:'RSV_two',offering:'Repair',status:'confirmed',requested_date:'2030-02-03',request_ref:null,quote_ref:null,thread_ref:null,bill_family_ref:null}],next_offset:null}});
  if(path.endsWith('/transactions/requests'))return route.fulfill({json:{requests:[],has_more:false}});
  if(path.endsWith('/transactions/messages'))return route.fulfill({json:{threads:[]}});
  return route.fulfill({json:{}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=work`);
 const history=page.getByRole('region',{name:labels[locale].history});
 await history.getByRole('combobox').selectOption('RSV_one');
 await expect(history.getByRole('article')).toHaveCount(2);
 await history.getByRole('button',{name:labels[locale].costs}).first().click();
 const totals=page.getByRole('region',{name:locale==='en'?'Services totals':locale==='fr'?'Totaux Services':locale==='ln'?'Mitango ya Services':'Jumla za Huduma'});
 await expect(totals.getByRole('heading',{name:labels[locale].category})).toBeVisible();
 await expect(totals.getByRole('heading',{name:labels[locale].trail})).toBeVisible();
 await expect(totals.getByText('9.00 USD').first()).toBeVisible();
 await page.getByRole("navigation",{name:providerCopy[locale].navigation}).getByRole("button",{name:providerCopy[locale].work,exact:true}).click();
 await history.locator('article').first().getByRole('button').first().click();
 await expect(page.locator('.services-transactions fieldset h3').filter({hasText:'Repair'})).toBeVisible();
 await expect(page.locator('body')).not.toContainText('Private address');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});
