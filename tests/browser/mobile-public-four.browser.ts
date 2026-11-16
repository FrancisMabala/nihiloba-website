import {test,expect} from '@playwright/test';
import type {PublicJob} from '../../app/types/shida-public';
import {candidateWorkspaceCopy} from '../../app/lib/candidate-workspace-copy';

const job={public_ref:'JOB_mobile_fixture',slug:'mobile-fixture',title:'Assistant(e) support informatique et maintenance des systèmes de communication',offer_type:'enterprise',origin:'external',capabilities:[],professional_category:'it_telecommunications',category:'it_telecommunications',vacancies:null,contract_type:'cdi',contract_type_raw:null,seniority:null,work_mode:'onsite',work_mode_raw:null,work_schedule:null,application_deadline:'2027-12-31',employer:{public_ref:'ORG_fixture',slug:null,name:'Délégation de l’Union européenne en République démocratique du Congo',profile_image:null,city:'Kinshasa',area:null,identity_type:'organization_directory'},location:{country_code:'CD',city:'Kinshasa',area:null,commune:null,quartier:null,display:'Kinshasa'},short_summary:'Accompagner les utilisateurs et contribuer au bon fonctionnement des équipements.',summary_preview:null,description_preview:null,compensation:null,salary:null,salary_visibility:'not_provided',published_at:'2026-11-14T09:00:00Z',status:'open',lifecycle_state:'published',public_url:'https://nihiloba.com/fr/shida/emplois/mobile-fixture/',application:{mode:'recruitment_contact',available:true,capability:'candidate_contact',apply_url:null,external_action:null},application_mode:'recruitment_contact',apply_url:null,apply_label:'',deadline_label:null,relationship_capabilities:{can_save:true,save_target_type:'job',save_target_ref:'JOB_mobile_fixture',can_share:true,can_follow_employer:true,follow_target_type:'organization_directory',follow_target_ref:'ORG_fixture'},external_application_action:null,external_verified:false,external_verified_label:null,organization_verified:false,organization_verified_label:null,application_available:true,description:null,description_fallback:null,workplace_reference:null,start_date:null,responsibilities:'Assistance aux utilisateurs.\nMaintenance des équipements.\n'+('Documentation et suivi des interventions.\n'.repeat(12)),qualifications:'Consultez l’annonce d’origine pour connaître les exigences complètes.',experience:{text:null,minimum_years:null,requirement_kind:'unspecified'},education:null,skills:null,personal_qualities:null,languages:null,benefits:null,employment_conditions:null,requirements_document:{available:false,url:null},public_social_link:null,external_source:{explanation:'Publié par l’organisation.',canonical_url:'https://example.org/careers',source_label:'Voir l’annonce d’origine',application_mode:'recruitment_contact',application_instructions:'Indiquez le poste dans l’objet. Joignez votre CV et une lettre de motivation.',email_assisted_available:false}} satisfies PublicJob;
for(const width of [320,375,390,430,768,1440])test(`job detail one application action, email and closed state ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});let closed=false;
 await page.route('**/api/**',route=>{const p=new URL(route.request().url()).pathname;
  if(p.includes('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic reader'}}});
  if(p.includes('/full'))return route.fulfill({json:{item:{...job,...(closed?{lifecycle_state:'expired'}:{})},similar:[]}});
  if(p.includes('/recruitment-contact'))return route.fulfill({json:{email:'apply@example.org',phone:null}});
  if(p.includes('/job-search/jobs/'))return route.fulfill({json:{saved:false,can_save:true,employer:{name:job.employer.name,following:false}}});
  return route.fulfill({status:401,json:{}});
 });
 await page.goto('/fr/shida/emplois/mobile-fixture/');await expect(page.locator('.job-detail-title h1')).toHaveText(job.title);
 await expect(page.locator('.job-detail-identity')).toContainText(job.employer.name);await expect(page.locator('#detail-follow-control')).toContainText('Suivre l’organisation');
 const apply=page.getByRole('button',{name:'Postuler auprès du recruteur',exact:true});await expect(apply).toHaveCount(1);
 if(width<=760){await expect(page.locator('.job-mobile-application')).toHaveClass(/is-fixed/);const nav=await page.locator('.shida-navigation').boundingBox(),box=await apply.boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(nav!.y+1);}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 if(process.env.SHIDA_EVIDENCE)await page.screenshot({path:process.env.SHIDA_EVIDENCE+'/job-'+width+'.png',fullPage:true});
 await page.locator('#job-application').scrollIntoViewIfNeeded();await expect(page.locator('.job-mobile-application')).not.toHaveClass(/is-fixed/);await apply.click();await expect(page.getByRole('link',{name:'Postuler par e-mail',exact:true})).toHaveAttribute('href','mailto:apply@example.org');await expect(page.locator('.job-detail-content')).toContainText('Joignez votre CV');
 closed=true;await page.reload();await expect(page.locator('.job-lifecycle-state')).toBeVisible();await expect(apply).toHaveCount(0);await expect(page.locator('.job-mobile-application')).toHaveCount(0);
});
for(const locale of ['fr','en','ln','sw'] as const)test(`official application and enlarged mobile text ${locale}`,async({page,context})=>{
 await page.setViewportSize({width:320,height:850});
 const prefix=locale==='en'?'':'/'+locale;
 await page.route('**/api/**',route=>{
  const p=new URL(route.request().url()).pathname;
  if(p.includes('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic reader'}}});
  if(p.includes('/full'))return route.fulfill({json:{item:{...job,application:{mode:'external',available:true,capability:'external_redirect',external_action:{mode:'redirect',action:'redirect'},apply_url:null}},similar:[]}});
  if(p.includes('/external-action'))return route.fulfill({json:{mode:'redirect',redirect_url:'https://official.fixture.invalid/careers'}});
  if(p.includes('/job-search/jobs/'))return route.fulfill({json:{saved:false,can_save:true,employer:{name:job.employer.name,following:false}}});
  return route.fulfill({status:401,json:{}});
 });
 await context.route('https://official.fixture.invalid/**',r=>r.fulfill({body:'<h1>Synthetic official application destination</h1>',contentType:'text/html'}));
 await page.goto(prefix+'/shida/emplois/mobile-fixture/');const apply=page.getByRole('button',{name:candidateWorkspaceCopy[locale].official});await expect(apply).toHaveCount(1);
 await page.addStyleTag({content:'html{font-size:125%}'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'job enlarged').toBe(true);
 const popup=page.waitForEvent('popup');await apply.click();const tab=await popup;await expect(tab.getByRole('heading')).toHaveText('Synthetic official application destination');expect(await tab.evaluate(()=>window.opener)).toBeNull();await tab.close();
 await page.goto(prefix+'/shida/services/');await expect(page.locator('.illustrated-marketplace-hero:visible h1')).toBeVisible();await page.addStyleTag({content:'html{font-size:125%}'});const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,nodes:[...document.querySelectorAll('main *')].filter(n=>n.getBoundingClientRect().right>innerWidth+1).map(n=>({class:n.className,right:n.getBoundingClientRect().right,text:n.textContent?.slice(0,50)})).slice(0,25)}));expect(overflow.scroll,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width+1);await expect(page.locator('.marketplace-permanent-slogan:visible')).toHaveAttribute('lang','ln');
});
test('signed-out detail preserves authentication and does not expose protected contact',async({page})=>{
 let full=0;await page.route('**/api/**',route=>{if(route.request().url().includes('/full'))full++;return route.fulfill({status:401,json:{}});});
 await page.setViewportSize({width:375,height:850});await page.goto('/fr/shida/emplois/mobile-fixture/');await expect(page).toHaveURL(/offer=mobile-fixture/);await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('button',{name:'Se connecter',exact:true})).toBeVisible();expect(full).toBe(0);await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
});
test('save and follow render their canonical job-search destinations',async({page})=>{
 let saved=false,following=false;const writes:unknown[]=[];
 await page.setViewportSize({width:390,height:850});
 await page.route('**/api/**',route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace(/\/$/,'');
  const employer={kind:'organization_directory',reference:'ORG_fixture',name:job.employer.name,following};
  if(p.endsWith('/employment/session'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Synthetic reader'}}});
  if(p.endsWith('/full'))return route.fulfill({json:{item:job,similar:[]}});
  if(p.includes('/job-search/jobs/')){if(req.method()==='PUT'){const body=req.postDataJSON();writes.push(body);if(body.action==='save')saved=body.enabled;else following=body.enabled;}return route.fulfill({json:{saved,can_save:true,employer:{...employer,following}}});}
  if(p.endsWith('/personal/candidate'))return route.fulfill({json:{profiles:[],progress:[],metadata:{categories:[],required:{}}}});
  if(p.endsWith('/employment/applications'))return route.fulfill({json:{applications:[]}});
  if(p.endsWith('/alerts'))return route.fulfill({json:{profile_count:0,enabled_count:0}});
  if(p.includes('/job-search/')){const items=p.endsWith('/saved')&&saved?[{relation_ref:'REL_'+'1'.repeat(64),kind:'job',reference:job.public_ref,name:job.title,employer_name:job.employer.name,location:'Kinshasa',available:true,status:'open',origin:'external'}]:p.endsWith('/following')&&following?[{relation_ref:'REL_'+'2'.repeat(64),...employer,available:true,notifications:false,open_job_count:1}]:[];return route.fulfill({json:{items,total:items.length,page:1,has_more:false}});}
  return route.fulfill({status:404,json:{}});
 });
 await page.goto('/fr/shida/emplois/mobile-fixture/');await page.getByRole('button',{name:'Enregistrer dans SHIDA',exact:true}).tap();await expect(page).toHaveURL(/section=saved$/);await expect(page.locator('main').getByText(job.title,{exact:true})).toBeVisible();
 await page.goto('/fr/shida/emplois/mobile-fixture/');await page.getByRole('button',{name:'Suivre l’organisation',exact:true}).tap();await expect(page).toHaveURL(/section=following$/);await expect(page.locator('main').getByText(job.employer.name,{exact:true})).toBeVisible();expect(writes).toEqual([{action:'save',enabled:true},{action:'follow',enabled:true}]);
});
for(const width of [320,375,390,430,768,1440])test(`seven public markets preserve search, slogans and boundaries ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});await page.route('**/api/**',route=>route.fulfill({status:401,json:{}}));
 for(const market of ['wenze','restaurants','services','emplois','appartements','hotels','transport']){
  await page.goto('/fr/shida/'+market+'/');await expect(page.locator('.illustrated-marketplace-hero:visible h1')).toBeVisible();await expect(page.locator('.marketplace-permanent-slogan:visible')).toHaveAttribute('lang','ln');
  if(width<=760)await expect(page.locator('.marketplace-hero-art')).toBeHidden();else await expect(page.locator('.marketplace-hero-art')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),market).toBe(true);
  if(process.env.SHIDA_EVIDENCE&&[320,390,1440].includes(width))await page.screenshot({path:process.env.SHIDA_EVIDENCE+'/market-'+market+'-'+width+'.png',fullPage:true});
  const form=page.locator('.mp-search').first();if(await form.count()){
   await form.locator('input[name=query]').fill('Exemple');await form.locator('input[name=city]').fill('Lubumbashi');await form.locator('.mp-search-primary>button').click();await expect(page.locator('.mp-search input[name=city]')).toHaveValue('Lubumbashi');expect(new URL(page.url()).searchParams.get('query')).toBe('Exemple');
   const filters=page.locator('.mp-search details>summary').first();if(await filters.count()){await filters.click();await expect(page.locator('.mp-search details[open]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
  }else if(market==='transport'){await expect(page.locator('a[href^="https://wa.me/"]').first()).toHaveAttribute('href',/text=/);}
 }
});
