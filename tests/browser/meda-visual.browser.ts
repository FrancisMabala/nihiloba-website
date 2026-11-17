import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {medaCopy} from '../../app/lib/meda-copy';
import {medaDiscoveryCopy} from '../../app/lib/meda-discovery-copy';
const evidence='docs/evidence/meda-visual';
const sample={reference:'MED_visual',status:'published',title:'Paris → Kinshasa',side:'offer',category:'luggage',origin_country:'FR',origin_city:'Paris',destination_country:'CD',destination_city:'Kinshasa',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:'8',unit:'kg',description:'Space for books and clothing.',price:'10',currency:'EUR',price_basis:'kg',enquiry_count:2};
async function fixture(page:Page,mode='results'){
 const queries:URL[]=[];
 await page.route('**/api/shida/**',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  if(path==='/api/shida/employment/session')return route.fulfill(mode==='guest'?{status:401,json:{}}:{json:{binding:'a'.repeat(64),user:{display_name:'Meda member'}}});
  if(path==='/api/shida/registration-reference')return route.fulfill({json:{items:[{code:'FR',name:'France'},{code:'CD',name:'Congo (RDC)'}]}});
  if(path==='/api/shida/personal/meda/discovery'){queries.push(url);return route.fulfill(mode==='error'?{status:503,json:{}}:{json:{items:mode==='empty'||url.searchParams.get('origin')==='Nowhere'?[]:[sample,{...sample,reference:'MED_long',category:'container',capacity:null,price:null,origin_city:'Saint-Quentin-en-Yvelines – Montigny-le-Bretonneux',destination_city:'Kinshasa – Mont-Ngafula',unit:'m3',details:{volume_unknown:true}},{...sample,reference:'MED_third',side:'request',price:'0'}],page:1,has_more:false}});}
  if(path==='/api/shida/personal/meda/listings')return route.fulfill({json:{items:[{...sample,revision:2}],total:1,page:1,has_more:false}});
  if(path==='/api/shida/personal/meda/listings/MED_visual')return route.fulfill({json:{...sample,revision:2}});
  if(path==='/api/shida/personal/job-offer')return route.fulfill({json:{rows:[{type:'job',reference:'JOB_visual',title:'Aide au jardin',status:'open',count:1},{type:'service',reference:'SVC_visual',title:'Réparation',status:'online',count:0}],values:{},profile:null}});
  if(path==='/api/shida/personal/meda/enquiries')return route.fulfill({json:{items:[{reference:'MEQ_visual',listing:sample,can_reply:true,unread:1,participant_label:'Marie'}],page:1,has_more:false}});
  if(path==='/api/shida/personal/meda/enquiries/MEQ_visual')return route.fulfill({json:{reference:'MEQ_visual',revision:1,status:'open',listing:sample,role:'owner',can_reply:true,unread:0,messages:[{reference:'MEM_visual',body:'Can we discuss the parcel?',mine:false,created_at:'2027-01-01T12:00:00Z'}]}});
  if(path.endsWith('/read'))return route.fulfill({json:{ok:true}});
  if(path.includes('/notifications'))return route.fulfill({json:path.endsWith('count')?{count:1,unread:1}:{items:[{reference:'NTF_visual',marketplace:'meda',title:'Meda',description:'',created_at:'2027-01-01T12:00:00Z',read:false,action_required:false,expired:false,acknowledged:false,action_url:'/fr/shida/meda/?view=conversation&ref=MEQ_visual',event_type:'message',can_handoff:false}],next_cursor:null}});
  return route.fulfill({status:404,json:{}});
 });return queries;
}
async function capture(page:Page,name:string){mkdirSync(evidence,{recursive:true});await page.mouse.click(1,1);await page.screenshot({path:`${evidence}/${name}.png`,fullPage:true});}
async function fits(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [360,390,430,820,1440])test(`discovery ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const queries=await fixture(page),v=medaDiscoveryCopy[locale],t=medaCopy[locale];await page.goto(`${locale==='en'?'':'/'+locale}/shida/meda/`);
 await expect(page.locator('.meda-result')).toHaveCount(3);await expect(page.locator('[data-meda-invitation]')).toHaveCount(1);await expect(page.locator('.meda-hero')).toContainText('Mema to tinda biloko na SHIDA!');await expect(page.locator('.meda-hero a')).toHaveCount(0);
 await expect(page.getByText(v.intro,{exact:true})).toBeVisible();await fits(page);const illustration=page.locator('.meda-hero .marketplace-hero-art');if(width<768)await expect(illustration).toBeHidden();else await expect(illustration).toBeVisible();
 if(locale==='fr'&&[390,1440].includes(width))await capture(page,`results-${width}`);
 await page.getByRole('button',{name:t.container,exact:true}).click();await expect.poll(()=>queries.at(-1)?.searchParams.get('category')).toBe('container');
 await page.getByRole('button',{name:v.needed,exact:true}).click();await expect.poll(()=>queries.at(-1)?.searchParams.get('side')).toBe('request');
 await page.getByLabel(v.origin,{exact:true}).fill('France');await page.getByRole('button',{name:t.search,exact:true}).first().click();await expect.poll(()=>queries.at(-1)?.searchParams.get('origin')).toBe('FR');
 await page.reload();await expect(page.getByLabel(v.origin,{exact:true})).toHaveValue(/France|Ufaransa|Falansa/);await page.getByRole('button',{name:v.reset}).click();await expect.poll(()=>queries.at(-1)?.searchParams.get('category')).toBe(null);await fits(page);
});
for(const width of [390,1440])for(const mode of ['guest','empty','no-match','error'])test(`${mode} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const queries=await fixture(page,mode),v=medaDiscoveryCopy.fr;await page.goto('/fr/shida/meda/'+(mode==='no-match'?'?origin=Nowhere':''));
 if(mode==='guest'){await expect(page.getByRole('heading',{name:v.access})).toBeVisible();await expect(page.locator('.meda-result')).toHaveCount(0);expect(queries.length).toBe(0);await expect(page.getByRole('link',{name:v.register})).toHaveAttribute('href',/returnTo=/);}
 else if(mode==='error'){await expect(page.locator('.meda-error')).toBeVisible();await expect(page.locator('.meda-empty')).toHaveCount(0);}
 else await expect(page.getByRole('heading',{name:mode==='empty'?v.empty:v.noMatch})).toBeVisible();
 if(mode!=='error')await expect(page.locator('[data-meda-invitation]')).toHaveCount(1);
 await fits(page);await capture(page,`${mode}-${width}`);
});
for(const width of [390,1440])test(`account listing tiles and homepage ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});await fixture(page);await page.goto('/fr/shida/space/?view=listings&tab=meda');
 await expect(page.locator('.listing-choices a')).toHaveCount(4);await expect(page.locator('.listing-choice-meda')).toContainText(medaDiscoveryCopy.fr.categories);await expect(page.locator('.listing-filters')).toContainText('Articles');await expect(page.locator('.listing-filters')).toContainText('Toutes (3)');await expect(page.locator('.meda-listing-row')).toContainText('2 demandes reçues');await fits(page);await capture(page,`listings-${width}`);
 await page.locator('.meda-listing-row').getByRole('link',{name:medaDiscoveryCopy.fr.manage,exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:medaCopy.fr.close,exact:true})).toBeVisible();await expect(page.locator('.meda-hero')).toHaveCount(0);
 await page.goto('/fr/shida/');await expect(page.locator('#explore a[data-market=meda]')).toContainText(medaDiscoveryCopy.fr.home);await fits(page);await capture(page,`homepage-${width}`);
});
test('legacy notification link keeps exact conversation in account messages',async({page})=>{
 await fixture(page);await page.goto('/fr/shida/meda/?view=conversation&ref=MEQ_visual');await expect(page.locator('.meda-conversation')).toContainText('Can we discuss the parcel?');await expect(page).toHaveURL(/view=messages.*market=meda.*ref=MEQ_visual/);await expect(page.locator('.meda-hero')).toHaveCount(0);
 await page.goto('/fr/shida/space/?view=messages');await page.locator('.messages-tabs').getByRole('link',{name:medaDiscoveryCopy.fr.conversations}).click();await expect(page.getByText('Marie',{exact:true})).toBeVisible();
});
test('keyboard filters and short viewport keep controls reachable',async({page})=>{
 await page.setViewportSize({width:360,height:480});const queries=await fixture(page);const v=medaDiscoveryCopy.fr,t=medaCopy.fr;
 await page.goto('/fr/shida/meda/');await expect(page.locator('.meda-result')).toHaveCount(3);
 await page.locator('.meda-filter-details summary').focus();await page.keyboard.press('Enter');await page.getByLabel(t.after,{exact:true}).fill('2027-01-01');await page.locator('.meda-filter-details').getByRole('button',{name:t.search}).click();
 await expect.poll(()=>queries.at(-1)?.searchParams.get('after')).toBe(await page.evaluate(()=>new Date('2027-01-01T00:00:00').toISOString()));await expect(page.locator('.meda-filter-count')).toHaveText('1');
 await page.getByRole('button',{name:v.reset}).click();await expect.poll(()=>queries.at(-1)?.searchParams.get('after')).toBe(null);
 const action=page.locator('[data-meda-invitation] a');await action.evaluate(el=>el.scrollIntoView({block:'center'}));await expect(action).toBeVisible();
 await expect.poll(async()=>{const box=await action.boundingBox(),nav=await page.locator('.shida-navigation').boundingBox();return box!.y+box!.height<=nav!.y&&box!.y>=0;}).toBe(true);await fits(page);
 await page.getByLabel(v.origin,{exact:true}).focus();expect(await page.getByLabel(v.origin,{exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
});
test('creation entry and messages navigation preserve their account destinations',async({page})=>{
 await fixture(page,'guest');await page.goto('/fr/shida/meda/');await page.locator('[data-meda-invitation] a').click();await expect(page).toHaveURL(/view=listings&tab=meda&meda_view=create/);await expect(page.locator('.meda-form')).toHaveCount(0);
 await page.unroute('**/api/shida/**');await fixture(page);await page.goto('/fr/shida/space/?view=messages&market=meda&meda_view=enquiries');await expect(page.getByText('Marie',{exact:true})).toBeVisible();
 await page.locator('.messages-tabs button').nth(1).click();await expect(page.locator('.messages-preferences')).toBeVisible();await expect(page.locator('.meda')).toHaveCount(0);
 await page.locator('.messages-tabs button').first().click();await expect(page.locator('.notification-card')).toBeVisible();
});
