import {test,expect,type Page} from '@playwright/test';
import {accountNavigationCopy} from '../../app/lib/account-navigation-copy';
import {accountSpaceCopy} from '../../app/lib/account-space-copy';
import {universalSpaceCopy} from '../../app/lib/universal-space-copy';
import {listingCopy} from '../../app/lib/wenze-listings-copy';
import {jobSearchCopy} from '../../app/lib/job-search-copy';
import {accountSupportCopy} from '../../app/lib/account-support-copy';

type Locale='fr'|'en'|'ln'|'sw';
const views=['overview','management','listings','job-search','transactions','messages','settings','support'] as const;
type View=typeof views[number];
const prefix=(locale:Locale)=>locale==='en'?'':`/${locale}`;
function label(locale:Locale,view:View){
 const n=accountNavigationCopy[locale];
 return {overview:universalSpaceCopy[locale].overview,management:n.activities,listings:listingCopy[locale].title,'job-search':jobSearchCopy[locale].title,transactions:n.transactions,messages:accountSpaceCopy[locale].messages,settings:n.account,support:accountSupportCopy[locale].title}[view];
}
async function fixture(page:Page,locale:Locale='fr'){
 const errors:string[]=[],unexpected:string[]=[];let signedIn=true;
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return reply(signedIn?{binding:'a'.repeat(64),user:{display_name:'Navigation Test'}}:{},signedIn?200:401);
  if(path.endsWith('/security/navigation'))return reply({can_manage:true,markets:['wenze'],organization_management:false,travel_profiles:[]});
  if(path.endsWith('/wenze/stores'))return reply({stores:[{public_ref:'WNZ_fixture',name:'Boutique de navigation',status:'active',visible:true,catalog_ready:true}]});
  if(path.endsWith('/personal/restaurants'))return reply({items:[],total:0,actions:[]});
  if(path.endsWith('/personal/services'))return reply({profiles:[]});
  if(path.endsWith('/services/capabilities'))return reply({capabilities:[]});
  if(path.endsWith('/apartments/manage'))return reply({items:[],has_more:false});
  if(path.endsWith('/meda/listings'))return reply({items:[],has_more:false});
  if(path.endsWith('/recovery-review')||path.endsWith('/deletion-review'))return reply({},403);
  if(path.endsWith('/job-offer'))return reply({rows:[{type:'article',reference:'ITM_fixture',title:'Lampe de navigation',status:'open',price:'25000',currency:'CDF'}]});
  if(path.endsWith('/personal/transactions'))return reply({counts:{all:1,orders:1,requests:0,documents:0},items:[{id:'wenze:fixture',kind:'wenze',category:'orders',reference:'WZO_fixture',related_reference:null,title:'Commande de navigation',status:'delivered',date:'2026-11-15T10:00:00Z',amount:'25000',currency:'CDF'}],documents:[],page:1,page_size:10,has_more:false});
  if(path.endsWith('/notifications/count'))return reply({unread_count:0});
  if(path.endsWith('/notifications'))return reply({items:[],next_cursor:null});
  if(path.endsWith('/support'))return reply({tickets:[],has_more:false,page:1});
  if(path.endsWith('/security/profile'))return reply({revision:'fixture',values:{personal_name:'Navigation Test',city:'Kinshasa',country_code:'CD',preferred_language:locale},primary_phone:{masked:'•••• 0000',verified:true},neighborhood:null});
  if(path.endsWith('/security'))return reply({email:null,email_ready_at:null,protected:false,passkeys:[]});
  if(path.endsWith('/security/phone'))return reply({changes:[]});
  if(path.endsWith('/security/delete/status'))return reply({deletion:null});
  if(path.endsWith('/security/sessions'))return reply({sessions:[]});
  if(path.endsWith('/security/recovery'))return reply({methods:[]});
  if(path.endsWith('/cart'))return reply({items:[],total_items:0});
  if(path.endsWith('/employment/applications'))return reply({applications:[],total:0,page:1,has_more:false});
  if(path.endsWith('/personal/candidate'))return reply({profiles:[],progress:[]});
  if(path.includes('/job-search/'))return reply({items:[],total:0,page:1,has_more:false});
  unexpected.push(path);return reply({},404);
 });
 return {errors,unexpected,signOut:()=>{signedIn=false;}};
}

// Check actual destination bodies, not only a URL, heading, or selected label.
async function content(page:Page,view:View){
 const body=page.locator('.space-content');
 if(view==='overview'){await expect(body.locator('.activity-overview')).toBeVisible();await expect(body.locator('.space-overview-slogan')).toBeVisible();}
 if(view==='management'){await expect(body.locator('.managed-activities')).toBeVisible();await expect(body).toContainText('Boutique de navigation');}
 if(view==='listings')await expect(body.locator('.my-listings article')).toContainText('Lampe de navigation');
 if(view==='job-search')await expect(body.locator('.search-profile-row')).toHaveCount(2);
 if(view==='transactions')await expect(body.locator('.tx-row')).toContainText('Commande de navigation');
 if(view==='messages')await expect(body.locator('.messages-tabs button')).toHaveCount(2);
 if(view==='settings')await expect(body.locator('.space-profile-details').filter({hasText:'Navigation Test'})).toContainText('Navigation Test');
 if(view==='support')await expect(body.locator('.assistance-filters button')).toHaveCount(3);
 if(view!=='overview')await expect(body.locator('.activity-overview')).toHaveCount(0);
}
async function destination(page:Page,locale:Locale,view:View,mobile:boolean){
 await content(page,view);
 const nav=page.locator(mobile?'.space-section-selector':'.space-desktop-sections');
 await expect(nav.locator('a[aria-current="page"]')).toHaveAttribute('href',`${prefix(locale)}/shida/space?view=${view}`);
 if(mobile){
  await expect(nav).not.toHaveAttribute('open','');
  await expect(nav.locator('summary')).toContainText(label(locale,view));
  await expect(page.locator('.shida-navigation a[aria-current="page"]')).toHaveAttribute('href',`${prefix(locale)}/shida/space`);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}
async function select(page:Page,view:View,mobile:boolean,blur=false){
 const nav=page.locator(mobile?'.space-section-selector':'.space-desktop-sections');
 if(mobile){
  await nav.locator('summary').tap();
  if(blur){
   // Reproduce Safari's null-relatedTarget focus transition before its click.
   // This is simulated focus behavior in Chrome, not a physical Safari test.
   await nav.locator('summary').focus();
   await nav.locator('summary').evaluate(el=>(el as HTMLElement).blur());
  }
  await nav.locator(`a[href$="view=${view}"]`).tap({timeout:5000});
 }else await nav.locator(`a[href$="view=${view}"]`).click();
}

for(const width of [320,375,390,430,820,1440])for(const blur of (width<=700?[false,true]:[false]))test(`all destinations ${width} ${blur?'Safari focus loss':'normal'}`,async({page})=>{
 const f=await fixture(page),mobile=width<=700;await page.setViewportSize({width,height:844});
 await page.goto('/fr/shida/space/?view=overview');await destination(page,'fr','overview',mobile);
 const nav=page.locator(mobile?'.space-section-selector':'.space-desktop-sections');await expect(nav.locator('a')).toHaveCount(8);
 for(const view of [...views.slice(1),'overview'] as View[]){
  await select(page,view,mobile,blur);await destination(page,'fr',view,mobile);
  if(process.env.SHIDA_TEST_EVIDENCE&&[390,1440].includes(width)&&!blur&&['listings','support'].includes(view))await page.screenshot({path:`${process.env.SHIDA_TEST_EVIDENCE}/${view}-${width}.png`,fullPage:true});
 }
 expect(f.errors).toEqual([]);expect(f.unexpected).toEqual([]);
});

for(const locale of ['fr','en','ln','sw'] as const)test(`direct links refresh history ${locale}`,async({page})=>{
 const f=await fixture(page,locale);await page.setViewportSize({width:390,height:844});
 for(const view of views){
  await page.goto(`${prefix(locale)}/shida/space/?view=${view}`);await destination(page,locale,view,true);
  await page.reload();await destination(page,locale,view,true);
 }
 await select(page,'listings',true,true);await destination(page,locale,'listings',true);
 await select(page,'transactions',true,true);await destination(page,locale,'transactions',true);
 await page.goBack();await destination(page,locale,'listings',true);
 await page.goBack();await destination(page,locale,'support',true);
 await page.goForward();await destination(page,locale,'listings',true);
 await page.goForward();await destination(page,locale,'transactions',true);
 expect(f.errors).toEqual([]);expect(f.unexpected).toEqual([]);
});

test('keyboard and outside taps close safely; cancelled gestures do not navigate',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/space/?view=overview');await content(page,'overview');
 const nav=page.locator('.space-section-selector'),summary=nav.locator('summary');
 await summary.tap();await page.keyboard.press('Escape');await expect(summary).toBeFocused();await expect(nav).not.toHaveAttribute('open','');
 await summary.tap();await nav.locator('a').last().focus();await page.keyboard.press('Tab');await expect(nav).not.toHaveAttribute('open','');
 await summary.tap();await page.locator('.space-content').tap({position:{x:10,y:10}});await expect(nav).not.toHaveAttribute('open','');
 await summary.tap();const link=nav.locator('a[href$="view=support"]');
 await link.dispatchEvent('pointerdown',{pointerType:'touch'});await summary.evaluate(el=>(el as HTMLElement).blur());await link.dispatchEvent('pointercancel',{pointerType:'touch'});
 await expect(page).toHaveURL(/view=overview/);await expect(nav).toHaveAttribute('open','');
 await link.focus();await page.keyboard.press('Enter');await destination(page,'fr','support',true);
});

test('unavailable sections and signed-out access retain the chosen destination',async({page})=>{
 const f=await fixture(page);await page.setViewportSize({width:375,height:844});
 await page.goto('/fr/shida/space/?view=overview');await content(page,'overview');
 await page.route('**/api/shida/personal/support/**',route=>route.fulfill({status:503,json:{}}));
 await select(page,'support',true,true);
 await expect(page.locator('.space-support [role=alert]')).toBeVisible();
 await expect(page.locator('.space-section-selector summary')).toContainText(accountSupportCopy.fr.title);
 await expect(page.locator('.activity-overview')).toHaveCount(0);
 f.signOut();await page.reload();
 await expect(page.locator('#support-reply')).toHaveCount(0);
 await expect(page.locator('.space-section-selector summary')).toContainText(accountSupportCopy.fr.title);
 await select(page,'listings',true,true);
 await expect(page.locator('.space-sign-in')).toBeVisible();
 await expect(page.locator('.space-section-selector summary')).toContainText('Mes annonces');
 await expect(page.locator('.my-listings,.activity-overview')).toHaveCount(0);
 expect(f.errors).toEqual([]);
});
