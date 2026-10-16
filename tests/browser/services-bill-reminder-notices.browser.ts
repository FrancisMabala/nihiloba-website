import {test,expect} from '@playwright/test';
for(const [locale,label,open] of [['en','Service bill reminder','Open current statement'],['fr','Rappel de facture de service','Ouvrir le relevé actuel'],['ln','Bokundoli ya facture ya mosala','Fungola mokanda ya sikawa'],['sw','Kikumbusho cha bili ya huduma','Fungua taarifa ya sasa']] as const)test(`customer reminder opens current private statement ${locale}`,async({page})=>{
 await page.setViewportSize({width:390,height:800});
 await page.route('**/api/shida/**',route=>{const path=new URL(route.request().url()).pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Customer'}}});
  if(path.endsWith('/customer/bill-notices'))return route.fulfill({json:{notices:[{version_ref:'SBV_void',kind:'reminder',current:true,statement_path:'/shida/service-bills/RSV_one'}],has_more:false}});
  if(path.endsWith('/customer/reservations/RSV_one/bills'))return route.fulfill({json:{versions:[{version_ref:'SBV_void',bill_ref:'SBF_one',revision:4,status:'void',currency:'CDF',total:'150000.00',issue_date:null,due_date:null,presentation:{display_name:'Studio Kivu',accent:'blue'},lines:[]}]}});
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/service-bills`);
 await expect(page.getByText(label)).toBeVisible();
 expect(await page.locator('body').innerText()).not.toContain('150000');
 await page.getByRole('link',{name:open}).click();
 await expect(page.locator('.service-bill-sheet')).toBeVisible();
 await expect(page.getByText('Studio Kivu')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
