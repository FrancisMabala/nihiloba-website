import {test,expect} from '@playwright/test';
const output=process.env.MY_SPACE_EVIDENCE_DIR||'test-results/my-space-evidence';
for(const width of [390,1440]) test(`My Space visual ${width}`,async({page})=>{
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Compte de démonstration'}});
  if(path.endsWith('/security/navigation'))return reply({can_manage:true,markets:['wenze'],organization_management:false});
  if(path.endsWith('/security/profile'))return reply({revision:'fixture',values:{personal_name:'Compte de démonstration',city:'Kinshasa',country_code:'CD',area:'Gombe'},primary_phone:{masked:'•••• 0001',verified:true},neighborhood:'Gombe'});
  if(path.endsWith('/security'))return reply({email:null,email_ready_at:null,passkeys:[],protected:false});
  if(path.endsWith('/security/phone'))return reply({changes:[]});
  if(path.endsWith('/security/recovery'))return reply({methods:[]});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  if(path.includes('/notifications'))return reply({items:[],next_cursor:null});
  return reply({},404);
 });
 await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space?view=settings');
 await expect(page.locator('.registration-card')).toContainText('•••• 0001');
 if(process.env.SPACE_CAPTURE_PHASE!=='before'){
  await expect(page.locator('.notification-header-link')).toHaveCount(1);
  await expect(page.locator('.space-content .notification-bell')).toHaveCount(0);
  await expect(page.locator('.space-context')).toHaveCount(0);
  await expect(page.locator('.shida-navigation')).toBeVisible({visible:width<768});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.screenshot({path:`${output}/my-space-${process.env.SPACE_CAPTURE_PHASE||'after'}-${width}.png`,fullPage:true});
});

async function session(page:import('@playwright/test').Page){
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(p.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic Account'}}});
  if(p.endsWith('/security/navigation'))return route.fulfill({json:{can_manage:true,markets:['wenze','services'],organization_management:false}});
  if(p.endsWith('/notifications/count'))return route.fulfill({json:{unread_count:3}});
  return route.fulfill({json:{},status:404});
 });
}
for(const status of [401,503])test(`account load ${status} ends loading and offers retry`,async({page})=>{
 await session(page);
 await page.route('**/api/shida/personal/security/**',route=>route.fulfill({status,json:{detail:'security_unavailable'}}));
 await page.goto('/fr/shida/space?view=settings');
 await expect(page.locator('.space-account-security')).not.toContainText('Chargement…');
 await expect(page.locator('.space-security [role="alert"]')).toContainText(status===401?'Reconnectez-vous':'temporairement indisponibles');
 await expect(page.locator('.registration-card [role="alert"]')).toHaveCount(1);
 await expect(page.locator('.registration-card')).not.toContainText('modification n’a pu');
 await expect(page.locator('.registration-card button')).toHaveText('Réessayer');
});
test('failed profile save retains edits; cancel restores saved values',async({page})=>{
 await session(page);
 await page.route('**/api/shida/personal/security/profile/',route=>route.request().method()==='POST'?route.fulfill({status:503,json:{detail:'security_unavailable'}}):route.fulfill({json:{revision:'r1',values:{personal_name:'Saved Name',city:'Kinshasa',country_code:'CD',area:'Gombe'},primary_phone:{masked:'•••• 1234',verified:true},neighborhood:null}}));
 await page.goto('/fr/shida/space?view=settings');const card=page.locator('.registration-card');
 await card.getByRole('button',{name:'Modifier',exact:true}).click();await card.locator('#profile-personal_name').fill('Unsaved Name');
 await card.locator('button.button-primary').click();await expect(card.getByRole('status')).toContainText('Vos saisies restent ici');
 await expect(card.locator('#profile-personal_name')).toHaveValue('Unsaved Name');
 await card.getByRole('button',{name:'Annuler',exact:true}).click();await expect(card).toContainText('Saved Name');await expect(card).not.toContainText('Unsaved Name');
});
test('archived and incomplete activities remain visible and link to exact management flow',async({page})=>{
 await session(page);
 await page.route('**/api/shida/personal/wenze/stores/**',route=>route.fulfill({json:{stores:new URL(route.request().url()).searchParams.get('archived')==='true'?[{public_ref:'WNZ_old',name:null,city:null,category:null,catalog_ready:false,status:'inactive',visible:'true'}]:[{public_ref:'WNZ_new',name:'Current Shop',catalog_ready:true,status:'active',visible:'true',city:'Kinshasa'}]}}));
 await page.route('**/api/shida/personal/restaurants/**',route=>route.fulfill({json:{items:[],total:0,actions:['create']}}));
 await page.route('**/api/shida/personal/services',route=>route.fulfill({json:{profiles:[]}}));
 await page.route('**/api/shida/personal/services/capabilities',route=>route.fulfill({json:{capabilities:['profile']}}));
 await page.goto('/fr/shida/space?view=management');
 await expect(page.locator('.space-managed-grid article')).toHaveCount(2);
 const old=page.locator('.space-managed-grid article').filter({hasText:'À compléter'});
 await expect(old).toContainText('Nom de l’activité');await expect(old).toContainText('Localisation');
 await expect(old.getByRole('link')).toHaveAttribute('href',/store=WNZ_old&view=shop/);
 await expect(page.locator('.space-managed')).not.toContainText('Vous n’avez pas encore');
});
test('empty Messages stays simple and the header links to the unified center',async({page})=>{
 await session(page);await page.route('**/api/shida/personal/notifications**',route=>route.fulfill({json:route.request().url().includes('/count')?{unread_count:0}:{items:[],next_cursor:null}}));
 await page.goto('/fr/shida/space?view=messages');
 await expect(page.locator('.notification-inline')).toContainText('Aucune notification pour le moment.');
 await expect(page.locator('.notification-filters')).toHaveCount(0);
 await expect(page.locator('.space-content')).toContainText('utilisez WhatsApp');
 await expect(page.locator('.notification-header-link')).toHaveAttribute('href','/fr/shida/space?view=messages');
 await expect(page.locator('.space-content footer')).toHaveCount(0);
});

test('an archived unnamed shop opens its owner restoration controls without active-only product requests',async({page})=>{
 await session(page);let products=0;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/shida/personal/wenze/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/stores'))return route.fulfill({json:{stores:[],categories:[],product_categories:[]}});
  if(path.endsWith('/stores/WNZ_old'))return route.fulfill({json:{public_ref:'WNZ_old',name:null,status:'inactive',visible:'false',revision:1,selling_mode:'shop'}});
  if(path.includes('/products'))products++;
  return route.fulfill({status:403,json:{detail:'inactive'}});
 });
 await page.goto('/shida/seller/wenze?store=WNZ_old&view=shop');
 await expect(page.getByRole('button',{name:'Restore',exact:true})).toBeVisible();
 expect(products).toBe(0);expect(errors).toEqual([]);
});
test('sign-in exposes unauthenticated lost-phone recovery without changing login',async({page})=>{
 await page.route('**/api/**',route=>route.fulfill({status:401,json:{detail:'unauthorized'}}));
 await page.goto('/fr/shida/space?view=management');
 await expect(page.locator('.candidate-login a').filter({hasText:'Téléphone perdu ou volé'})).toHaveAttribute('href','/fr/shida/space?view=recovery');
});

for(const width of [390,1440])test(`transaction empty states and restaurant pagination ${width}`,async({page})=>{
 await session(page);await page.setViewportSize({width,height:900});let populated=false;
 await page.route('**/api/shida/personal/restaurant-orders/**',route=>{
  const second=new URL(route.request().url()).searchParams.get('page')==='2';
  return route.fulfill({json:{items:populated?[{order_ref:second?'ORD_second':'ORD_first',state:'pending',establishment_name:second?'Second restaurant':'First restaurant',submitted_at:'2026-10-30T12:00:00Z',order_total:'5000',currency:'CDF'}]:[],total:populated?21:0}});
 });
 await page.route('**/api/shida/personal/wenze-buyer/orders/**',route=>route.fulfill({json:{orders:[],total:0}}));
 await page.route('**/api/shida/personal/services/transactions/customer/bill-notices**',route=>route.fulfill({json:{notices:[],has_more:false}}));
 for(const destination of ['restaurant-orders','wenze/orders','service-bills']){
  await page.goto(`/fr/shida/${destination}`);await expect(page.locator('.transaction-empty')).toBeVisible();
  await expect(page.locator('.transaction-pagination')).toHaveCount(0);
 }
 populated=true;await page.goto('/fr/shida/restaurant-orders');
 await expect(page.locator('.transaction-card')).toContainText('First restaurant');
 await page.locator('.transaction-pagination').getByRole('button',{name:'Suivant',exact:true}).click();
 await expect(page.locator('.transaction-card')).toContainText('Second restaurant');
 await expect(page.locator('.transaction-pagination').getByRole('button',{name:'Suivant',exact:true})).toBeDisabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${output}/my-space-transactions-${width}.png`,fullPage:true});
});

test('a stalled account request reaches an error instead of indefinite loading',async({page})=>{
 await session(page);await page.route('**/api/shida/personal/security/profile/',async()=>{});
 await page.goto('/fr/shida/space?view=settings');
 await expect(page.locator('.registration-card [role="alert"]')).toContainText('temporairement indisponibles',{timeout:16000});
 await expect(page.locator('.registration-card')).not.toContainText('Chargement…');
});
