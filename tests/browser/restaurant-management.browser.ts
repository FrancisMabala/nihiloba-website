import { managementNavigation as navigate } from './restaurant-management-navigation';
import { test, expect, type Page } from '@playwright/test';
import { managementCopy } from '../../app/lib/restaurant-management-copy';
import { sellerDesignCopy } from '../../app/lib/restaurant-seller-design-copy';
import { workText } from '../../app/lib/restaurant-work-copy';
import { photoText } from '../../app/lib/restaurant-photo-copy';
const revision='2026-10-13T08:00:00+00:00';
async function fixture(page:Page,count=1,advanced=true) {
 const state={logout:false};
 const establishments=Array.from({length:count},(_,i)=>({public_ref:`RST_${i}`,revision,status:'active',menu_currency:'CDF',location_confirmed:true,missing_publication_fields:[],actions:['read','edit','menu','hours','preview','links','unpublish'],profile:{name:i===0?'Chez maman — Restaurant & Malewa de la commune de Limete':`Restaurant ${i+1}`,food_business_type:'malewa',city:'Kinshasa',commune:'Limete',timezone_name:'Africa/Kinshasa',establishment_photo_url:null}}));
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/employment/logout')){state.logout=true;return route.fulfill({json:{}});}
  if(p.endsWith('/employment/session'))return route.fulfill({status:state.logout?401:200,json:{user:{display_name:'Francis Mabala'},binding:'a'.repeat(64)}});
  if(p.endsWith('/capabilities'))return route.fulfill({json:{capabilities:(advanced?['restaurant.kitchen','restaurant.inventory','restaurant.pos']:[]).map(capability=>({capability,available:true}))}});
  if(p.endsWith('/order-feed'))return route.fulfill({json:{changed:[],removed:[],cursor:'cursor',as_of:revision}});
  if(p.endsWith('/order-configuration'))return route.fulfill({json:{intake_released:true}});
  if(p.endsWith('/orders'))return route.fulfill({json:{items:[],total:0,as_of:revision}});
  if(p.endsWith('/menu/items'))return route.fulfill({json:{revision,currency:'CDF',result:{items:[{public_ref:'RMI_1',name:'Pondu, poisson et accompagnement au choix',image_url:null,pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available'}],total:1,page:1,page_size:20}}});
  if(p.endsWith('/menu/items/RMI_1'))return route.fulfill({json:{revision,currency:'CDF',result:{public_ref:'RMI_1',name:'Pondu',image_url:null}}});
  if(p.endsWith('/restaurants'))return route.fulfill({json:{items:establishments,total:count,page:1,page_size:20,actions:['create']}});
  const selected=establishments.find(row=>p.endsWith('/'+row.public_ref));
  return route.fulfill({status:selected?200:404,json:selected??{}});
 });return state;
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,820,1440])test(`management ${locale} ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:width===360?800:900});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/`);
 await expect(page.getByRole('heading',{name:/Chez maman/})).toBeVisible();
 await expect(page.locator('.rst-order-layout')).toBeVisible();
 await expect(page.locator('.site-header,footer,.rst-photo-shortcuts,.rst-tabs')).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/management-${locale}-${width}.png`,fullPage:true});
 const copy=managementCopy[locale];
 await page.locator('.rst-dropdown').first().locator('summary').click();
 await expect(page.locator('.rst-dropdown').first().getByRole('link')).toHaveCount(4);
 await expect(page.locator('.rst-dropdown').first().getByRole('link',{name:'Swahili',exact:true})).toBeVisible();
 await page.locator('.rst-dropdown').first().locator('summary').press('Enter');
 await page.locator('.rst-account summary').click();
 await expect(page.getByRole('button',{name:copy.changeAccount,exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:copy.signOut,exact:true})).toBeVisible();
 await page.locator('.rst-account summary').click();
 await navigate(page,sellerDesignCopy[locale].menu);
 await expect(page.locator('.rst-menu-row .rst-photo-thumb')).toHaveCount(1);
 await expect(page.locator('.rst-menu-heading').getByRole('button',{name:photoText(locale,'batch')})).toBeVisible();
 await expect(page.locator('.rst-menu-row').getByRole('button',{name:copy.photo,exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/evidence/management-menu-${locale}-${width}.png`,fullPage:true});
 await page.locator('.rst-menu-row').getByRole('button',{name:copy.photo,exact:true}).click();
 await expect(page.getByLabel(photoText(locale,'chooseItem'))).toHaveValue('RMI_1');
 await navigate(page,sellerDesignCopy[locale].profile);
 await expect(page.locator('.rst-profile-photo')).toBeVisible();
 await page.locator('.rst-profile-photo button').click();
 await expect(page.getByRole('button',{name:photoText(locale,'remove'),exact:true})).toHaveCount(0);
});
test('zero starts setup; multiple establishments require an explicit selection',async({page})=>{
 await fixture(page,0);await page.goto('/fr/shida/seller/restaurants/');await expect(page.locator('.rst-editor')).toBeVisible();
 await page.unroute('**/api/**');await fixture(page,3);await page.reload();await expect(page.locator('.rst-grid article')).toHaveCount(3);
 await page.locator('.rst-grid article').nth(1).getByRole('button').click();await expect(page.locator('.rst-order-layout')).toBeVisible();await expect(page.getByRole('heading',{name:'Restaurant 2',exact:true})).toBeVisible();
 await page.getByRole('button',{name:sellerDesignCopy.fr.change,exact:true}).click();await expect(page.locator('.rst-grid article')).toHaveCount(3);
});
test('account actions execute logout; sign out stays distinct from change account',async({page})=>{
 const state=await fixture(page);await page.goto('/fr/shida/seller/restaurants/');await page.locator('.rst-account summary').click();await page.getByRole('button',{name:managementCopy.fr.signOut,exact:true}).click();
 await expect(page.getByText(managementCopy.fr.signedOut,{exact:true})).toBeVisible();await expect.poll(()=>state.logout).toBe(true);await expect(page.locator('.rst-management')).toHaveCount(0);
 state.logout=false;await page.reload();await page.locator('.rst-account summary').click();await page.getByRole('button',{name:managementCopy.fr.changeAccount,exact:true}).click();await expect(page.locator('.rst-signin')).toBeVisible();await expect.poll(()=>state.logout).toBe(true);
});
test('unavailable advanced destinations are absent while orders remain resolvable',async({page})=>{
 await fixture(page,1,false);await page.goto('/fr/shida/seller/restaurants/');await expect(page.locator('.rst-order-layout')).toBeVisible();
 await expect(page.locator('#restaurant-navigation').getByRole('button',{name:managementCopy.fr.stock,exact:true})).toHaveCount(0);
 await expect(page.locator('#restaurant-navigation').getByRole('button',{name:workText('fr','pos'),exact:true})).toHaveCount(0);
});
