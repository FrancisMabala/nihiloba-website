import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {blankTerms} from '../../app/lib/mission-form';
import {missionText} from '../../app/lib/mission-copy';
import {listingText} from '../../app/lib/personal-missions-copy';
import {servicesProviderOffering} from './fixtures/services-provider';

const base='/fr/shida/space/?view=listings', detail=base+'&kind=manage&offer=JOB_test';
const title='Accompagner les enfants après l’école';
async function fixture(page:Page){
 const terms={...blankTerms,category:'childcare',frequency:'regular',weekdays:['mon','tue'],hours:'flexible',rate:'agree'};
 const values={job:title,short_summary:'Accompagner les enfants et préparer leurs activités.\nPréserver les horaires convenus.',work_city:'Kinshasa',commune:'Gombe',quartier:'Centre',mission_terms:JSON.stringify(terms),duration_frequency:'Régulièrement',work_schedule:'Horaires flexibles',budget:'À convenir',optional_experience:'Une année souhaitée'};
 const rows=[{type:'job',reference:'JOB_test',title,status:'open',location:'Kinshasa, Gombe, Centre',count:2},{type:'article',reference:'PRD_test',title:'Lampe de bureau rechargeable avec plusieurs niveaux de luminosité',status:'online',price:'45000',currency:'CDF',location:'Kinshasa, Limete'},{type:'service',reference:'SVC_test',title:'Réparation et entretien des équipements',status:'available',location:'Gombe · Interventions dans les communes voisines',count:0},{type:'job',reference:'PJO_test',title:null,status:'draft'},...Array.from({length:10},(_,i)=>({type:'job',reference:`JOB_${i}`,title:i===0?'TitreSansEspace'.repeat(12):`Mission ${i+1}`,status:i===1?'closed':'open',location:'Kinshasa, Mont-Ngafula, quartier avec un nom particulièrement long',count:i===2?undefined:0}))];
 const state={rows,values,draftValues:{} as Record<string,string>,status:'open',failList:false,empty:false,delay:0,failWrite:false,writes:[] as Record<string,unknown>[]};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  if(path.startsWith('/api/')){
   const send=(json:unknown,status=200)=>route.fulfill({json,status});
   if(path.endsWith('/employment/session'))return send({binding:'a'.repeat(64),user:{display_name:'Synthetic owner'}});
   if(path.endsWith('/notifications/count'))return send({unread_count:0});
   if(path.endsWith('/personal/services'))return send({profiles:[{...servicesProviderOffering,public_ref:'SVC_test',service_name:rows[2].title}]});
   if(path.endsWith('/onboarding'))return send({progress:[],remaining_capacity:3,professional_profile:{public_ref:'SVI_one',revision:1,name:'Provider'}});
   if(path.endsWith('/capabilities'))return send({capabilities:['profile','packages','structured_availability','bills','manual_journal','basic_totals']});
   if(path.endsWith('/reviews'))return send({reviews:[]});
   if(path.includes('/wenze/')){
    if(path.endsWith('/quick-sell'))return send({store:{public_ref:'WS_test',revision:1,name:'Synthetic articles',city:'Kinshasa',commune:'Gombe',quartier:'Centre',address:null,fulfillment_mode:'pickup',delivery_fee_type:'free',delivery_fee:null,delivery_currency:'CDF',delivery_areas:[],order_ready:true}});
    if(path.endsWith('/stores'))return send({stores:[],product_categories:[{code:'home',labels:{fr:'Maison',en:'Home',ln:'Ndako',sw:'Nyumba'}}]});
    if(path.endsWith('/products'))return send({products:[{public_ref:'PRD_test',revision:1,name:rows[1].title,category:'home',condition:'used',description:'Synthetic lamp',price:'45000',currency:'CDF',price_negotiable:'no',visible:'true',status:'active',available_stock:1,committed_quantity:0,photos:[],quick_sell_state:'available'}],next_offset:null});
    if(path.endsWith('/quick-sell-drafts'))return send({drafts:[],next_offset:null});
    if(path.endsWith('/plan'))return send({active_products:1,active_product_limit:10});
   }
   if(path.endsWith('/registration-reference'))return send({kinshasa_communes:['Gombe','Lemba'],quartiers:{Gombe:['Centre','Commerce']}});
   if(path.endsWith('/personal/job-offer')){
    const kind=url.searchParams.get('kind'),model=()=>({...rows[0],status:state.status,values:state.values,version:'1',locations:{kinshasa_communes:['Gombe','Lemba'],quartiers:{Gombe:['Centre','Commerce']}}});
    if(req.method()==='POST'){
     const body=req.postDataJSON();state.writes.push(body);
     if(state.failWrite)return send({},503);
     if(body.action==='preview_edit'||body.action==='preview')return send({...state.values,...body.values});
     if(body.action==='edit'){state.values={...state.values,...body.values};return send(model());}
     if(body.action==='close'){state.status='closed';return send(model());}
     if(body.action==='remove')return send({removed:true});
     if(body.action==='save'){state.draftValues=body.values;return send({public_ref:'PJO_test',state:'active',revision:2,values:body.values});}
     return send({public_ref:'PJO_test',state:'active',revision:1,values:{}});
    }
    if(kind==='catalogue'){if(state.delay)await new Promise(r=>setTimeout(r,state.delay));return send({rows:state.empty?[]:state.rows},state.failList?503:200);}
    if(kind==='manage')return send(model());
    if(kind==='applications'||kind==='candidates')return send({records:[]});
    return send({progress:[{public_ref:'PJO_test',state:'active',revision:1,values:state.draftValues}],capacity:{used:1,limit:3},identity:{name:'Synthetic owner'}});
   }
   return send({});
  }
  if(url.origin!=='http://127.0.0.1:3000'||req.method()!=='GET')return route.abort();
  return route.continue();
 });return state;
}
const list=(p:Page)=>p.locator('.my-listings');
const manager=(p:Page)=>p.locator('.mission-manager');
async function fit(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
async function clearNavigation(page:Page){
 const last=page.locator('.candidate-actions button').last();await last.scrollIntoViewIfNeeded();
 const action=await last.boundingBox(),nav=await page.locator('.shida-navigation').boundingBox();
 expect(action!.y+action!.height).toBeLessThanOrEqual(nav?.y??844);
}
test('same viewport screenshots',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});
 const evidence='C:/NIHILOBA/release-evidence/listings-mobile-20261116';await mkdir(evidence,{recursive:true});const phase=process.env.LISTINGS_BEFORE?'before':'after';
 await page.goto(base);await expect(list(page).locator('article')).toHaveCount(14);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:`${evidence}/${phase}-overview-390.png`});
 await page.goto(detail);await expect(manager(page).getByRole('heading',{name:title})).toBeVisible();await manager(page).getByText('Plus d’actions',{exact:true}).click();await page.screenshot({path:`${evidence}/${phase}-actions-390.png`});
 await page.goto(detail);await manager(page).getByRole('button',{name:'Modifier l’annonce',exact:true}).click();await expect(page.locator('#select-category')).toBeVisible();await page.screenshot({path:`${evidence}/${phase}-edit-390.png`});
});
test('article and service links open their existing management content',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(base);
 await list(page).getByRole('button',{name:'Articles (1)',exact:true}).click();await list(page).locator('article').getByRole('link').click();
 await expect(page.locator('#article-PRD_test')).toContainText('Lampe de bureau');await fit(page);
 await page.locator('#article-PRD_test summary').click();await page.locator('#article-PRD_test').getByRole('button',{name:'Modifier',exact:true}).click();await expect(page.locator('.qs input[name=name]')).toHaveValue(/Lampe de bureau/);await fit(page);
 await page.goBack();await expect(list(page).locator('article')).toHaveCount(1);await expect(list(page).getByRole('button',{name:'Articles (1)'})).toHaveAttribute('aria-pressed','true');
 await list(page).getByRole('button',{name:'Services (1)',exact:true}).click();await list(page).locator('article').getByRole('link').click();
 await expect(page.locator('.svc-editor-heading')).toContainText('Réparation et entretien');await fit(page);
 await page.goBack();await expect(list(page).getByRole('button',{name:'Services (1)'})).toHaveAttribute('aria-pressed','true');await expect(list(page).locator('article')).toHaveCount(1);
});
for(const width of [320,375,390,430,820,1440])test('compact cards, filters, scroll and actions '+width,async({page})=>{
 await fixture(page);await page.setViewportSize({width,height:844});await page.goto(base);await expect(list(page).locator('article')).toHaveCount(14);await fit(page);
 if(width===1440)await page.screenshot({path:'C:/NIHILOBA/release-evidence/listings-mobile-20261116/after-overview-desktop.png'});
 for(const [label,count] of [['Articles',1],['Services',1],['Emplois de particuliers',12],['Toutes',14]] as const){await list(page).getByRole('button',{name:`${label} (${count})`,exact:true}).tap();await expect(list(page).locator('article')).toHaveCount(count);await fit(page);}
 await expect(list(page).getByRole('heading',{name:'Annonce sans titre'})).toBeVisible();await expect(list(page).locator('article').filter({hasText:'Annonce sans titre'})).toContainText('Brouillon');
 await list(page).getByRole('button',{name:'Emplois de particuliers (12)'}).tap();await page.reload();await expect(list(page).locator('article')).toHaveCount(12);
 const target=list(page).locator('article').nth(5).getByRole('link').last();await target.scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>scrollY);await target.click();await expect(manager(page)).toBeVisible();await page.goBack();await expect(list(page).locator('article')).toHaveCount(12);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(scroll-90);
 await page.goto(detail);await manager(page).getByRole('button',{name:'Plus d’actions'}).tap();const sheet=page.getByRole('dialog',{name:'Plus d’actions'});await expect(sheet).toBeVisible();const box=await sheet.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);await page.keyboard.press('Tab');await expect(sheet).toContainText('Supprimer l’annonce');await page.keyboard.press('Escape');await expect(sheet).toHaveCount(0);await expect(manager(page).getByRole('button',{name:'Plus d’actions'})).toBeFocused();await fit(page);
});
test('prefill, picker focus, conditions, review, save and unsaved edits',async({page})=>{
 const state=await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(detail);await manager(page).getByRole('button',{name:'Modifier l’annonce'}).click();
 const type=page.locator('#select-category');await expect(type).toHaveValue(missionText('fr','childcare'));await type.tap();await expect(type).toHaveValue(missionText('fr','childcare'));await page.keyboard.press('Escape');
 const job=page.locator('#mission-job input');await expect(job).toHaveValue(title);await job.fill(title+' — samedi');
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('.mission-progress')).toContainText('Étape 2 sur 3');await expect(page.locator('#mission-frequency button[aria-pressed=true]')).toHaveCount(1);
 await page.getByRole('button',{name:'Précédent',exact:true}).click();await expect(job).toHaveValue(title+' — samedi');await page.locator('#select-quartier').tap();await page.locator('#select-quartier').fill('Commerce');await page.getByRole('option',{name:'Commerce',exact:true}).tap();await expect(page.locator('#select-quartier')).toHaveValue('Commerce');
 await page.getByRole('button',{name:'Continuer',exact:true}).click();await page.getByRole('button',{name:'Vérifier l’annonce',exact:true}).click();await expect(page.locator('.mission-progress')).toContainText('Étape 3 sur 3');await page.locator('.mission-wizard input[type=checkbox]').check();await page.getByRole('button',{name:'Enregistrer les modifications',exact:true}).click();await expect(page.locator('.mission-wizard')).toHaveCount(0);expect(state.writes.filter(x=>x.action==='edit')).toHaveLength(1);expect(JSON.parse(state.values.mission_terms).category).toBe('childcare');expect(state.values.quartier).toBe('Commerce');
 await manager(page).getByRole('button',{name:'Modifier l’annonce'}).click();await job.fill('Changement non enregistré');await page.getByRole('button',{name:'Annuler',exact:true}).click();await expect(page.getByRole('dialog').filter({hasText:'modifications'})).toBeVisible();await page.keyboard.press('Escape');await expect(job).toHaveValue('Changement non enregistré');
});
test('draft cancellation protects entered information and saved drafts resume',async({page})=>{
 const state=await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(base);
 await list(page).locator('article').filter({hasText:'Annonce sans titre'}).getByRole('link').click();
 const job=page.locator('#mission-job input');await job.fill('Mon brouillon conservé');await page.getByRole('button',{name:'Annuler',exact:true}).click();await expect(page.getByRole('dialog').filter({hasText:'modifications'})).toBeVisible();await page.keyboard.press('Escape');await expect(job).toHaveValue('Mon brouillon conservé');
 await page.locator('.mission-wizard button.mission-link').filter({hasText:/Enregistrer/}).click();await expect(page.locator('.mission-wizard')).toHaveCount(0);expect(state.draftValues.job).toBe('Mon brouillon conservé');
 await page.reload();await expect(job).toHaveValue('Mon brouillon conservé');
});
test('missing and legacy types stay explicit; no category is guessed',async({page})=>{
 const state=await fixture(page);state.values.mission_terms='';state.values.job='Un titre personnel ancien';await page.goto(detail);await manager(page).getByRole('button',{name:'Modifier l’annonce'}).click();await expect(page.locator('#select-category')).toHaveValue('');await expect(page.locator('.mission-type-help')).toContainText('Choisissez le type');await page.getByRole('button',{name:'Continuer',exact:true}).click();await expect(page.locator('#mission-category [role=alert]')).toBeVisible();expect(state.writes).toHaveLength(0);
 state.values.mission_terms=JSON.stringify({...blankTerms,category:'legacy_type'});await page.reload();await manager(page).getByRole('button',{name:'Modifier l’annonce'}).click();await expect(page.locator('.mission-type-help')).toContainText('legacy_type');await expect(page.locator('#mission-job input')).toHaveValue('Un titre personnel ancien');await page.getByRole('button',{name:'Continuer',exact:true}).click();expect(state.writes).toHaveLength(0);
});
test('lifecycle confirmations remain separate, errors and closed permissions',async({page})=>{
 const state=await fixture(page);await page.goto(detail);await manager(page).getByRole('button',{name:'Plus d’actions'}).click();await page.getByRole('dialog').getByRole('button',{name:'Clôturer l’annonce'}).click();expect(state.writes).toHaveLength(0);await expect(page.getByRole('dialog')).toContainText('ne recevra plus de candidatures');await page.getByRole('dialog').getByRole('button',{name:'Annuler'}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Supprimer l’annonce'}).click();await expect(page.getByRole('dialog')).toContainText('candidatures déjà reçues seront conservées');state.failWrite=true;await page.getByRole('dialog').getByRole('button',{name:'Supprimer l’annonce'}).click();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();expect(state.writes.at(-1)?.action).toBe('remove');await page.keyboard.press('Escape');
 state.failWrite=false;await manager(page).getByRole('button',{name:'Plus d’actions'}).click();await page.getByRole('dialog').getByRole('button',{name:'Clôturer l’annonce'}).click();await page.getByRole('dialog').getByRole('button',{name:'Clôturer l’annonce'}).click();await expect(manager(page).getByRole('button',{name:'Modifier l’annonce'})).toHaveCount(0);expect(state.writes.at(-1)).toMatchObject({action:'close',confirmed:true,version:'1'});
});
test('loading, retry, empty, counts, draft and supported destinations',async({page})=>{
 const state=await fixture(page);state.delay=500;state.failList=true;await page.goto(base);await expect(page.locator('.space-content [role=status]').last()).toBeVisible();await expect(list(page)).toHaveCount(0);await expect(page.locator('.space-content').getByRole('button',{name:/Réessayer/})).toBeVisible();state.failList=false;await page.locator('.space-content').getByRole('button',{name:/Réessayer/}).click();await expect(list(page).locator('article')).toHaveCount(14);
 const article=list(page).locator('article').filter({hasText:'Lampe de bureau'});await expect(article.getByRole('link')).toHaveAttribute('href',/tab=article&item=PRD_test/);await expect(article).not.toContainText('candidature');
 const service=list(page).locator('article').filter({hasText:'Réparation et entretien'});await expect(service.getByRole('link')).toHaveAttribute('href',/seller\/services\/\?offering=SVC_test/);await expect(service).toContainText('Aucune demande');
 await list(page).locator('article').filter({hasText:'Annonce sans titre'}).getByRole('link').click();await expect(page.locator('.mission-wizard')).toBeVisible();
 state.empty=true;await page.goto(base);await expect(page.locator('#listing-publishing-choices a')).toHaveCount(3);await expect(list(page).locator('article')).toHaveCount(0);
});
for(const locale of ['fr','en','ln','sw'] as const)test('enlarged text and translated controls '+locale,async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:700});const prefix=locale==='en'?'':'/'+locale;await page.goto(prefix+'/shida/space/?view=listings');await expect(list(page).locator('article')).toHaveCount(14);await page.addStyleTag({content:'html{font-size:200%!important}'});await fit(page);await list(page).getByRole('button',{name:new RegExp('^'+listingText(locale,'service'))}).click();await expect(list(page).locator('article')).toHaveCount(1);await fit(page);
 await page.goto(prefix+'/shida/space/?view=listings&offer=JOB_test');await manager(page).getByRole('button',{name:missionText(locale,'editTitle')}).click();await page.addStyleTag({content:'html{font-size:200%!important}'});await fit(page);await clearNavigation(page);
});
