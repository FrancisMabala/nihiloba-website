import {test,expect,type Page} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {mobileJob} from '../fixtures/emploi-mobile.mjs';

const path='/fr/shida/emplois/JOB_EBML2CXL/';
const evidence='C:/NIHILOBA/release-evidence/public-individual-20261116';
async function fixture(page:Page){
 const item={...mobileJob(),public_ref:'JOB_EBML2CXL',slug:'JOB_EBML2CXL',title:'Aide ménagère',origin:'direct',offer_type:'individual',employer:{name:'Employeur particulier',public_ref:null,identity_type:'individual',profile_image:null},location:{city:'Kinshasa',commune:'Limete',quartier:'Limete 13eme',display:'Kinshasa, Limete, Limete 13eme'},compensation:'180 USD/mois',salary:null,start_date:'2026-09-30',application_deadline:null,work_schedule:'Lundi au samedi, 08h00-17h00',short_summary:'Entretien du logement et accompagnement dans les tâches quotidiennes.',responsibilities:'Préparer les repas et entretenir les espaces communs.',qualifications:'Ponctualité et respect des consignes.',external_source:null,application:{available:false,capability:'none',mode:'shida',apply_url:null,external_action:null},report_url:'https://wa.me/243000000000?text=SHIDA%20JOB%20REPORT%20JOB_EBML2CXL%20fr',relationship_capabilities:{can_save:true,can_share:true,can_follow_employer:false,save_target_type:'job',save_target_ref:'JOB_EBML2CXL'}};
 const state={item,session:200,full:200,applyStatus:404,apply:{code:'mission_unavailable'} as Record<string,unknown>,delay:0,saved:false,applyCalls:0};
 await page.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace(/\/$/,'');
  if(p.startsWith('/api/')){
   const reply=(json:unknown,status=200)=>route.fulfill({json,status});
   if(p.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Synthetic reader'}},state.session);
   if(p.endsWith('/full'))return reply({item:state.item,similar:[]},state.full);
   if(p.endsWith('/personal/job-offer')){state.applyCalls++;if(state.delay)await new Promise(r=>setTimeout(r,state.delay));return reply(state.apply,state.applyStatus);}
   if(p.includes('/job-search/jobs/')){if(req.method()==='PUT')state.saved=req.postDataJSON().enabled;return reply({saved:state.saved,can_save:true,employer:null});}
   if(p.endsWith('/saved'))return reply({items:state.saved?[{relation_ref:'REL_'+ '1'.repeat(64),kind:'job',reference:item.public_ref,name:item.title,available:true,status:'open'}]:[],total:state.saved?1:0,page:1,has_more:false});
   if(p.endsWith('/notifications/count'))return reply({unread_count:0});
   return reply({},404);
  }
  if(url.origin!=='http://127.0.0.1:3000'||req.method()!=='GET')return route.abort();return route.continue();
 });return state;
}
test('same route same viewport evidence',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto(path);await expect(page.locator('.mission-public h1')).toHaveText('Aide ménagère');await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await mkdir(evidence,{recursive:true});await page.screenshot({path:`${evidence}/${process.env.PUBLIC_INDIVIDUAL_BEFORE?'before':'after'}-390.png`});
});

function enable(state:Awaited<ReturnType<typeof fixture>>){state.item.application.available=true;state.item.application.capability='shida_application';state.applyStatus=200;state.apply={profile:{name:'Synthetic candidate'},title:state.item.title,location:'Kinshasa'};}

for(const width of [375,390,430,1440])test(`public offer content and clearance at ${width}`,async({page})=>{
 const state=await fixture(page);enable(state);await page.setViewportSize({width,height:844});await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','open');
 await expect(page.getByRole('link',{name:'Postuler à cette mission'})).toHaveCount(1);
 await expect(page.locator('.mission-public-facts')).toContainText('180 USD/mois');
 await expect(page.locator('.mission-public-facts')).toContainText('30 sept. 2026');
 await expect(page.locator('.mission-card')).toContainText('Préparer les repas');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.mission-public .mission-actions').scrollIntoViewIfNeeded();
 const clear=await page.locator('.mission-public .mission-actions').evaluate((el,mobile)=>el.getBoundingClientRect().bottom<=innerHeight-(mobile?70:0),width<700);expect(clear).toBe(true);
 await page.screenshot({path:`${evidence}/content-${width}.png`,fullPage:true});
});

test('loading, request failure and retry are not permanent unavailability',async({page})=>{
 const state=await fixture(page);enable(state);state.delay=1200;state.applyStatus=503;state.apply={};await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','loading');
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','error');
 await expect(page.locator('.mission-eligibility').getByRole('alert')).toHaveText('Impossible de vérifier les candidatures.');
 enable(state);state.delay=0;await page.getByRole('button',{name:'Réessayer',exact:true}).tap();
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','open');
 expect(state.applyCalls).toBe(2);
});

for(const [code,expected,label] of [
 ['mission_self_application','owner','Gérer mon annonce'],
 ['mission_application_closed','closed','Voir les offres disponibles'],
 ['mission_application_expired','expired','Voir les offres disponibles'],
 ['mission_application_disabled','disabled','Voir les offres disponibles'],
 ['mission_closed','error','Réessayer'],
] as const)test(`account eligibility ${expected}: ${code}`,async({page})=>{
 const state=await fixture(page);enable(state);state.applyStatus=409;state.apply={code};await page.setViewportSize({width:390,height:844});await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state',expected);
 await expect(page.locator('.mission-eligibility').getByRole(expected==='error'?'button':'link',{name:label,exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Postuler à cette mission'})).toHaveCount(0);
 if(expected==='owner')await expect(page.getByRole('link',{name:label})).toHaveAttribute('href',/view=listings&kind=manage&offer=JOB_EBML2CXL/);
});

test('profile requirement and existing application use canonical destinations',async({page})=>{
 const state=await fixture(page);enable(state);state.apply={profile:null,title:state.item.title,location:'Kinshasa'};await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','profile');
 await page.getByRole('link',{name:'Compléter mon profil',exact:true}).tap();
 await expect(page).toHaveURL(/view=job-offer&kind=apply&offer=JOB_EBML2CXL/,{timeout:30000});
 await expect(page.locator('.mission-application')).toContainText('Un profil occasionnel est nécessaire');
 await page.goBack();await expect(page.locator('.mission-public h1')).toHaveText('Aide ménagère');
 state.apply={application:'APP_synthetic'};await page.reload();
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','applied');
 await expect(page.getByRole('link',{name:'Voir ma candidature'})).toHaveAttribute('href',/APP_synthetic/);
});

test('authentication expiry is distinct from listing closure',async({page})=>{
 const state=await fixture(page);enable(state);state.applyStatus=401;state.apply={};await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','signin');
 await expect(page.getByRole('link',{name:'Se connecter',exact:true})).toHaveAttribute('href',/kind=apply&offer=JOB_EBML2CXL/);
});

test('unavailable capability cannot be revived by a profile response',async({page})=>{
 const state=await fixture(page);state.applyStatus=200;state.apply={profile:{name:'Synthetic candidate'}};await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','disabled');
 await expect(page.getByRole('link',{name:'Postuler à cette mission'})).toHaveCount(0);
});

test('unknown listing access offers recovery without implying closure',async({page})=>{
 const state=await fixture(page);enable(state);state.applyStatus=404;state.apply={};await page.goto(path);
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','unavailable');
 await expect(page.locator('.mission-eligibility').getByRole('button',{name:'Réessayer'})).toBeVisible();
});

test('public detail request failure offers retry',async({page})=>{
 const state=await fixture(page);state.full=503;await page.goto(path);await expect(page.locator('main').getByRole('alert')).toBeVisible();
 await expect(page.locator('.mission-public')).toHaveCount(0);state.full=200;
 await page.getByRole('button',{name:/Réessayer/}).tap();await expect(page.locator('.mission-public h1')).toHaveText('Aide ménagère');
});

test('save, share and filtered back navigation remain available',async({page})=>{
 await fixture(page);await page.addInitScript(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async(data:ShareData)=>{(window as unknown as {shared:string}).shared=data.url||'';}});
  sessionStorage.setItem('shida-job-results-return',JSON.stringify({list:'/fr/shida/emplois/?query=Aide&view=individual',detail:'/fr/shida/emplois/JOB_EBML2CXL/',scroll:120,at:Date.now()}));
 });await page.goto(path);
 const save=page.getByRole('button',{name:'Enregistrer dans SHIDA',exact:true});await expect(save).toBeEnabled();await save.tap();await expect(page).toHaveURL(/view=job-search&section=saved/,{timeout:30000});
 await page.goBack();await expect(page.locator('.mission-public .job-relationship-actions button[aria-pressed=true]')).toBeVisible();
 await page.getByRole('button',{name:'Partager',exact:true}).tap();await expect(page.getByRole('button',{name:'Lien copié',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as unknown as {shared:string}).shared)).toContain('/fr/shida/emplois/JOB_EBML2CXL');
 const back=page.getByRole('link',{name:'← Toutes les offres',exact:true});await expect(back).toHaveAttribute('href','/fr/shida/emplois/?query=Aide&view=individual');await back.tap();await expect(page).toHaveURL(/query=Aide&view=individual/);
});

for(const locale of ['fr','en','ln','sw'])test(`long content and enlarged text ${locale}`,async({page})=>{
 const state=await fixture(page);enable(state);state.item.title='Accompagnement et aide ménagère pour les familles de Kinshasa '+ 'LongueRéférence'.repeat(8);state.item.work_schedule='Lundi au samedi, matin et après-midi selon les rendez-vous convenus avec la famille.';
 await page.setViewportSize({width:375,height:844});await page.goto((locale==='en'?'':'/'+locale)+'/shida/emplois/JOB_EBML2CXL/');
 await expect(page.locator('.mission-eligibility')).toHaveAttribute('data-state','open');
 await page.addStyleTag({content:'html{font-size:200%!important}'});
 await expect(page.locator('.mission-public h1')).toHaveText(state.item.title);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('.mission-public .mission-actions').scrollIntoViewIfNeeded();
 await page.screenshot({path:`${evidence}/enlarged-${locale}-375.png`,fullPage:true});
});
