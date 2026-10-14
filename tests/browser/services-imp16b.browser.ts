import {test,expect} from '@playwright/test';

const titles={en:'Services reports',fr:'Rapports Services',ln:'Balapolo ya Services',sw:'Ripoti za Huduma'} as const;
const requests={en:'Requests created',fr:'Demandes créées',ln:'Bosengi oyo esalemi',sw:'Maombi yaliyoundwa'} as const;
const zeros={billed:'0.00',declared_received:'0.00',outstanding:'0.00',recorded_expenses:'0.00',declared_surplus:'0.00'};
for(const locale of ['en','fr','ln','sw'] as const)test(`IMP-16B Personal mobile reports ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:850});
 await page.addInitScript(language=>localStorage.setItem('shida-language',language),locale);
 await page.route('**/api/shida/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_pro',access_policy:'pilot',purchase_required:false,capabilities:['operational_reports','financial_reports']}});
  if(path.endsWith('/services'))return route.fulfill({json:{profiles:[]}});
  if(path.endsWith('/transactions/reports/operational'))return route.fulfill({json:{start_date:'2026-10-01',end_date:'2026-10-15',as_of:'2026-10-14T12:00:00+00:00',published_offerings:1,requests_created:2,bookings_created:1,booking_statuses:{completed:1},unavailable:['quote_conversion'],offerings:[{offering_ref:'SVC_one',offering:'Repair',published_now:true,requests_created:2,bookings_created:1,booking_statuses:{completed:1}}]}});
  if(path.endsWith('/transactions/reports/financial'))return route.fulfill({json:{as_of:'2026-10-14T12:00:00+00:00',currencies:{CDF:zeros,USD:{...zeros,declared_received:'30.00',recorded_expenses:'9.00',declared_surplus:'21.00'}},expense_categories:{CDF:{},USD:{transport:'9.00'}}}});
  if(path.endsWith('/transactions/reports/operational.csv'))return route.fulfill({body:'offering,bookings_created\nRepair,1\n',contentType:'text/csv',headers:{'Content-Disposition':'attachment; filename="services-operational-report.csv"'}});
  return route.fulfill({json:{}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services`);
 const report=page.getByRole('region',{name:titles[locale]});
 await report.getByRole('button',{name:/report|rapport|lapolo|ripoti/i}).first().click();
 await expect(report.getByText('Repair')).toBeVisible();
 await expect(report.getByText(requests[locale]).first()).toBeVisible();
 await expect(report.getByText('21.00 USD')).toBeVisible();
 await expect(report.getByText('2026-10-14T12:00:00+00:00').first()).toBeVisible();
 const [download]=await Promise.all([page.waitForEvent('download'),report.getByRole('button').nth(1).click()]);
 expect(download.suggestedFilename()).toBe('services-operational-report.csv');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
});
