import {apartmentInterestCopy} from '../../app/lib/apartment-interest-copy';
import {test, expect} from '@playwright/test';
import {apartmentSafetyCopy} from '../../app/lib/apartment-safety-copy';
import {apartmentCreationCopy} from '../../app/lib/apartment-creation-copy';
import {marketplaceCopy} from '../../app/components/shida/marketplace-copy';
import {readFileSync} from 'node:fs';
for (const width of [390,1440]) for (const locale of ['en','fr','ln','sw'] as const) {
 test(`private apartment report ${locale} ${width}`, async({page}) => {
  await page.setViewportSize({width,height:900});
  const writes:unknown[] = [];
  await page.route('https://api.nihiloba.com/api/apartments/photos/**', route=>route.fulfill({contentType:'image/webp',body:readFileSync('public/images/apartment-discovery.webp')}));
  await page.route('**/api/shida/**', route => {
   const path = new URL(route.request().url()).pathname;
   if(path.includes('/employment/session')) return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Test visitor'}}});
   if(path.includes('/support/apartment-report')) {writes.push(route.request().postDataJSON()); return route.fulfill({json:{reference:'SCT_fixture',status:'persisted'}});}
   return route.fulfill({status:404,json:{}});
  });
  await page.goto(`${locale === 'en' ? '' : '/'+locale}/shida/appartements/limete-fixture/`);
  const t = apartmentSafetyCopy[locale];
  await expect(page.getByRole('heading',{name:t.title})).toBeVisible();
  await expect(page.getByText(t.property,{exact:true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button',{name:t.report,exact:true}).click();
  await expect(page.getByRole('dialog',{name:t.report})).toBeVisible();
  await page.getByLabel(t.description,{exact:true}).fill('Controlled misleading listing report');
  await page.getByRole('button',{name:t.send,exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:t.saved})).toBeVisible();
  expect(writes).toEqual([{listing_ref:'APT_fixture',reason:'false_property',message:'Controlled misleading listing report',language:locale}]);
  await page.getByRole('dialog').getByRole('button',{name:t.close,exact:true}).last().click();
  if(locale === 'fr') {await page.evaluate(()=>{document.documentElement.style.setProperty('scroll-behavior','auto','important');window.scrollTo({top:0,behavior:'instant'});});await page.screenshot({path:`test-results/apartments-batch4-${width}.png`,fullPage:true});}
 });
}

for (const width of [390,1440]) for (const locale of ['en','fr','ln','sw'] as const) {
 test(`explicit web apartment creation ${locale} ${width}`,async({page}) => {
  await page.setViewportSize({width,height:900});
  const t=apartmentCreationCopy[locale], m=marketplaceCopy[locale];
  const writes:string[]=[];
  const draft={reference:'APT_browser',revision:1,status:'DRAFT',values:{public_name:'Owner Example',property_type:null as string|null,city:null as string|null,commune:'',quartier:'',number_of_rooms:0,bedroom_count:null as number|null,size_sqm:null,description:'',price:0,currency:'USD',advertiser_role:null as string|null,amenities:{}},photos:[] as {reference:string;url:string}[]};
  const image=readFileSync('public/images/apartment-discovery.webp');
  await page.route('**/api/shida/**',async route => {
   const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
   if(path==='/api/shida/employment/session')return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Owner Example'}}});
   if(!path.startsWith('/api/shida/personal/apartments'))return route.fulfill({status:404,json:{}});
   if(request.method()==='GET'&&path.includes('/photos/'))return route.fulfill({contentType:'image/webp',body:image});
   if(request.method()==='GET')return route.fulfill({json:{items:[],identity:{public_name:'Owner Example',existing_profile:false},kinshasa_communes:['Limete','Gombe']}});
   if(path.endsWith('/photos')) {
    writes.push('photo');draft.photos.push({reference:'APF_'+String(draft.photos.length+1).padStart(32,'0'),url:'https://api.nihiloba.com/api/apartments/photos/fixture'});draft.revision++;
   } else {
    const body=request.postDataJSON();writes.push(body.action);
    if(body.action==='save'){draft.values=body.values;draft.revision++;}
    if(body.action==='publish'){expect(body.confirmed).toBe(true);expect(draft.photos).toHaveLength(5);draft.status='AVAILABLE';draft.revision++;}
   }
   return route.fulfill({json:draft});
  });
  await page.goto(`${locale==='en'?'':'/'+locale}/shida/appartements/publier/`);
  await page.getByRole('button',{name:t.start,exact:true}).click();
  await page.getByRole('combobox',{name:t.role,exact:true}).selectOption('owner');
  await page.getByRole('combobox',{name:m.propertyType,exact:true}).selectOption('apartment');
  await page.getByLabel(t.city,{exact:true}).fill('Kinshasa');
  await page.getByRole('combobox',{name:t.commune,exact:true}).selectOption('Limete');
  await page.getByLabel(t.quartier,{exact:true}).fill('Quartier résidentiel');
  await page.getByLabel(t.rooms,{exact:true}).fill('2');
  await page.getByLabel(t.bedrooms,{exact:true}).fill('1');
  await page.getByLabel(t.description,{exact:true}).fill('Appartement de démonstration pour validation locale.');
  await page.getByRole('combobox',{name:t.equipment.water,exact:true}).selectOption('true');
  await page.getByRole('button',{name:t.next,exact:true}).click();
  await page.getByLabel(t.rent,{exact:true}).fill('250');
  await expect(page.getByRole('button',{name:t.next,exact:true})).toBeDisabled();
  for(let index=0;index<5;index++) {
   await page.getByLabel(t.choose,{exact:true}).setInputFiles({name:`controlled-${index}.webp`,mimeType:'image/webp',buffer:image});
   await expect(page.getByRole('heading',{name:`${t.photos} · ${index+1}/10`,exact:true})).toBeVisible();
   await expect(page.getByLabel(t.rent,{exact:true})).toHaveValue('250');
  }
  expect(writes.filter(value=>value==='publish')).toHaveLength(0);
  await page.getByRole('button',{name:t.next,exact:true}).click();
  await expect(page.getByRole('button',{name:t.publish,exact:true})).toBeDisabled();
  await expect(page.getByRole('checkbox',{name:t.authority,exact:true})).not.toBeChecked();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(locale==='fr') {
   await page.evaluate(()=>{document.documentElement.style.setProperty('scroll-behavior','auto','important');window.scrollTo({top:0,behavior:'instant'});});
   await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
   expect(await page.locator('.skip-link').evaluate(element=>element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
   await page.screenshot({path:`test-results/apartments-creation-review-${width}.png`,fullPage:true});
  }
  await page.getByRole('checkbox',{name:t.authority,exact:true}).check();
  await page.getByRole('button',{name:t.publish,exact:true}).click();
  await expect(page.getByRole('heading',{name:t.published,exact:true})).toBeVisible();
  expect(writes.filter(value=>value==='publish')).toHaveLength(1);
  expect(draft.values.city).toBe('Kinshasa');expect(draft.values.price).toBe(250);
 });
}

for(const locale of ['en','fr','ln','sw'] as const) for(const width of [390,1440]) {
 test(`minimal private interest ${locale} ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});const t=apartmentInterestCopy[locale];
  const writes:unknown[]=[];let saved=false;
  await page.route('https://api.nihiloba.com/api/apartments/photos/**',route=>route.fulfill({contentType:'image/webp',body:readFileSync('public/images/apartment-discovery.webp')}));
  await page.route('**/api/shida/**',route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.includes('/employment/session'))return route.fulfill({json:{binding:'b'.repeat(64),user:{display_name:'Applicant'}}});
   if(path.includes('/APT_fixture/interest')){
    const request={listing_ref:'APT_fixture',status:'pending_owner_review'};
    if(route.request().method()==='GET')return route.fulfill({json:{request:saved?request:null}});
    writes.push(route.request().postDataJSON());saved=true;return route.fulfill({json:request});
   }
   return route.fulfill({status:404,json:{}});
  });
  await page.goto(`${locale==='en'?'':'/'+locale}/shida/appartements/limete-fixture/`);
  await page.getByRole('button',{name:t.title,exact:true}).click();
  const dialog=page.getByRole('dialog',{name:t.title,exact:true});
  await dialog.getByLabel(t.message,{exact:true}).fill('Saturday afternoon');
  await dialog.getByRole('button',{name:t.review,exact:true}).click();
  expect(writes).toEqual([]);await expect(dialog.getByText('Saturday afternoon',{exact:true})).toBeVisible();
  if(locale==='fr')await page.screenshot({path:`test-results/apartments-interest-${width}.png`});
  await dialog.getByRole('button',{name:t.send,exact:true}).click();
  await expect(dialog.getByText(t.pending,{exact:true})).toBeVisible();
  expect(writes).toEqual([{message:'Saturday afternoon',people_count:null,confirmed:true}]);
  await dialog.getByRole('button',{name:t.close,exact:true}).last().click();
  await page.getByRole('button',{name:t.title,exact:true}).click();
  await expect(dialog.getByText(t.pending,{exact:true})).toBeVisible();
  await expect(dialog.getByRole('button',{name:t.send,exact:true})).toHaveCount(0);
  expect(writes).toHaveLength(1);
 });
}
