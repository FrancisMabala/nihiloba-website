import {test,expect} from '@playwright/test';

const labels={en:{title:'My Services',publish:'Review and publish',pro:'Personal Pro'},fr:{title:'Mes services',publish:'Vérifier et publier',pro:'Personal Pro'},ln:{title:'Misala na ngai',publish:'Tala mpe bimisa',pro:'Personal Pro'},sw:{title:'Huduma zangu',publish:'Kagua na chapisha',pro:'Personal Pro'}} as const;
for(const [locale,width] of [['en',320],['fr',390],['ln',430],['sw',768]] as const)test(`Personal Services ${locale} mobile ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});
 let row={public_ref:'SVC_personal',provider_ref:'SVI_personal',name:'Solo provider',service_name:'Home repair',category:'repair_maintenance',description:'Careful repairs',service_duration_minutes:60,commune:'Gombe',service_location_type:'private_home',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'unclassified',requests_enabled:false,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 const writes:{path:string;body:Record<string,unknown>}[]=[];
 await page.route('**/api/shida/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Solo provider'}}});
  if(path==='/api/shida/personal/services'){
   if(request.method()==='GET')return route.fulfill({json:{profiles:[row]}});
   return route.fulfill({status:403,json:{detail:'service_profile_access_denied'}});
  }
  if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});
  if(path.endsWith('/pilot-review')&&request.method()==='PATCH'){
   const body=request.postDataJSON() as Record<string,unknown>;writes.push({path,body});
   if(body.expected_revision!==row.revision)return route.fulfill({status:409,json:{detail:{code:'service_profile_stale'}}});
   row={...row,publication_origin:'pilot',revision:row.revision+1};return route.fulfill({json:row});
  }
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services`);
 await expect(page.getByRole('heading',{name:labels[locale].title})).toBeVisible();
 await expect(page.getByText('Home repair').first()).toBeVisible();
 await page.getByRole('button',{name:labels[locale].pro}).click();
 await expect(page.getByRole('button',{name:labels[locale].pro})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:labels[locale].publish}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].body).toEqual({expected_revision:1});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
