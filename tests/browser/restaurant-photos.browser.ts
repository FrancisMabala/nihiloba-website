import { managementNavigation } from './restaurant-management-navigation';
import { managementCopy } from '../../app/lib/restaurant-management-copy';
import { sellerDesignCopy } from '../../app/lib/restaurant-seller-design-copy';
import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { photoText } from '../../app/lib/restaurant-photo-copy';
import { guestText } from '../../app/lib/restaurant-guest-copy';
import { checkoutCopy } from '../../app/lib/restaurant-checkout-copy';
const bytes=fs.readFileSync('public/images/restaurants/restaurant-table-header-480.webp');
const jpeg=fs.readFileSync('public/shida-marketplace-menu.jpeg');
const revision='2026-10-12T10:00:00.123456+00:00';
async function noOverflow(page:Page){ expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
async function publicFixture(page:Page,slow=false,broken=false) {
 await page.route('https://api.nihiloba.com/api/restaurants/photos/**',async route=>{if(slow)await new Promise(r=>setTimeout(r,1200));await route.fulfill({status:broken?404:200,contentType:'image/webp',body:broken?'':bytes});});
 await page.route('**/api/shida/restaurant-guests/**',route=>route.fulfill({status:409,json:{detail:'restaurant_intake_closed'}}));
 await page.route('**/api/shida/personal/**',route=>route.fulfill({status:401,json:{}}));
}
for(const locale of ['en','fr','ln','sw'] as const) for(const width of [360,390,430,768,820,1024]) test(`public food cards ${locale} ${width}`,async({page})=>{
 await publicFixture(page);await page.setViewportSize({width,height:width===1024?768:1024});const prefix=locale==='en'?'':`/${locale}`;
 await page.goto(`${prefix}/shida/restaurants/RST_PHOTO/menu/`);
 await expect(page.locator('.restaurant-menu-item')).toHaveCount(12);
 const first=page.locator('.restaurant-menu-item').first();await expect(first).toContainText('Fumbwa ya maman');await expect(first).toContainText('3 000 CDF');await expect(first.locator('img')).toHaveAttribute('alt',/Fumbwa/);
 await expect(page.locator('.availability-sold_out')).toHaveCount(1);await expect(page.locator('.availability-available')).toHaveCount(0);
 await expect(page.locator('.restaurant-menu-item .eyebrow')).toHaveCount(0);await expect(page.locator('#guest-order').getByRole('button',{name:guestText(locale,'start'),exact:true})).toHaveCount(0);
 const cards=page.locator('.restaurant-grid:visible').first().locator('article');await expect(cards.nth(0)).toBeVisible();await expect(cards.nth(1)).toBeVisible();const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox();expect(a&&b).toBeTruthy();expect(Math.abs(a!.y-b!.y)<2).toBe(width>=768);
 await noOverflow(page);await page.screenshot({path:`.s3a-local/photos/menu-${locale}-${width}.png`,fullPage:true});
 await page.goto(`${prefix}/shida/restaurants/RST_NOPHOTO/`);await expect(page.locator('.restaurant-header-art')).toHaveCount(0);await noOverflow(page);
 if(locale==='fr'){await page.screenshot({path:`.s3a-local/photos/profile-no-photo-${width}.png`,fullPage:true});await page.goto(`${prefix}/shida/restaurants/?query=photos`);await expect(page.locator('.rd-card')).toHaveCount(3);await noOverflow(page);await page.screenshot({path:`.s3a-local/photos/listing-${width}.png`,fullPage:true});}
});
test('one photo, broken images and slow responses preserve readable content',async({page})=>{
 await page.setViewportSize({width:390,height:844});await publicFixture(page,true);
 await page.goto('/fr/shida/restaurants/RST_ONEPHOTO/menu/');await expect(page.locator('.restaurant-menu-item img')).toHaveCount(1);await noOverflow(page);await page.screenshot({path:'.s3a-local/photos/one-photo-slow-390.png',fullPage:true});
 await page.unroute('https://api.nihiloba.com/api/restaurants/photos/**');await publicFixture(page,false,true);await page.reload();await expect(page.locator('.restaurant-header-art:visible .restaurant-photo-illustration')).toBeVisible();await expect(page.locator('.restaurant-menu-item img')).toHaveCount(0);await noOverflow(page);
});

async function sellerFixture(page:Page){
 const state={writes:[] as {url:string;body:Buffer|null}[],failUpload:false,failRemoval:false,stale:false,uncertainAttach:false,deny:false,status:'staged',target:'establishment',item_ref:null as string|null,attached:0,image:'https://api.nihiloba.com/api/restaurants/photos/RPH_old'};
 const parent={public_ref:'RST_fixture',revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','preview','hours','unpublish','links'],profile:{name:'Chez maman — restaurant du quartier et cuisine congolaise',food_business_type:'malewa',description:'Bilei ya mboka',city:'Kinshasa',commune:'Gombe',timezone_name:'Africa/Kinshasa',establishment_photo_url:state.image}};
 const items=Array.from({length:25},(_,i)=>({public_ref:`RMI_${i}`,name:i===0?'Fumbwa ya maman, makayabu et accompagnement au choix':`Pondu ${i+1}`,image_url:state.image,category:{public_ref:'RMC_food',name:'Bilei'},pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000.00',sale_unit_label:'assiette',availability:i===2?'sold_out':'available'}));
 await page.route('https://api.nihiloba.com/api/restaurants/photos/**',route=>route.fulfill({contentType:'image/webp',body:bytes}));
 await page.route('**/api/**',async route=>{
  const r=route.request(),u=new URL(r.url()),p=u.pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(p.endsWith('/employment/session'))return reply({user:{display_name:'Synthetic seller'},binding:'a'.repeat(64)});
  if(!p.includes('/personal/restaurants'))return reply({},404);
  if(state.deny)return reply({},401);
  if(p.endsWith('/capabilities'))return reply({capabilities:[]});
  if(p.endsWith('/order-feed'))return reply({changed:[],removed:[],cursor:'fixture',as_of:revision});
  if(p.endsWith('/orders'))return reply({items:[],total:0,as_of:revision});
  if(p.endsWith('/order-configuration'))return reply({intake_released:true});
  if(p.endsWith('/photo-uploads')){
   state.writes.push({url:r.url(),body:r.postDataBuffer()});state.target=u.searchParams.get('target')!;state.item_ref=u.searchParams.get('item_ref');
   if(state.failUpload){state.failUpload=false;return route.abort();}if(state.stale){state.stale=false;return reply({detail:'restaurant_stale'},409);}
   state.status='staged';return reply({upload_ref:'RPH_photo',target:state.target,item_ref:state.item_ref,status:state.status,expires_at:'2026-10-13T10:00:00Z',revision});
  }
  if(p.includes('/photo-uploads/')){
   if(p.endsWith('/preview'))return route.fulfill({contentType:'image/jpeg',body:jpeg});
   if(p.endsWith('/attach')){state.writes.push({url:r.url(),body:r.postDataBuffer()});state.status='attached';state.attached++;if(state.uncertainAttach){state.uncertainAttach=false;return route.abort();}}
   return reply({upload_ref:'RPH_photo',target:state.target,item_ref:state.item_ref,status:state.status,expires_at:'2026-10-13T10:00:00Z',revision});
  }
  if(p.endsWith('/restaurants'))return reply({items:[parent],page:1,page_size:20,total:1,actions:['create']});
  if(p.endsWith('/RST_fixture'))return reply(parent);
  if(p.includes('/menu/items/')){const item=items.find(i=>p.endsWith(i.public_ref));if(r.method()==='PATCH'){state.writes.push({url:r.url(),body:r.postDataBuffer()});if(item)item.image_url='';if(state.failRemoval){state.failRemoval=false;return route.abort();}}return reply({revision,result:item,currency:'CDF'});}
  if(p.endsWith('/menu/items')){const size=Number(u.searchParams.get('page_size')||20),start=(Number(u.searchParams.get('page')||1)-1)*size;return reply({revision,currency:'CDF',result:{items:items.slice(start,start+size),total:25,page:Number(u.searchParams.get('page')||1),page_size:size}});}
  if(p.endsWith('/menu/categories'))return reply({revision,currency:'CDF',result:{items:[{public_ref:'RMC_food',name:'Bilei',visible:true}],total:1,page:1,page_size:50}});
  return reply({},404);
 });return state;
}
async function openSeller(page:Page,locale:'en'|'fr'|'ln'|'sw'='en'){
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`);await managementNavigation(page,sellerDesignCopy[locale].menu);
}
test('explicit target, raw-byte retry, protected preview, uncertain attachment recovery and item removal',async({page})=>{
 const s=await sellerFixture(page);await page.setViewportSize({width:390,height:844});await openSeller(page);
 await page.locator('.rst-menu-row').first().getByRole('button',{name:managementCopy.en.photo,exact:true}).click();
 await page.getByLabel(photoText('en','chooseItem')).selectOption('RMI_24');
 await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeEnabled();await page.getByLabel(photoText('en','choose'),{exact:true}).setInputFiles({name:'food.webp',mimeType:'image/webp',buffer:bytes});s.failUpload=true;
 await page.getByRole('button',{name:photoText('en','upload'),exact:true}).click();await expect(page.getByRole('button',{name:photoText('en','retry'),exact:true})).toBeEnabled();expect(s.attached).toBe(0);
 await page.getByRole('button',{name:photoText('en','retry'),exact:true}).click();await expect(page.getByRole('img',{name:photoText('en','processed'),exact:true})).toBeVisible();expect(s.writes[0]).toEqual(s.writes[1]);expect(s.writes[0].body).toEqual(bytes);expect(s.writes[0].url).toContain('item_ref=RMI_24');
 const confirm=page.getByRole('button',{name:photoText('en','confirm'),exact:true});await expect(confirm).toBeDisabled();await page.getByLabel(photoText('en','consent')).check();await noOverflow(page);await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'.s3a-local/photos/seller-confirm-390.png',fullPage:true});
 s.uncertainAttach=true;await confirm.click();await expect(page.getByText(photoText('en','uncertain'),{exact:true})).toBeVisible();await page.getByRole('button',{name:photoText('en','recover'),exact:true}).click();await expect(page.getByText(photoText('en','saved'),{exact:true})).toBeVisible();expect(s.attached).toBe(1);
 await page.getByRole('button',{name:photoText('en','back'),exact:false}).click();await page.locator('.rst-menu-row').first().getByRole('button',{name:managementCopy.en.photo,exact:true}).click();await page.getByLabel(photoText('en','removeConfirm')).check();await page.getByRole('button',{name:photoText('en','remove'),exact:true}).click();await expect(page.getByText(photoText('en','removed'),{exact:true})).toBeVisible();expect(JSON.parse(s.writes.at(-1)!.body!.toString()).fields).toEqual({image_url:null});
});
test('stale upload, invalid input, discard and session loss',async({page})=>{
 const s=await sellerFixture(page);await openSeller(page);await managementNavigation(page,sellerDesignCopy.en.profile);await page.locator('.rst-profile-photo button').click();
 await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeEnabled();await page.getByLabel(photoText('en','choose'),{exact:true}).setInputFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('bad')});await expect(page.getByText(photoText('en','invalid'),{exact:true})).toBeVisible();expect(s.writes).toHaveLength(0);
 await page.getByLabel(photoText('en','camera'),{exact:true}).setInputFiles({name:'camera.webp',mimeType:'image/webp',buffer:bytes});s.stale=true;await page.getByRole('button',{name:photoText('en','upload'),exact:true}).click();await expect(page.getByText(photoText('en','stale'),{exact:true})).toBeVisible();await page.getByRole('button',{name:photoText('en','restart'),exact:true}).click();
 await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeEnabled();await page.getByLabel(photoText('en','choose'),{exact:true}).setInputFiles({name:'photo.webp',mimeType:'image/webp',buffer:bytes});await page.getByRole('button',{name:photoText('en','discard'),exact:true}).click();await expect(page.getByText(photoText('en','discarded'),{exact:true})).toBeVisible();expect(s.attached).toBe(0);
 await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeEnabled();await page.getByLabel(photoText('en','choose'),{exact:true}).setInputFiles({name:'photo.webp',mimeType:'image/webp',buffer:bytes});s.deny=true;await page.getByRole('button',{name:photoText('en','upload'),exact:true}).click();await expect(page.locator('.rst-photo-editor')).toHaveCount(0);
});
test('removal retry keeps its exact revision and operation key',async({page})=>{
 const s=await sellerFixture(page);await openSeller(page);await page.locator('.rst-menu-row').first().getByRole('button',{name:managementCopy.en.photo,exact:true}).click();
 await expect(page.getByLabel(photoText('en','removeConfirm'))).toBeEnabled();await page.getByLabel(photoText('en','removeConfirm')).check();s.failRemoval=true;
 await page.getByRole('button',{name:photoText('en','remove'),exact:true}).click();await expect(page.getByText(photoText('en','uncertain'),{exact:true})).toBeVisible();
 await page.getByRole('button',{name:photoText('en','retryRemoval'),exact:true}).click();await expect(page.getByText(photoText('en','removed'),{exact:true})).toBeVisible();expect(s.writes[0]).toEqual(s.writes[1]);
});
test('slow upload keeps target locked and shows progress without attaching',async({page})=>{
 const s=await sellerFixture(page);await openSeller(page);await managementNavigation(page,sellerDesignCopy.en.profile);await page.locator('.rst-profile-photo button').click();
 await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeEnabled();await page.getByLabel(photoText('en','choose'),{exact:true}).setInputFiles({name:'photo.webp',mimeType:'image/webp',buffer:bytes});
 await page.route('**/photo-uploads/?*',async route=>{await new Promise(resolve=>setTimeout(resolve,1200));await route.fallback();});
 await page.getByRole('button',{name:photoText('en','upload'),exact:true}).click();await expect(page.getByRole('progressbar')).toBeVisible();await expect(page.getByLabel(photoText('en','choose'),{exact:true})).toBeDisabled();expect(s.attached).toBe(0);
 await expect(page.getByRole('img',{name:photoText('en','processed'),exact:true})).toBeVisible();expect(s.attached).toBe(0);
});
for(const [locale,width] of [['en',360],['fr',430],['ln',768],['sw',1024]] as const)test(`seller photo and existing batch layout ${locale} ${width}`,async({page})=>{
 await sellerFixture(page);await page.setViewportSize({width,height:width===1024?768:1024});await openSeller(page,locale);await managementNavigation(page,sellerDesignCopy[locale].profile);await page.locator('.rst-profile-photo button').click();await expect(page.locator('.rst-photo-pickers')).toBeVisible();await noOverflow(page);await page.screenshot({path:`.s3a-local/photos/seller-photo-${locale}-${width}.png`,fullPage:true});
 await managementNavigation(page,sellerDesignCopy[locale].menu);await page.locator('.rst-menu-heading').getByRole('button',{name:photoText(locale,'batch'),exact:true}).click();await expect(page.locator('.rst-batch-row')).toHaveCount(2);await noOverflow(page);await page.screenshot({path:`.s3a-local/photos/batch-${locale}-${width}.png`,fullPage:true});
});

for(const [locale,width] of [['en',360],['fr',430],['ln',768],['sw',1024]] as const)test(`private guest menu and authority loss ${locale} ${width}`,async({page})=>{
 await publicFixture(page);await page.setViewportSize({width,height:width===1024?768:1024});
 let revoked=false,writes=0;
 const visit={visit_ref:'RGV_photo',order_until:'2027-01-01T12:00:00Z',access_until:'2027-01-01T14:00:00Z',can_add_round:true,rounds:[],totals:{completed:{CDF:'0',USD:'0'},active:{CDF:'0',USD:'0'},excluded:{CDF:'0',USD:'0'}}};
 const basket={basket_ref:'RGB_photo',revision:1,selections:{standalone:[],plates:[]},quote:null,quote_ref:null,order_ref:null,food_preference:null,window_ref:null};
 await page.route('**/api/shida/restaurant-guests/**',route=>{
  const r=route.request(),p=new URL(r.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(r.method()!=='GET')writes++;
  if(revoked&&p.includes('/visits/'))return reply({detail:'restaurant_unavailable'},404);
  if(p.endsWith('/entry'))return reply({entry_context:'synthetic_context',expires_at:'2027-01-01T12:00:00Z',methods:{pickup:{windows:[{public_ref:'RWI_photo',starts_at:'2027-01-01T10:00:00Z',ends_at:'2027-01-01T12:00:00Z'}]}},copy:{}});
  if(p.endsWith('/service-proposals'))return reply({items:[],copy:{}});
  if(p.endsWith('/service-group'))return reply({group:null});
  if(p.endsWith('/baskets'))return reply(basket);
  return reply(visit);
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/restaurants/RST_ONEPHOTO/menu/`);
 const guest=page.locator('#guest-order');await guest.getByRole('button',{name:guestText(locale,'start'),exact:true}).click();await expect(guest.locator('.rst-checkout-items article')).toHaveCount(12);expect(writes).toBe(2);
 await expect(guest.locator('.rst-checkout-items article').first()).toContainText('3 000 CDF');await expect(guest.locator('.rst-checkout-items article').nth(3).getByRole('button')).toHaveCount(0);
 await expect(guest).toContainText(guestText(locale,'payment'));await noOverflow(page);await guest.scrollIntoViewIfNeeded();await guest.screenshot({path:`.s3a-local/photos/guest-${locale}-${width}.png`});
 await guest.locator('.rst-checkout-items article').first().getByRole('button',{name:checkoutCopy[locale].add,exact:true}).click();expect(writes).toBe(2);await expect(guest.getByRole('button',{name:checkoutCopy[locale].quote,exact:true})).toBeDisabled();
 revoked=true;await guest.getByRole('button',{name:checkoutCopy[locale].refresh,exact:true}).click();await expect(guest.locator('.rst-checkout-items article')).toHaveCount(0);await expect(guest).toContainText(guestText(locale,'lost'));expect(writes).toBe(2);
});
