import {test,expect} from '@playwright/test';
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`Services ${locale} ${width}`,async({page})=>{
 let row={public_ref:'SVC_personal',provider_ref:'SVI_personal',name:'Solo provider',service_name:'Home repair',category:'repair_maintenance',description:'Careful repairs',service_duration_minutes:60,commune:'Gombe',service_location_type:'private_home',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'unclassified',visible_to_customers:false,requests_enabled:false,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const writes:{path:string;body:Record<string,unknown>}[]=[];
 await page.route('**/api/shida/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,"");
  if(path.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Solo provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_pro',access_policy:'pilot',purchase_required:false,capabilities:['profile','packages','reservations','messages','structured_availability','basic_totals']}});
  if(path==='/api/shida/personal/services'){
   if(request.method()==='GET')return route.fulfill({json:{profiles:[row]}});
   return route.fulfill({status:403,json:{detail:'service_profile_access_denied'}});
  }
  if(path.endsWith('/onboarding'))return route.fulfill({json:{progress:[],remaining_capacity:4,professional_profile:{public_ref:row.provider_ref,revision:1,name:row.name,primary_category:null}}});
  if(path.includes('/transactions/finance'))return route.fulfill({status:503,json:{detail:'test_unavailable'}});
  if(path.includes('/transactions/'))return route.fulfill({json:{requests:[],reservations:[],threads:[],has_more:false}});
  if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith('/pilot-review')&&request.method()==='PATCH'){
   const body=request.postDataJSON() as Record<string,unknown>;writes.push({path,body});
   if(body.expected_revision!==row.revision)return route.fulfill({status:409,json:{detail:{code:'service_profile_stale'}}});
   row={...row,publication_origin:'pilot',visible_to_customers:true,revision:row.revision+1};return route.fulfill({json:row});
  }
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });

 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?offering=SVC_personal`);
 const nav=page.locator('.management-mobile-nav');await expect(nav).toHaveCount(1);
 if(width<1024){await expect(nav).toBeVisible();const more=nav.locator('[aria-haspopup=dialog]');await more.click();const sheet=page.locator('.management-more-sheet');await expect(sheet).toBeVisible();await page.keyboard.press('Escape');await expect(more).toBeFocused();
  for(const index of Array.from({length:await nav.locator('button:not([aria-haspopup])').count()},(_,i)=>i)){await nav.locator('button').nth(index).click();await expect(nav.locator('button').nth(index)).toHaveAttribute('aria-current','page');}
 } else await expect(nav).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(writes).toEqual([]);
 if(locale==='fr')await page.screenshot({path:`${process.env.SHIDA_MOBILE_EVIDENCE_DIR||'test-results/management-mobile/evidence'}/web-services-${width}.png`,fullPage:true});
});
