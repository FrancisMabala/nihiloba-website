import {test,expect,type Page} from '@playwright/test';
import {workspaceText} from '../../app/lib/personal-workspace-copy';
import {accountSpaceCopy} from '../../app/lib/account-space-copy';
import {fixture as restaurantFixture} from './restaurant-c1e-fixture';
async function fixture(page:Page){
 const state={signedIn:true,empty:false,failed:false,denied:false,binding:'a'.repeat(64),name:'Amina Test',reads:0,writes:0};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(req.method()!=='GET')state.writes++;
  if(path.endsWith('/employment/session'))return state.signedIn?reply({binding:state.binding,user:{display_name:state.name}}):reply({},401);
  if(path.endsWith('/employment/logout')){state.signedIn=false;return reply({authenticated:false});}
  if(['/personal/services','/personal/restaurants','/wenze/stores','/personal/restaurant-orders','/wenze-buyer/orders','/service-requests/postings','/employment/applications'].some(suffix=>path.endsWith(suffix)))state.reads++;if(!state.signedIn)return reply({},401);
  if(path.endsWith('/services/capabilities'))return reply({capabilities:state.denied?[]:['profile']});
  if(path.endsWith('/personal/services'))return reply({profiles:state.empty?[]:[{public_ref:'SVC_one',service_name:'Repair studio',visible_to_customers:true}]});
  if(path.endsWith('/wenze/stores'))return state.denied?reply({},403):reply({stores:state.empty?[]:[{public_ref:'WNS_one',name:'First shop',catalog_ready:true,status:'active',visible:'true'},{public_ref:'WNS_two',name:'Second shop',catalog_ready:true,status:'active',visible:'false'}]});
  if(path.endsWith('/personal/restaurants'))return reply({items:state.empty?[]:[{public_ref:'RST_fixture',status:'active',profile:{name:'My kitchen'}}],actions:state.denied?[]:['create'],total:state.empty?0:1});
  if(path.endsWith('/personal/restaurant-orders'))return state.failed?reply({},503):reply({items:state.empty?[]:[{order_ref:'ROD_one',establishment_name:state.name+' kitchen order',state:'ready',submitted_at:'2026-10-22T10:00:00Z',order_total:'1000',currency:'CDF'}]});
  if(path.endsWith('/wenze-buyer/orders'))return reply({orders:state.empty?[]:[{reference:'WZ_one',store_name:'Shop order',total:'1000',currency:'CDF',timeline:{current:'delivered'}}]});
  if(path.endsWith('/service-requests/postings'))return reply({requests:state.empty?[]:[{posted_ref:'SPR_one',status:'OPEN',summary:{description:'Fix a tap'},created_at:'2026-10-21T12:00:00Z'}]});
  if(path.endsWith('/employment/applications'))return reply({applications:state.empty?[]:[{reference:'APP_one',job_title:'Shop assistant',employer_name:'Employer',status:'interview_proposed',created_at:'2026-10-20T12:00:00Z',status_history:[],messages:[],interview:{},email_handoff_contact:null}]});
  if(path.includes('/employment/applications/'))return reply({application:{reference:'APP_one',job_title:'Shop assistant',employer_name:'Employer',status:'interview_proposed',created_at:'2026-10-20T12:00:00Z',status_history:[],messages:[],interview:{date:'2026-10-30',time:'09:00',location:'Office',notes:'Bring CV'},email_handoff_contact:null}});
  return reply({},404);
 });return state;
}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,820,1440])test(`Phase 3 activity and management ${locale} ${width}`,async({page})=>{
 const state=await fixture(page),prefix=locale==='en'?'':`/${locale}`,t=accountSpaceCopy[locale],w=(key:Parameters<typeof workspaceText>[1])=>workspaceText(locale,key);
 await page.setViewportSize({width,height:900});await page.goto(`${prefix}/shida/space`);
 await expect(page.locator('.space-attention')).toContainText('Shop assistant');await expect(page.locator('.space-attention')).not.toContainText('Shop order');await expect(page.locator('.space-recent')).toContainText('Fix a tap');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.space-context')).toContainText(w('personal'));
 if(locale==='fr'&&width!==820)await page.screenshot({path:`docs/evidence/phase3/home-${width}.png`,fullPage:true});
 const jobs=page.locator('.space-links-overview').getByRole('link',{name:w('applications'),exact:true});await jobs.click();await expect(page.locator('h1')).toHaveText(w('applications'));await expect(page.locator('.candidate-application-card')).toContainText('Shop assistant');if(locale==='fr'&&width!==820)await page.screenshot({path:`docs/evidence/phase3/applications-${width}.png`,fullPage:true});
 await page.locator('.candidate-application-card').getByRole('link').click();await expect(page.locator('h1')).toHaveText('Shop assistant');await expect(page.locator('.candidate-detail-grid')).toContainText('Office');
 await page.goto(`${prefix}/shida/space?view=management`);await expect(page.locator('.space-managed-grid article')).toHaveCount(4);
 await expect(page.getByRole('link',{name:new RegExp(w('open')+' · Second shop')})).toHaveAttribute('href',`${prefix}/shida/seller/wenze?store=WNS_two`);
 await expect(page.getByRole('link',{name:new RegExp(w('open')+' · Repair studio')})).toHaveAttribute('href',`${prefix}/shida/seller/services?offering=SVC_one&view=services`);
 await expect(page.locator('.space-organization')).toContainText(w('businessNote'));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&width!==820)await page.screenshot({path:`docs/evidence/phase3/management-${width}.png`,fullPage:true});
 if(width===390){await page.locator('.shida-navigation').getByRole('button',{name:t.menu,exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('.shida-navigation').getByRole('button',{name:t.menu,exact:true})).toBeFocused();}
 expect(state.writes).toBe(0);
});
test('empty, unavailable and denied sources never become invented activity or access',async({page})=>{
 const state=await fixture(page);state.empty=true;await page.goto('/shida/space');await expect(page.locator('.space-empty')).toBeVisible();state.failed=true;await page.locator('.space-recent').getByRole('button',{name:'Refresh'}).click();await expect(page.locator('.space-recent')).toContainText(workspaceText('en','partial'));await expect(page.locator('.space-empty')).toHaveCount(0);
 state.denied=true;await page.goto('/shida/space?view=management');await expect(page.locator('.space-managed')).toContainText(workspaceText('en','partial'));await expect(page.locator('.space-managed-grid article')).toHaveCount(0);await expect(page.locator('.space-managed .space-destinations')).toHaveCount(1);await expect(page.locator('.space-managed .space-destinations a')).toHaveAttribute('href','/shida/wenze/sell');expect(state.writes).toBe(0);
});
test('guest does not read private activity and identity changes remove prior content',async({page})=>{
 const state=await fixture(page);state.signedIn=false;await page.goto('/shida/space?view=management');await expect(page.locator('.space-sign-in')).toBeVisible();expect(state.reads).toBe(0);
 state.signedIn=true;await page.goto('/shida/space');await expect(page.locator('.space-recent')).toContainText('Amina Test kitchen order');state.binding='b'.repeat(64);state.name='Other Test';await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('.space-recent')).toContainText('Other Test kitchen order');await expect(page.locator('.space-recent')).not.toContainText('Amina Test');
 state.signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('.space-recent')).toHaveCount(0);expect(state.writes).toBe(0);
});
for(const width of [390,820,1440])test(`restaurant direct selection and grouped tools ${width}`,async({page})=>{
 const state=await restaurantFixture(page);await page.setViewportSize({width,height:900});await page.goto('/fr/shida/seller/restaurants?establishment=RST_fixture');await expect(page.getByRole('region',{name:'Restaurants & Malewa',exact:true}).getByText('Isolated Malewa',{exact:true})).toBeVisible();
 if(width===390){await page.locator('.rst-bottom-nav').getByRole('button',{name:'Plus',exact:true}).click();await expect(page.locator('.rst-more section')).toHaveCount(3);await page.screenshot({path:'docs/evidence/phase3/restaurant-tools-390.png'});await page.keyboard.press('Escape');await expect(page.locator('.rst-bottom-nav').getByRole('button',{name:'Plus',exact:true})).toBeFocused();}
 else await expect(page.locator('.rst-desktop-group')).toHaveCount(4);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(state.writes).toHaveLength(0);
 if(width===1440)await page.screenshot({path:'docs/evidence/phase3/restaurant-1440.png',fullPage:true});
});
