import {quickSellCopy} from '../../app/lib/quick-sell-copy';
import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {jobSearchCopy,jobSearchSections} from '../../app/lib/job-search-copy';
const longName='Délégation de l’Union européenne en République démocratique du Congo';
const base='/fr/shida/space?view=';
async function fixture(page:Page){
 // Next's development evaluator needs eval; only relax the test document response on loopback.
 if(process.env.SHIDA_BROWSER_BASE?.startsWith('http://127.0.0.1:'))await page.route('**/shida/space**',async route=>{if(route.request().resourceType()!=='document')return route.continue();const response=await route.fetch(),headers={...response.headers()};delete headers['content-security-policy'];await route.fulfill({response,headers});});
 const state={enabled:false,fail:false,empty:false,draft:true,writes:[] as string[]};
 await page.route('**/api/**',async route=>{
  const r=route.request(),url=new URL(r.url()),p=url.pathname.replace(/\/$/,''),send=(json:unknown,status=200)=>route.fulfill({json,status});
  if(r.method()!=='GET'){state.writes.push(p);if(state.fail)return send({},503);}
  const companies=[longName,'SERVTEC'].map((name,i)=>({relation_ref:'REL_'+String(i+1).repeat(64),kind:'organization_directory',reference:'ORGDIR_'+i,employer_ref:'ORGDIR_'+i,name,available:true,notifications:state.enabled,management_status:'shida_created',open_job_count:i+1}));
  if(p.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Synthetic owner'}});
  if(p.endsWith('/employment/applications'))return send({applications:[],total:0,has_more:false});
  if(p.endsWith('/personal/candidate')){if(r.method()==='POST'&&r.postDataJSON().action==='cancel')state.draft=false;return send({profiles:[],progress:state.draft?[{public_ref:'DRF_one',revision:1,profile_type:'professional',state:'active',values:{}}]:[],metadata:{categories:[],required:{professional:[],occasional_work:[]}}});}
  if(p.endsWith('/following'))return send({items:companies,total:2,page:1,has_more:false});
  if(p.endsWith('/saved'))return send({items:[],total:0,page:1,has_more:false});
  if(p.endsWith('/notifications')){state.enabled=r.postDataJSON().enabled;return send({enabled:state.enabled});}
  if(p.endsWith('/delivery-channel'))return send({channel:'whatsapp',email_state:'ready',masked_email:'a***@example.test'});
  if(p.endsWith('/alerts'))return send({profile_count:1,enabled_count:0});
  if(p.endsWith('/personal/job-offer'))return send({rows:state.empty?[]:[{type:'job',reference:'JOB_one',title:'Aide ménagère',status:'open',location:'Kinshasa · Kintambo',count:0},{type:'job',reference:'PJO_one',title:null,status:'draft'},{type:'article',reference:'PRD_one',title:'Lampe rechargeable',status:'online',price:'45000',currency:'CDF'},{type:'service',reference:'SVC_one',title:'Réparation à domicile',status:'available',location:'Limete',count:0}]});
  if(p.endsWith('/quick-sell'))return send({store:{public_ref:'WS_one',revision:1,city:'Kinshasa',name:'Personal',delivery_areas:[],order_ready:true}});
  if(p.endsWith('/stores'))return send({stores:[{public_ref:'WS_shop',name:'Boutique indépendante',selling_mode:'shop'}],product_categories:[{code:'home',labels:{fr:'Maison',en:'Home',ln:'Ndako',sw:'Nyumba'}}]});
  if(p.endsWith('/products'))return send({products:state.empty?[]:[{public_ref:'PRD_one',revision:1,name:'Lampe rechargeable',price:'45000',currency:'CDF',category:'home',condition:'used',description:'Long description',visible:'true',status:'active',quick_sell_state:'available',available_stock:1,committed_quantity:0,photos:[]}],next_offset:null});
  if(p.endsWith('/quick-sell-drafts'))return send({drafts:[],next_offset:null});
  if(p.endsWith('/plan'))return send({active_products:1,active_product_limit:10});
  if(p.endsWith('/security/navigation'))return send({markets:['wenze'],organization_management:false});
  if(p.endsWith('/personal/restaurants'))return send({items:[],total:0});
  if(p.endsWith('/personal/services'))return send({profiles:[]});
  return send({});
 });return state;
}
test('matched mobile evidence',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});
 const dir='C:/NIHILOBA/release-evidence/personal-space-mobile-20261116'+(process.env.SHIDA_BROWSER_BASE?'/next':'/components');await mkdir(dir,{recursive:true});
 for(const section of ['listings','applications','following','profiles','alerts']){
  await page.goto(base+(section==='listings'?'listings':'job-search&section='+section));
  await expect(page.locator(section==='listings'?'.my-listings':'.job-search-workspace')).toBeVisible({timeout:30000});
  await expect(page.getByText('Chargement…',{exact:true})).toHaveCount(0);
  await page.screenshot({path:`${dir}/${process.env.SHIDA_EVIDENCE_PHASE||'after'}-${section}-390.png`,fullPage:true});
 }
});
for(const width of [320,375,390,430,768,1280])test(`all job sections and article layouts fit ${width}`,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:844});
 for(const section of jobSearchSections){
  await page.goto(base+'job-search&section='+section);
  const nav=page.locator('.search-tabs');await expect(nav).toBeVisible();
  await expect(nav.locator('[aria-current=page]')).toHaveAttribute('href',new RegExp('section='+section+'$'));
  await expect(page.getByText('Chargement…',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  if(width<=430){const active=await nav.locator('[aria-current]').boundingBox(),box=await nav.boundingBox();expect(active!.x).toBeGreaterThanOrEqual(box!.x-1);expect(active!.x+active!.width).toBeLessThanOrEqual(box!.x+box!.width+1);}
 }
 await page.goto(base+'listings&tab=article');await expect(page.locator('.qs-listing-card')).toContainText('Lampe rechargeable');
 await expect(page.locator('.qs')).not.toContainText('Boutique indépendante');
 const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:Array.from(document.querySelectorAll('.my-listings *')).filter(e=>e.getBoundingClientRect().right>innerWidth).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width}))}));expect(overflow.scroll,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width+1);
});
test('all six tab destinations, back, forward and refresh render their content',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(base+'job-search');
 const content={overview:'.search-counts',saved:'.workspace-heading',applications:'.workspace-app-empty',following:'.followed-companies',profiles:'.job-profile-cards',alerts:'.employer-alerts'};
 for(const section of jobSearchSections){await page.locator('.search-tabs').getByRole('link',{name:jobSearchCopy.fr[section],exact:true}).click();await expect(page.locator(content[section])).toBeVisible();if(section==='following')await expect(page.locator(content[section])).toContainText(longName);}
 await page.goBack();await expect(page.locator('.job-profile-cards')).toBeVisible();await page.goForward();await expect(page.locator('.employer-alerts')).toBeVisible();await page.reload();await expect(page.locator('.employer-alerts')).toBeVisible();
});
test('article category, all statuses, filtered empty, advice and history',async({page})=>{
 const state=await fixture(page);await page.goto(base+'listings');
 await expect(page.locator('.listing-filters')).toContainText('Articles (1)');
 await page.locator('.listing-filters').getByRole('button',{name:'Articles (1)',exact:true}).click();
 await expect(page.locator('.qs-listing-card')).toContainText('45000 CDF');
 await expect(page.locator('.qs-advice')).not.toHaveAttribute('open','');
 for(const label of ['Brouillons','En ligne','Vendues / indisponibles','Non publiées','Transactions en cours','Archivées']){
  await page.locator('.qs-primary-filters').getByRole('button',{name:new RegExp('^'+label.replace('/','\\/')+' \\(')}).click();
  if(label==='En ligne')await expect(page.locator('.qs-listing-card')).toHaveCount(1);else {await expect(page.locator('.qs-empty')).toContainText('Aucun article pour ce filtre.');await expect(page.getByRole('button',{name:'Voir tous les articles'})).toBeVisible();}
 }
 await page.getByRole('button',{name:'Voir tous les articles'}).click();await expect(page.locator('.qs-listing-card')).toHaveCount(1);
 await page.goBack();await expect(page.locator('.qs-primary-filters [aria-pressed=true]')).toContainText('Archivées');await page.reload();await expect(page.locator('.qs-empty')).toContainText('Aucun article pour ce filtre.');
 state.empty=true;await page.goto(base+'listings&tab=article');await expect(page.locator('.qs-empty')).toContainText('Aucun article pour le moment');await expect(page.locator('.qs-create')).toHaveCount(1);await expect(page.locator('.listing-filters')).toContainText('Articles (0)');
});
test('alert error keeps saved preference; retry and company labels remain correct',async({page})=>{
 const state=await fixture(page);await page.goto(base+'job-search&section=alerts');const toggle=page.getByRole('switch',{name:new RegExp(longName)});
 await expect(toggle).toHaveAttribute('aria-checked','false');state.fail=true;await toggle.click();await expect(page.locator('.employer-alerts').getByRole('alert')).toBeVisible();await expect(toggle).toHaveAttribute('aria-checked','false');state.fail=false;
 await page.locator('.employer-alerts').getByRole('alert').getByRole('button',{name:'Réessayer'}).click();await expect(toggle).toHaveAttribute('aria-checked','true');await page.reload();await expect(toggle).toHaveAttribute('aria-checked','true');expect(state.writes).toHaveLength(2);
});
test('draft removal stays secondary and requires confirmation',async({page})=>{
 const state=await fixture(page);await page.goto(base+'job-search&section=profiles');
 await expect(page.getByRole('button',{name:'Supprimer le brouillon',exact:true})).toBeHidden();await page.locator('.job-profile-cards .record-actions summary').click();await page.getByRole('button',{name:'Supprimer le brouillon',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();expect(state.writes).toHaveLength(0);await page.getByRole('dialog').getByRole('button',{name:/Supprimer/}).click();await expect(page.locator('.job-profile-cards').getByRole('button',{name:'Créer mon profil',exact:true})).toHaveCount(2);expect(state.writes).toHaveLength(1);
});
test('enlarged text preserves long names, controls and page width',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});
 for(const section of ['following','alerts','profiles']){await page.goto(base+'job-search&section='+section);await page.addStyleTag({content:'.account-space{font-size:24px}.account-space h3{font-size:30px!important}.account-space button,.account-space summary{font-size:24px}'});await expect(page.locator('.job-search-workspace')).toBeVisible();await expect(page.getByText('Chargement…',{exact:true})).toHaveCount(0);const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:Array.from(document.querySelectorAll('.job-search-workspace *')).filter(e=>e.getBoundingClientRect().right>innerWidth).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent?.slice(0,50),width:e.getBoundingClientRect().width}))}));expect(overflow.scroll,section+JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width+1);}
});


test('management keeps boutiques and restaurants separate from personal articles',async({page})=>{
 test.skip(!process.env.SHIDA_BROWSER_BASE,'Requires the full Next account shell');
 await fixture(page);await page.setViewportSize({width:390,height:844});
 await page.route('**/personal/wenze/stores/**',r=>{if(!new URL(r.request().url()).pathname.replace(/\/$/,'').endsWith('/stores'))return r.fallback();return r.fulfill({json:{product_categories:[],stores:[{public_ref:'WS_shop',name:'Boutique indépendante',selling_mode:'shop',status:'active'},{public_ref:'WS_personal',name:'Personal inventory',selling_mode:'individual',status:'active'}]}});});
 await page.route('**/personal/restaurants/**',r=>r.fulfill({json:{items:[{public_ref:'RST_one',profile:{name:'Restaurant synthétique',city:'Kinshasa'},status:'active'}],total:1}}));
 await page.goto(base+'manage');
 const management=page.locator('.management-space-selector');
 await expect(management).toContainText('Boutique indépendante');await expect(management).toContainText('Restaurant synthétique');await expect(management).not.toContainText('Personal inventory');
 await expect(management.getByRole('link',{name:/Boutique indépendante/})).toHaveAttribute('href','/fr/shida/seller/wenze?store=WS_shop');
 await expect(management.getByRole('link',{name:/Restaurant synthétique/})).toHaveAttribute('href','/fr/shida/seller/restaurants?establishment=RST_one');
 await page.screenshot({path:'C:/NIHILOBA/release-evidence/personal-space-mobile-20261116/next/after-management-390.png',fullPage:true});
 await management.getByRole('link',{name:/Mes articles personnels/}).click();await expect(page.locator('.qs-listing-card')).toContainText('Lampe rechargeable');
 await expect(page.locator('.shida-navigation a[aria-current=page]')).toContainText('Mon espace');
 await expect(page.locator('.listing-filters')).toContainText('Articles (1)');await page.reload();await expect(page.locator('.qs-listing-card')).toHaveCount(1);
 await page.screenshot({path:'C:/NIHILOBA/release-evidence/personal-space-mobile-20261116/next/after-articles-390.png',fullPage:true});
 const advice=page.locator('.qs-advice summary');await advice.evaluate(element=>element.scrollIntoView({block:'center'}));await expect.poll(async()=>{const a=await advice.boundingBox(),nav=await page.locator('.shida-navigation').boundingBox();return a!.y+a!.height<=nav!.y;}).toBe(true);
});

test('personal article editing and unpublishing keep revisions and confirmation',async({page})=>{
 await fixture(page);const t=quickSellCopy.fr;
 let product={public_ref:'PRD_one',revision:3,name:'Lampe rechargeable',price:'45000',currency:'CDF',category:'home',condition:'used',description:'Description',price_negotiable:'no',visible:'true',status:'active',quick_sell_state:'available',available_stock:1,committed_quantity:0,photos:[]};
 const writes:unknown[]=[];
 await page.route('**/products**',r=>{const p=new URL(r.request().url()).pathname.replace(/\/$/,'');if(p.endsWith('/products'))return r.fulfill({json:{products:[product],next_offset:null}});if(r.request().method()==='PATCH'){const b=r.request().postDataJSON();writes.push(b);product={...product,...b.fields,revision:4};}else {const b=r.request().postDataJSON();writes.push(b);product={...product,visible:'false',quick_sell_state:'unpublished',revision:5};}return r.fulfill({json:product});});
 await page.goto(base+'listings&tab=article');const card=page.locator('.qs-listing-card');await card.locator('details>summary').click();await card.getByRole('button',{name:t.edit,exact:true}).click();
 await page.locator('input[name=name]').fill('Lampe modifiée');await page.getByRole('combobox',{name:t.category,exact:true}).selectOption('home');
 await page.getByRole('button',{name:t.save,exact:true}).click();await expect(card).toContainText('Lampe modifiée');expect(writes[0]).toMatchObject({expected_revision:3,fields:{name:'Lampe modifiée'}});
 await card.locator('details>summary').click();await card.getByRole('button',{name:t.hide,exact:true}).click();expect(writes).toHaveLength(1);await page.getByRole('dialog').getByRole('button',{name:t.hide,exact:true}).click();await expect(card).toContainText('Non publiée');expect(writes[1]).toEqual({expected_revision:4});
});
