import {test,expect,type Page} from '@playwright/test';
import {servicesProviderOffering} from './fixtures/services-provider';
import {fixture as wenzeFixture} from './wenze-checkout-fixture';
import {counterCopy} from '../../app/lib/services-counter-copy';
import {fixture as restaurantFixture} from './restaurant-c1e-fixture';
import {mkdirSync} from 'node:fs';
const evidence='C:/NIHILOBA/release-evidence/layout-batches-20261115';
const longName='Délégation de l’Union européenne en République démocratique du Congo';
async function alerts(page:Page){
 const items=[longName,'SERVTEC','A'.repeat(120),null].map((name,i)=>({relation_ref:'REL_'+i,reference:'CO_'+i,name,kind:'company',available:i!==3,logo:null,notifications:false}));
 await page.route('**/*',async route=>{const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');if(url.origin!=='http://127.0.0.1:3013')return route.abort();if(!path.startsWith('/api/'))return route.continue();
 const reply=(json:unknown,status=200)=>route.fulfill({json,status});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Test applicant'}});
 if(path.endsWith('/following'))return reply({items,total:items.length,page:1,has_more:false});
 if(path.endsWith('/delivery-channel'))return reply({channel:'whatsapp',email_state:'ready',masked_email:'a***@example.test'});
 if(path.endsWith('/alerts'))return reply({profile_count:1,enabled_count:0,external_application_tracking:false});
 if(path.endsWith('/notifications')){const row=items.find(i=>path.includes(i.relation_ref))!;row.notifications=route.request().postDataJSON().enabled;return reply({});}
 return reply({},404);
 });return items;
}
test('followed company cards before and after at responsive widths',async({page})=>{
 mkdirSync(evidence,{recursive:true});await alerts(page);
 for(const width of [1440,320,360,390,820]){
 await page.setViewportSize({width,height:900});await page.goto('/fr/shida/space/?view=job-search&section=alerts');
 await expect(page.getByRole('switch',{name:new RegExp(longName)})).toBeVisible();
 await page.screenshot({path:`${evidence}/alerts-${process.env.LAYOUT_BEFORE?'before':'after'}-${width}.png`,fullPage:true});
 if(!process.env.LAYOUT_BEFORE){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const text=page.locator('.alert-company-text').first();expect((await text.boundingBox())!.width).toBeGreaterThan(width<=390?130:250);}
 }
 const toggle=page.getByRole('switch',{name:new RegExp(longName)});await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');await page.reload();await expect(toggle).toHaveAttribute('aria-checked','true');await expect(page.getByRole('switch').last()).toBeDisabled();
});

async function localOnly(page:Page){await page.route('**/*',r=>new URL(r.request().url()).origin==='http://127.0.0.1:3013'?r.continue():r.abort());}
async function fits(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
for(const width of [1440,320,360,390,820])test(`Wenze connected identity and long products ${width}`,async({page})=>{
 await localOnly(page);const f=await wenzeFixture(page);
 await page.route('**/pos/catalog/**',r=>r.fulfill({json:{items:[{product_ref:'WNP_long',barcode:'WNP_long',name:'Chemise à manches longues en coton de fabrication artisanale pour toutes les occasions',price:'15000',currency:'CDF',available:3,image_url:null,category:'other'}],categories:['other'],total:1}}));
 await page.setViewportSize({width,height:900});await page.goto(f.url+'&view=sales');await expect(page.locator('.wz-pos-product-button')).toBeVisible();await fits(page);expect((await page.locator('.wz-pos-product-button strong').boundingBox())!.width).toBeGreaterThan(90);
 if(width<1024){await page.getByRole('button',{name:'Navigation',exact:true}).click();await expect(page.getByRole('dialog',{name:'Navigation'})).toContainText('Boutique du Fleuve');await page.keyboard.press('Escape');}
 await page.screenshot({path:`${evidence}/wenze-${width}.png`,fullPage:true});expect(f.errors).toEqual([]);
});
for(const width of [1440,320,360,390,820])test(`Services navigation templates and receipt persistence ${width}`,async({page})=>{
 await localOnly(page);let saved=false,writes=0;
 const title='Accompagnement professionnel personnalisé pour les petites entreprises et les associations';
 const sale={sale_ref:'SCS_test',presentation:{display_name:'Cabinet du Fleuve'},currency:'CDF',total:'25000.00',received:'10000.00',outstanding:'15000.00',effective_date:'2026-11-15',lines:[{service_name:title,quantity:1,unit_price:'25000.00',amount:'25000.00'}],payments:[{receipt_ref:'SCR_test',amount:'10000.00',method:'cash',effective_date:'2026-11-15'}]};
 await page.route('**/api/**',async r=>{const path=new URL(r.request().url()).pathname.replace(/\/$/,''),reply=(json:unknown)=>r.fulfill({json});
 if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Owner'}});
 if(path.endsWith('/capabilities'))return reply({capabilities:['profile','bills','manual_journal','basic_totals','structured_availability','requests_quotes','quote_templates','bill_templates']});
 if(path.endsWith('/services'))return reply({profiles:[{...servicesProviderOffering,name:'Cabinet du Fleuve',service_name:title,packages:[{public_ref:'SPK_one',name:title,price:'25000',currency:'CDF',duration_minutes:60}]}]});
 if(path.endsWith('/bill-presentation'))return reply({preview:{display_name:'Cabinet du Fleuve'}});
 if(path.endsWith('/counter')){if(r.request().method()==='POST'){writes++;saved=true;return reply(sale);}return reply({sales:saved?[sale]:[],next_offset:null});}
 if(path.endsWith('/reviews'))return reply({reviews:[]});
 if(path.endsWith('/templates'))return reply({templates:[]});
 if(path.endsWith('/services/onboarding'))return reply({progress:[],remaining_capacity:4});
 return r.fulfill({status:404,json:{}});
 });await page.setViewportSize({width,height:1000});await page.goto('/fr/shida/seller/services?view=counter');
 const form=page.locator('.svc-counter-sale');await form.getByRole('button',{name:new RegExp(title)}).click();await form.getByRole('button',{name:new RegExp(title)}).last().click();await fits(page);expect((await page.locator('.svc-counter-basket li>div').first().boundingBox())!.width).toBeGreaterThan(160);
 await page.screenshot({path:`${evidence}/services-${width}.png`,fullPage:true});
 await form.getByRole('button',{name:counterCopy.fr.checkout,exact:true}).click();const pay=page.locator('.svc-counter-pay');await pay.getByLabel(counterCopy.fr.paid,{exact:true}).fill('10000');await pay.getByRole('button',{name:counterCopy.fr.pay,exact:true}).click();
 const receipt=page.locator('.wz-checkout-dialog');await expect(receipt).toBeVisible();await expect(receipt).toContainText('15');await expect(receipt.getByRole('heading',{name:'Payé',exact:true})).toHaveCount(0);expect(writes).toBe(1);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(receipt).toBeVisible();await receipt.getByRole('button',{name:/reçu/i}).click();await expect(receipt.locator('.svc-counter-receipt')).toContainText('SCR_test');await fits(page);
 await page.screenshot({path:`${evidence}/services-receipt-${width}.png`,fullPage:true});await page.keyboard.press('Escape');await expect(receipt).toHaveCount(0);await expect(page.locator('.svc-counter-basket')).toHaveCount(0);
 await page.goto('/fr/shida/seller/services?view=templates&tab=quote');await expect(page.locator('.svc-templates')).toContainText('Un modèle ne crée ni facture ni paiement.');await fits(page);await page.screenshot({path:`${evidence}/templates-${width}.png`,fullPage:true});
});
for(const width of [1440,320,360,390,820])test(`Application draft and lost response ${width}`,async({page})=>{
 await localOnly(page);let posted=0,saved=false;
 const profile={name:longName,city:'Kinshasa',communes:['Lemba'],missions:[{category:'childcare',name:'Accompagnement',tasks:['Accompagner les personnes dans leurs déplacements'],experience:'friends',rate:'agree'}],days:['mon'],slots:['afternoon'],frequency:['regular']};
 await page.route('**/api/**',async r=>{const path=new URL(r.request().url()).pathname;
 if(path.includes('/employment/session'))return r.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Applicant'}}});
 if(path.includes('/job-offer')){if(r.request().method()==='POST'){posted++;expect(r.request().postDataJSON().message).toBe('Disponible le samedi matin.');saved=true;return r.abort();}return r.fulfill({json:saved?{application:'APP_test'}:{title:'Accompagnateur pour les déplacements et les rendez-vous dans la ville de Kinshasa',location:'Lemba, Kinshasa',version:'v1',profile}});}
 return r.fulfill({status:404,json:{}});
 });await page.setViewportSize({width,height:900});const path='/fr/shida/space?view=job-offer&kind=apply&offer=JOB_test';await page.goto(path);await expect(page.getByRole('heading',{name:'Votre candidature',exact:true})).toBeVisible();await page.getByLabel('Un mot sur vous',{exact:false}).fill('Disponible le samedi matin.');
 await page.reload();await expect(page.getByLabel('Un mot sur vous',{exact:false})).toHaveValue('Disponible le samedi matin.');await fits(page);await page.screenshot({path:`${evidence}/application-${width}.png`,fullPage:true});
 await page.getByRole('button',{name:'Envoyer ma candidature',exact:true}).dblclick();await expect(page.getByRole('heading',{name:'Candidature envoyée'})).toBeVisible();expect(posted).toBe(1);await expect(page.getByRole('link',{name:/Voir ma candidature/})).toHaveAttribute('href',/APP_test/);
});

for(const locale of ['fr','en','ln','sw'] as const)test(`Translated alerts and enlarged text ${locale}`,async({page})=>{
 await alerts(page);await page.setViewportSize({width:390,height:900});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space?view=job-search&section=alerts`);await expect(page.getByRole('switch').first()).toBeVisible();await page.addStyleTag({content:'html{font-size:200% !important}'});await fits(page);await expect(page.getByRole('switch').first()).toBeVisible();await page.screenshot({path:`${evidence}/alerts-enlarged-${locale}.png`,fullPage:true});
});
test('Application missing profile, closed offer and explicit retry',async({page})=>{
 await localOnly(page);let mode='missing',attempts=0;
 const profile={name:'SERVTEC',city:'Kinshasa',communes:['Lemba'],missions:[],days:[],slots:[],frequency:[]};
 await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname;if(p.includes('/employment/session'))return r.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Test'}}});if(p.includes('/job-offer')){if(r.request().method()==='POST'){attempts++;return mode==='retry'?r.fulfill({status:503,json:{}}):r.fulfill({json:{application:'APP_done'}});}if(mode==='closed')return r.fulfill({status:409,json:{}});return r.fulfill({json:{title:'Mission test',location:'Lemba',version:'1',profile:mode==='missing'?null:profile}});}return r.fulfill({status:404,json:{}});});
 await page.goto('/fr/shida/space?view=job-offer&kind=apply&offer=JOB_states');await expect(page.getByRole('link',{name:'Créer mon profil occasionnel'})).toHaveAttribute('href',/job=JOB_states.*from=mission/);
 mode='retry';await page.reload();await page.getByLabel('Un mot sur vous').fill('Mon message à conserver');await page.getByRole('button',{name:'Envoyer ma candidature'}).click();await expect(page.locator('.mission-application').getByRole('alert')).toBeVisible();await expect(page.getByLabel('Un mot sur vous')).toHaveValue('Mon message à conserver');expect(attempts).toBe(1);
 mode='closed';await page.getByRole('button',{name:'Envoyer ma candidature'}).click();await expect(page.locator('.mission-application').getByRole('alert')).toContainText('Candidatures fermées');await expect(page.getByLabel('Un mot sur vous')).toHaveValue('Mon message à conserver');expect(attempts).toBe(1);
});
for(const width of [320,390,1440])test(`Individual public detail with recorded days ${width}`,async({page})=>{
 await localOnly(page);await page.context().addCookies([{name:'nihiloba_personal_session',value:'isolated-job-test-session',domain:'127.0.0.1',path:'/api/shida',httpOnly:true}]);
 await page.route('**/api/shida/employment/session/**',r=>r.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Applicant'}}}));
 await page.route('**/api/shida/personal/job-offer/**',r=>r.fulfill({json:{title:'Mission',profile:null}}));
 await page.setViewportSize({width,height:900});await page.goto('/fr/shida/emplois/JOB_recurring');await expect(page.locator('.mission-public h1')).toContainText('Assistance au magasin du quartier');await expect(page.locator('.mission-public-facts')).toContainText('Lundi, Mercredi');await expect(page.locator('.mission-public-facts')).toContainText('Régulièrement');await fits(page);await page.screenshot({path:`${evidence}/job-detail-${width}.png`,fullPage:true});
});
for(const width of [320,360,390])test(`Restaurant long menu cards ${width}`,async({page})=>{
 await localOnly(page);const state=await restaurantFixture(page);state.establishment.status='active';await page.addInitScript(()=>localStorage.setItem('shida:restaurant:start:personal/restaurants/RST_fixture','sell'));
 await page.route('**/RST_fixture/counter-baskets**',r=>r.fulfill({json:{items:[],has_more:false,total:0}}));
 await page.route('**/RST_fixture/counter-unpaid**',r=>r.fulfill({json:{items:[],has_more:false,total:0}}));
 await page.route('**/RST_fixture/capabilities**',r=>r.fulfill({json:{capabilities:[{capability:'restaurant.pos',available:true}]}}));
 await page.route('**/RST_fixture/pos/**',r=>r.fulfill({json:{intake_released:true,recent:[],items:[{public_ref:'RMI_long',name:'Poulet braisé aux épices accompagné de légumes et de riz parfumé pour toute la famille',presentation:'fixed_dish',pricing_model:'UNIT_PRICED',unit_price:'12000.00',currency:'CDF',sale_unit_label:'assiette',availability:'available',category:{public_ref:'RMC_food',name:'Plats'},counter_options:{portions:[],extras:[]}}]}}));
 await page.setViewportSize({width,height:900});await page.goto('/fr/shida/seller/restaurants');await page.locator('.rst-grid .rst-card button').first().click();await expect(page.locator('.rst-selling-item-body strong').first()).toContainText('Poulet braisé');await fits(page);await page.screenshot({path:`${evidence}/restaurant-${width}.png`,fullPage:true});
});
