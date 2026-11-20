// Independent acceptance using existing Meda browser-fixture contract; no server lifecycle.
import {test,expect,type Page} from '@playwright/test';
import {medaCopy,type MedaLocale} from '../app/lib/meda-copy';
import {medaParticipationCopy} from '../app/lib/meda-participation-copy';
import {medaDiscoveryCopy} from '../app/lib/meda-discovery-copy';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const evidence=process.env.SHIDA_QA_OUTPUT!;
const sample={reference:'MED_QA',status:'published',title:'Paris → Kinshasa · 10 kg',side:'offer',category:'luggage',origin_country:'FR',origin_city:'Saint-Quentin-en-Yvelines – Montigny-le-Bretonneux',destination_country:'CD',destination_city:'Kinshasa – Mont-Ngafula',departure_at:'2027-02-20T14:00:00Z',deadline_at:'2027-02-19T14:00:00Z',capacity:'10',unit:'kg',description:'Clothing and books. Collection discussed privately.',price:'8',currency:'EUR',price_basis:'kg'};
test.beforeEach(async({context})=>{await context.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?r.continue():r.abort('blockedbyclient');});});
async function fixture(page:Page,guest=false){
 const state={queries:[] as URL[],writes:[] as {path:string;body:Record<string,unknown>}[],draft:null as Record<string,unknown>|null,fail:false,photoFail:false};
 await page.route('**/api/shida/**',async route=>{const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill(guest?{status:401,json:{}}:{json:{binding:'a'.repeat(64),user:{display_name:'Synthetic QA'}}});
  if(path.endsWith('/registration-reference')){const q=url.searchParams.get('q')??'';const items=[{code:'FR',name:'France'},{code:'CD',name:'Congo (RDC)'}];return route.fulfill({json:{items,matched_code:q==='FR'||q==='CD'?q:undefined}});}
  if(path.endsWith('/personal/meda/discovery')){state.queries.push(url);return route.fulfill(state.fail?{status:503,json:{}}:{json:{items:[sample],page:1,has_more:false}});}
  if(path.endsWith('/personal/meda/listings')&&req.method()==='POST'){const body=req.postDataJSON();state.writes.push({path,body});state.draft={...body.values,reference:'MED_QA_DRAFT',status:'draft',revision:1};return route.fulfill({json:state.draft});}
  if(path.endsWith('/personal/meda/listings/MED_QA_DRAFT')){if(req.method()==='POST'){const body=req.postDataJSON();state.writes.push({path,body});state.draft={...state.draft,status:body.action==='publish'?'published':'draft',revision:2};}return route.fulfill({json:state.draft});}
  if(path.endsWith('/personal/meda/photos'))return route.fulfill(state.photoFail?{status:503,json:{}}:{json:{reference:'MPH_QA'}});
  if(path.includes('/notifications'))return route.fulfill({json:path.endsWith('count')?{count:0,unread:0}:{items:[]}});
  if(path.endsWith('/security/navigation'))return route.fulfill({json:{can_manage:false,markets:[],organization_management:false}});
  if(path.endsWith('/personal/meda/listings')||path.endsWith('/personal/meda/enquiries'))return route.fulfill({json:{items:[],page:1,has_more:false}});
  return route.fulfill({status:404,json:{}});
 });return state;
}
async function capture(page:Page,name:string){mkdirSync(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${name}.png`,fullPage:true});}
async function fits(page:Page){const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport+1);}
const cases: Array<[MedaLocale,number]>=(['en','fr','ln','sw'] as MedaLocale[]).flatMap(locale=>[390,1440].map(width=>[locale,width] as [MedaLocale,number])).concat([['fr',320],['fr',360],['fr',412]]);
for(const [locale,width] of cases)test(`Meda QA filters ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const state=await fixture(page),t=medaCopy[locale],v=medaDiscoveryCopy[locale];
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/meda/`);await expect(page.locator('.meda-result')).toHaveCount(1);await fits(page);
 await expect(page.locator('.meda h1')).toHaveCount(1);await expect(page.locator('.meda .st-invitation-icon,.meda-empty-icon')).toHaveCount(0);
 for(const locator of [page.locator('.meda-categories button').first(),page.locator('.meda-sides button').first(),page.locator('.meda-filter-details summary')]){const b=await locator.boundingBox();expect(b!.height).toBeGreaterThanOrEqual(44);}
 if(width<768){const group=await page.locator('.meda-categories').boundingBox();for(const button of await page.locator('.meda-categories button').all()){const box=await button.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(group!.x-1);expect(box!.x+box!.width).toBeLessThanOrEqual(group!.x+group!.width+1);}expect(await page.locator('.meda-categories').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);}
 await capture(page,`meda-filter-${locale}-${width}`);
 await page.locator('.meda-filter-details summary').focus();await page.keyboard.press('Enter');await page.getByLabel(t.after,{exact:true}).fill('2027-01-01');await page.locator('.meda-filter-details').getByRole('button',{name:t.search,exact:true}).click();
 await expect.poll(()=>state.queries.at(-1)?.searchParams.has('after')).toBe(true);await expect(page.locator('.meda-filter-count')).toHaveText('1');
 await page.getByRole('button',{name:v.reset,exact:true}).click();await expect.poll(()=>state.queries.at(-1)?.searchParams.has('after')).toBe(false);await fits(page);
});
for(const [locale,width,category] of [['en',1440,'luggage'],['fr',320,'container'],['fr',390,'airport'],['ln',390,'luggage'],['sw',412,'container']] as const)test(`Meda QA form ${locale} ${width} ${category}`,async({page})=>{
 await page.setViewportSize({width,height:900});const state=await fixture(page),t=medaCopy[locale],x=medaParticipationCopy[locale];
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=listings&tab=meda&meda_view=create`);const form=page.locator('.meda-form');await expect(form).toBeVisible();
 await expect(form.getByRole('heading',{name:t.create,exact:true})).toHaveCount(1);await fits(page);
 await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('[data-step="0"]')).toBeVisible();
 await expect(form.locator('input:invalid,select:invalid,textarea:invalid').first()).toBeFocused();
 await form.getByRole('combobox',{name:t.luggage+' / '+t.container,exact:true}).selectOption(category);
 if(category==='container')await form.getByRole('combobox',{name:x.offer+' / '+x.request,exact:true}).selectOption('request');
 await page.locator('#meda-from-country').fill('FR');await expect(page.locator('#meda-from-country')).toHaveValue('France');
 await page.locator('#meda-to-country').fill('CD');await expect(page.locator('#meda-to-country')).toHaveValue('Congo (RDC)');
 await form.locator('[name=origin_city]').fill('Paris');await form.locator('[name=destination_city]').fill('Kinshasa');await form.locator('[name=collection_area]').fill('Central collection area');
 await form.locator('[name=departure_at]').fill('2027-02-20T14:00');await form.locator('[name=deadline_at]').fill('2027-02-19T14:00');
 if(category==='airport'){await form.locator('[name=departure_airport]').fill('CDG');await form.locator('[name=arrival_airport]').fill('FIH');}
 await capture(page,`meda-form-step0-${locale}-${width}`);await form.getByRole('button',{name:t.next,exact:true}).click();
 await expect(form.locator('[aria-current=step]')).toBeFocused();await expect(form.locator('[data-step="1"]')).toBeVisible();
 await form.locator('[name=capacity]').fill('10');await form.locator('[name=description]').fill('Books and clothing packed in two small boxes.');await form.locator('[name=accepted_objects][value=books]').check();
 await expect(form.locator('.meda-objects h3')).toHaveText(x.photos+(category==='container'?' *':''));await expect(form.locator('.meda-objects label').filter({hasText:x.photos})).toHaveCount(0);await expect(form.locator('input[type=file]')).toHaveAccessibleName(x.photos+(category==='container'?' *':''));
 if(category==='container'){await form.getByLabel(x.contents,{exact:true}).fill('Books and clothing packed in two small boxes.');await form.getByLabel(x.weight,{exact:true}).fill('3');await form.getByLabel(x.packages,{exact:true}).fill('2');}
 await capture(page,`meda-form-step1-${locale}-${width}`);await fits(page);
 await form.getByRole('button',{name:t.previous,exact:true}).click();await expect(form.locator('[name=origin_city]')).toHaveValue('Paris');await expect(form.locator('[aria-current=step]')).toBeFocused();await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('[name=description]')).toHaveValue('Books and clothing packed in two small boxes.');
 await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('[data-step="2"]')).toBeVisible();await expect(form.locator('[aria-current=step]')).toBeFocused();
 if(category==='container')await expect(form.getByRole('button',{name:t.publish,exact:true})).toBeDisabled();
 await form.locator('[name=title]').fill('Synthetic QA Paris to Kinshasa');await capture(page,`meda-form-step2-${locale}-${width}`);await fits(page);
 await form.getByRole('button',{name:t.save,exact:true}).click();await expect.poll(()=>state.writes.length).toBe(1);
 expect(state.writes[0].body.values).toMatchObject({category,origin_country:'FR',destination_country:'CD',origin_city:'Paris',destination_city:'Kinshasa',capacity:'10',details:{accepted_objects:['books']}});
 expect(state.writes[0].body.operation_key).toBeTruthy();expect(state.writes.some(w=>w.body.action==='publish')).toBe(false);
});
test('Meda QA anonymous data boundary and recoverable filter failure',async({page})=>{
 const guest=await fixture(page,true);await page.goto('/shida/meda/');await expect(page.locator('.meda-access')).toBeVisible();expect(guest.queries).toHaveLength(0);await expect(page.locator('.meda-result')).toHaveCount(0);
 await page.unroute('**/api/shida/**');const state=await fixture(page);state.fail=true;await page.reload();await expect(page.locator('.meda-error')).toBeVisible();state.fail=false;await page.locator('.meda-error button').click();await expect(page.locator('.meda-result')).toHaveCount(1);await expect(page.locator('.meda-error')).toHaveCount(0);
});

async function realIdentity(page:Page){
 // Existing accepted synthetic session only. Never emit its cookie/token or body.
 const work='C:/NIHILOBA/local-dev/acceptance-runtime/';
 const owner=JSON.parse(readFileSync(work+'owner.json','utf8'));
 const pub=JSON.parse(readFileSync(work+'fixture-public.json','utf8'));
 const privateFixture=JSON.parse(readFileSync(work+'fixture-private.json','utf8'));
 if(owner.uuid!=='2f654732-a44d-4755-99df-55a111aa50cf'||privateFixture.owner_uuid!==owner.uuid||privateFixture.generation!==pub.generation)throw Error('Synthetic identity ownership differs');
 await page.context().addCookies([{name:'nihiloba_personal_session',value:privateFixture.personal.token,domain:'localhost',path:'/api/shida',httpOnly:true,secure:false,sameSite:'Lax'}]);
}
for(const [locale,width] of cases)test(`Jobs real QA layout ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:900});const full:string[]=[];page.on('request',r=>{if(/\/public-jobs\/[^/]+\/full\//.test(r.url()))full.push(new URL(r.url()).pathname);});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/emplois/`);await expect(page.locator('.job-list-row').first()).toBeVisible();await fits(page);
 const rows=page.locator('.job-list-row'),pane=page.locator('.job-list-pane');
 if(width>=1024){await expect(pane).toBeVisible();const url=page.url();await rows.nth(1).click();await expect(rows.nth(1)).toHaveAttribute('aria-current','true');await expect(pane.locator('h2')).toHaveText(await rows.nth(1).locator('h3').innerText());expect(page.url()).toBe(url);await rows.first().focus();await page.keyboard.press('Enter');await expect(pane).toBeFocused();}
 else{await expect(pane).toBeHidden();await rows.first().click();await expect(page.locator('.job-access-dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(rows.first()).toBeFocused();}
 expect(full).toHaveLength(0);
 const previous=page.locator('.jobs-page-previous'),next=page.locator('.jobs-page-next'),position=page.locator('.jobs-page-position');
 const a=await previous.boundingBox(),b=await next.boundingBox(),p=await position.boundingBox();expect(a!.height).toBeGreaterThanOrEqual(44);expect(b!.height).toBeGreaterThanOrEqual(44);expect(a!.x+a!.width).toBeLessThanOrEqual(b!.x+1);
 if(width<600)expect(p!.y+p!.height).toBeLessThanOrEqual(a!.y+1);
 await capture(page,`jobs-real-${locale}-${width}`);
 if(width===390&&locale==='fr'){await next.click();await expect(page).toHaveURL(/page=2/);await expect(page.locator('.job-list-row')).toHaveCount(2);await page.goBack();await expect(page.locator('.job-list-row')).toHaveCount(12);}
});
test('Jobs real QA member selected detail and company Follow alignment',async({page})=>{
 await realIdentity(page);await page.setViewportSize({width:1440,height:1000});const full:string[]=[];page.on('response',r=>{if(/\/public-jobs\/[^/]+\/full\//.test(r.url())&&r.status()===200)full.push(new URL(r.url()).pathname);});
 await page.goto('/fr/shida/emplois/');await expect(page.locator('.job-list-pane .job-detail-content')).toBeVisible();expect(new Set(full).size).toBe(1);
 await page.locator('.job-list-row').nth(1).click();await expect(page.locator('.job-list-pane .job-detail-content')).toBeVisible();await expect.poll(()=>new Set(full).size).toBe(2);
 const fixture=JSON.parse(readFileSync('C:/NIHILOBA/release-evidence/emploi-meda-mobile-20261119/environment/marketplace-fixtures.json','utf8'));
 await page.goto('/fr/shida/emplois/employeurs/'+fixture.jobs[0].employer+'/');const heading=page.locator('.employer-title-row');await expect(heading).toBeVisible();
 const title=await heading.locator('h1').boundingBox(),follow=await heading.locator('button').first().boundingBox();expect(follow!.x).toBeGreaterThan(title!.x);await capture(page,'company-follow-desktop-real');
});
test('Meda real QA member filters and synthetic draft publication',async({page})=>{
 await realIdentity(page);await page.setViewportSize({width:390,height:900});await page.goto('/fr/shida/meda/');await expect(page.locator('.meda-result').first()).toBeVisible();await fits(page);await capture(page,'meda-member-real');
 await page.goto('/fr/shida/space/?view=listings&tab=meda&meda_view=create');const form=page.locator('.meda-form');await expect(form).toBeVisible();
 await page.locator('#meda-from-country').fill('FR');await expect(page.locator('#meda-from-country')).toHaveValue('France');await page.locator('#meda-to-country').fill('CD');await expect(page.locator('#meda-to-country')).toHaveValue(/Congo/);
 await form.locator('[name=origin_city]').fill('Paris');await form.locator('[name=destination_city]').fill('Kinshasa');await form.locator('[name=departure_at]').fill('2027-02-20T14:00');await form.locator('[name=deadline_at]').fill('2027-02-19T14:00');await form.getByRole('button',{name:medaCopy.fr.next,exact:true}).click();
 await form.locator('[name=capacity]').fill('3');await form.locator('[name=description]').fill('Livres emballés pour le contrôle synthétique local.');await form.getByRole('button',{name:medaCopy.fr.next,exact:true}).click();await form.locator('[name=title]').fill('Contrôle synthétique Meda local');
 const created=page.waitForResponse(r=>r.url().includes('/personal/meda/listings/')&&r.request().method()==='POST');await form.getByRole('button',{name:medaCopy.fr.save,exact:true}).click();const response=await created;const diagnostic=await response.json();expect(response.status(),JSON.stringify({detail:diagnostic.detail,origin:response.request().headers().origin,fetchSite:response.request().headers()['sec-fetch-site']})).toBe(200);await expect(page.locator('.meda-detail')).toContainText(medaCopy.fr.draft);
 const publish=page.locator('.meda-detail').getByRole('button',{name:medaCopy.fr.publish,exact:true});await publish.click();await expect(page.locator('.meda-detail')).toContainText(medaCopy.fr.published);await page.reload();await expect(page.locator('.meda-detail')).toContainText(medaCopy.fr.published);await fits(page);await capture(page,'meda-published-real');
});

for(const embedded of [true,false])test(`Jobs QA reader clears interrupted session ${embedded?'pane':'standalone'}`,async({page})=>{
 await realIdentity(page);await page.setViewportSize({width:1440,height:900});
 const fixtureData=JSON.parse(readFileSync('C:/NIHILOBA/release-evidence/emploi-meda-mobile-20261119/environment/marketplace-fixtures.json','utf8'));
 await page.goto(embedded?'/fr/shida/emplois/':'/fr/shida/emplois/'+fixtureData.jobs[0].slug+'/');await expect(page.locator('.job-detail-content')).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-login-attempt')));await expect(page.locator('.job-detail-content')).toHaveCount(0);
 await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('.job-detail-content')).toBeVisible();
 await page.route('**/api/shida/employment/session/',r=>r.fulfill({status:401,json:{}}));
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:null})));await expect(page.locator('.job-detail-content')).toHaveCount(0);
 if(embedded)await expect(page.locator('.job-list-preview')).toBeVisible();else await expect(page).toHaveURL(/emplois\/\?offer=/);
});
test('Meda real QA guest keeps member listings private',async({page})=>{
 const reads:string[]=[];page.on('request',r=>{if(r.url().includes('/personal/meda/'))reads.push(new URL(r.url()).pathname);});
 await page.goto('/fr/shida/meda/');await expect(page.locator('.meda-access')).toBeVisible();await expect(page.locator('.meda-result')).toHaveCount(0);expect(reads).toHaveLength(0);
 const result=await page.evaluate(async()=>{const r=await fetch('/api/shida/personal/meda/discovery/',{cache:'no-store'});return {status:r.status,containsItems:Array.isArray((await r.json()).items)};});expect([401,403]).toContain(result.status);expect(result.containsItems).toBe(false);
});
test('Meda QA diagnostic persisted synthetic detail reload',async({page})=>{
 await realIdentity(page);await page.goto('/fr/shida/space/?view=listings&tab=meda');
 const listing=await page.evaluate(async()=>{const session=await fetch('/api/shida/employment/session/').then(r=>r.json());const r=await fetch('/api/shida/personal/meda/listings/',{headers:{'x-shida-session':session.binding}});const data=await r.json();const row=data.items?.find((item:{title:string})=>item.title==='Contrôle synthétique Meda local');return {status:r.status,reference:row?.reference,state:row?.status};});
 expect(listing.status).toBe(200);expect(listing.reference).toBeTruthy();const responses:{path:string;status:number}[]=[];page.on('response',r=>{const url=new URL(r.url());if(url.pathname.includes('/meda/'))responses.push({path:url.pathname,status:r.status()});});
 const url='/fr/shida/space/?view=listings&tab=meda&meda_view=review&ref='+listing.reference;
 await page.goto(url);await page.waitForTimeout(3000);const before={url:page.url(),detail:await page.locator('.meda-detail').count(),search:await page.locator('.meda-search').count()};await capture(page,'meda-direct-published-detail');
 await page.reload();await page.waitForTimeout(3000);const after={url:page.url(),detail:await page.locator('.meda-detail').count(),search:await page.locator('.meda-search').count()};await capture(page,'meda-direct-published-reload');
 writeFileSync(evidence+'/meda-reload-diagnostic.json',JSON.stringify({listing,before,after,responses},null,2));expect(after.detail).toBe(1);
});
test('Jobs real QA mobile detail returns to filtered page',async({page})=>{
 await realIdentity(page);await page.setViewportSize({width:390,height:844});await page.goto('/fr/shida/emplois/?city=Kinshasa&page=2');const row=page.locator('.job-list-row').first();await expect(row).toBeVisible();const href=await row.getAttribute('href');await row.click();await expect(page).toHaveURL(new RegExp(href!.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$'));await expect(page.locator('.job-detail-content')).toBeVisible();
 const back=page.locator('.job-detail-return').getByRole('link',{name:'← Toutes les offres',exact:true});await expect(back).toHaveAttribute('href',/city=Kinshasa.*page=2/);await back.click();await expect(page).toHaveURL(/city=Kinshasa.*page=2/);await expect(page.locator('.job-list-row')).toHaveCount(2);await fits(page);
});
test('Jobs real QA modified native link opens gated canonical detail',async({page,context})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/fr/shida/emplois/');const row=page.locator('.job-list-row').nth(1),href=await row.getAttribute('href'),original=page.url();expect(href).toMatch(/^\/fr\/shida\/emplois\/[^/]+\/$/);
 const popupPromise=context.waitForEvent('page');await row.click({modifiers:['Control']});const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');await expect(popup).toHaveURL(/\/fr\/shida\/emplois\/\?offer=/);await expect(popup.locator('.job-access-dialog')).toBeVisible();await expect(popup.locator('.job-detail-content')).toHaveCount(0);expect(page.url()).toBe(original);await popup.close();
});
for(const width of [320,1440])test(`Jobs Meda real QA enlarged text ${width}`,async({page})=>{
 await realIdentity(page);await page.setViewportSize({width,height:900});for(const market of ['emplois','meda']){await page.goto('/fr/shida/'+market+'/');await expect(page.locator(market==='emplois'?'.job-list-row':'.meda-result').first()).toBeVisible();await page.addStyleTag({content:'html{font-size:200%}'});await fits(page);await capture(page,`${market}-real-text200-${width}`);}
});
test('Jobs QA delayed selection cannot overwrite newer offer and retry keeps focus',async({page})=>{
 await realIdentity(page);await page.setViewportSize({width:1440,height:900});await page.goto('/fr/shida/emplois/');await expect(page.locator('.job-list-pane .job-detail-content')).toBeVisible();
 const rows=page.locator('.job-list-row'),secondHref=await rows.nth(1).getAttribute('href'),thirdHref=await rows.nth(2).getAttribute('href'),thirdTitle=await rows.nth(2).locator('h3').innerText();
 const slug=(href:string)=>href.split('/').filter(Boolean).at(-1)!;let ready!:()=>void,release!:()=>void;const started=new Promise<void>(resolve=>{ready=resolve}),gate=new Promise<void>(resolve=>{release=resolve});
 await page.route(`**/api/shida/public-jobs/${slug(secondHref!)}/full/**`,async route=>{const response=await route.fetch();ready();await gate;await route.fulfill({response}).catch(()=>{});});
 await rows.nth(1).click();await started;await rows.nth(2).click();await expect(page.locator('.job-list-pane .job-detail-title h2')).toHaveText(thirdTitle);release();await page.waitForTimeout(150);await expect(page.locator('.job-list-pane .job-detail-title h2')).toHaveText(thirdTitle);
 let fail=true;await page.route(`**/api/shida/public-jobs/${slug(thirdHref!)}/full/**`,route=>{if(fail){fail=false;return route.fulfill({status:503,json:{}});}return route.continue();});await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));const retry=page.locator('.job-pane-error button');await expect(retry).toBeVisible();await retry.focus();await page.keyboard.press('Enter');await expect(page.locator('.job-list-pane .job-detail-title h2')).toHaveText(thirdTitle);expect(await page.locator('.job-list-pane').evaluate(el=>el.contains(document.activeElement))).toBe(true);
});
