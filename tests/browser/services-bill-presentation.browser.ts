import {test,expect} from '@playwright/test';

const labels={en:{history:'Issued history',print:'Print selected statement'},fr:{history:'Historique des versions émises',print:'Imprimer le relevé choisi'},ln:{history:'Lisolo ya mikanda',print:'Imprimer mokanda oyo'},sw:{history:'Historia ya matoleo',print:'Chapisha taarifa iliyochaguliwa'}} as const;
for(const [locale,width] of [['en',320],['fr',390],['ln',430],['sw',360]] as const)test(`customer frozen statement and print ${locale}`,async({page})=>{
 await page.setViewportSize({width,height:800});
 const versions=[
  {version_ref:'SBV_first',bill_ref:'SBF_one',revision:2,status:'issued',currency:'CDF',total:'150000.00',issue_date:'2026-10-14',due_date:'2026-10-21',presentation:{identity_name:'Kivu Services',display_name:'Studio Kivu',accent:'blue'},lines:[{ordinal:1,label:'Approved work',amount:'150000.00'}]},
  {version_ref:'SBV_second',bill_ref:'SBF_one',revision:3,status:'issued',currency:'CDF',total:'150000.00',issue_date:'2026-10-15',due_date:'2026-10-22',presentation:{display_name:'Maison Verte',accent:'green'},lines:[{ordinal:1,label:'Corrected work',amount:'150000.00'}]},
  {version_ref:'SBV_void',bill_ref:'SBF_one',revision:4,status:'void',currency:'CDF',total:'150000.00',issue_date:null,due_date:null,presentation:{display_name:'Maison Verte',accent:'green'},lines:[]}
 ];
 await page.route('**/api/shida/**',route=>{const path=new URL(route.request().url()).pathname;if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Customer'}}});if(path.endsWith('/customer/reservations/RSV_one/bills'))return route.fulfill({json:{versions:[{version_ref:'SBV_draft',status:'private_draft',lines:[{private_detail:'PRIVATE'}]},...versions]}});return route.fulfill({status:404,json:{detail:'unavailable'}});});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/service-bills/RSV_one`);
 await expect(page.getByText('Maison Verte').first()).toBeVisible();
 await page.getByRole('button',{name:/2 ·/}).click();
 await expect(page.getByText('Studio Kivu').first()).toBeVisible();
 await expect(page.getByText(/Kivu Services/)).toBeVisible();
 await expect(page.getByText('Approved work')).toBeVisible();
 await expect(page.getByText('150000.00 CDF').first()).toBeVisible();
 expect(await page.locator('body').innerText()).not.toContain('PRIVATE');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.service-bill-controls').first()).toBeHidden();
 await expect(page.locator('.service-bill-sheet')).toBeVisible();
 await page.emulateMedia({media:'screen'});
 await page.evaluate(()=>{(window as Window&{__printed?:boolean}).__printed=false;window.print=()=>{(window as Window&{__printed?:boolean}).__printed=true;};});
 await page.getByRole('button',{name:labels[locale].print}).click();
 expect(await page.evaluate(()=>(window as Window&{__printed?:boolean}).__printed)).toBe(true);
});
