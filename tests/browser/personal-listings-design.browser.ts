import {test,expect,type BrowserContext} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
const route='/fr/shida/space/?view=listings';
async function signIn(context:BrowserContext,account:string) {
 await context.addCookies([{name:'nihiloba_personal_session',value:'activities-acceptance-'+account+'-session',domain:'127.0.0.1',path:'/'}]);
}
for(const account of ['empty','listings']) for(const width of [1536,390]) test(account+' listings layout '+width,async({page,context})=>{
 await signIn(context,account);await page.setViewportSize({width,height:width===390?844:960});await page.goto(route);
 const list=page.locator('.my-listings');
 if(account==='empty') {
   await expect(list.getByText('Vous n’avez pas encore d’annonce.')).toBeVisible();
   await expect(list.getByRole('link')).toHaveCount(3);await expect(list.getByRole('button')).toHaveCount(0);
 } else {
   await expect(list.locator('article')).toHaveCount(5);
   await expect(list.getByRole('button',{name:'Toutes (5)'})).toBeVisible();
   await expect(list.getByRole('button',{name:'Emplois de particuliers (2)'})).toBeVisible();
 }
 await expect(page.locator('button.market-avatar:visible').first()).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const evidence=process.env.ACTIVITIES_EVIDENCE_DIR;
 if(evidence){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(evidence,account+'-'+width+'.png'),animations:'disabled',fullPage:true});}
 if(account==='listings'){
   await list.getByRole('button',{name:'Articles (1)'}).click();await expect(list.locator('article')).toHaveCount(1);
   await expect(list.getByRole('heading',{name:'Vélo de ville'})).toBeVisible();
   await list.getByRole('button',{name:'Créer une annonce'}).click();await expect(list.locator('#listing-publishing-choices a')).toHaveCount(3);
 }
});
test('previous posting and separate applicant lists',async({page,context})=>{
 await signIn(context,'listings');
 for(const [name,count,applicants] of [['Garde d’enfants',2,['Paul M.','Marie K.']],['Conduite de wewa',1,['Jean B.']]] as const){
   await page.goto(route);const row=page.getByRole('article').filter({has:page.getByRole('heading',{name,exact:true})});
   const manage=row.getByRole('link',{name:'Gérer l’annonce'});
   const ref=new URL(await manage.getAttribute('href')||'',page.url()).searchParams.get('offer');
   await manage.click();await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
   await expect(page.getByRole('button',{name:/Supprimer/})).toBeVisible();await page.goto(route);
   await row.getByRole('link',{name:count===1?'Voir la candidature':'Voir les 2 candidatures'}).click();
   await expect(page.locator('.candidate-profile-panel h4')).toHaveText([...applicants]);
   expect(new URL(page.url()).searchParams.get('offer')).toBe(ref);
 }
});
test('first publishing choices open the forms',async({page,context})=>{
 await signIn(context,'many');
 // Exercise production browser-origin validation against the loopback acceptance host.
 await page.route('http://127.0.0.1:3047/api/shida/**',async r=>{
   if(r.request().method()==='GET')return r.continue();
   const response=await r.fetch({headers:{...r.request().headers(),origin:'https://nihiloba.com'}});
   expect(response.status(),new URL(r.request().url()).pathname).toBeLessThan(400);
   await r.fulfill({response});
 });
 for(const [label,selector] of [['Je cherche quelqu’un','#mission-category'],['Proposer un service','.svc-onboarding-page input'],['Vendre un article','input[name=name]']]){
   await page.goto(route);

   const choices=page.locator('#listing-publishing-choices');
   await expect(page.locator('.my-listings')).toBeVisible();
   if(!await choices.isVisible())await page.locator('.my-listings > header button').click();
   await choices.getByRole('link',{name:label}).click();await expect(page.locator(selector).first()).toBeVisible();
   if(label==='Je cherche quelqu’un')await expect(page.locator('#mission-category')).toContainText('Pour quel travail cherchez-vous quelqu’un ?');
 }
});
test('empty category retains filters and shows its direct action',async({page,context})=>{
 await signIn(context,'overview');await page.goto(route);await page.getByRole('button',{name:'Articles (0)'}).click();
 await expect(page.getByRole('link',{name:'Vendre un article',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Toutes (3)'}).click();
 await expect(page.getByText('Aucune candidature',{exact:true})).toBeVisible();
 await expect(page.getByText('Aucune demande',{exact:true})).toHaveCount(2);
 await expect(page.getByRole('link',{name:/Aucune demande|Aucune candidature/})).toHaveCount(0);
});
test('service requests belong to the selected service',async({page,context})=>{
 await signIn(context,'listings');
 for(const [index,name] of ['Réparation de téléphones','Installation de logiciels'].entries()){
   await page.goto(route);const row=page.getByRole('article').filter({has:page.getByRole('heading',{name,exact:true})});
   const loaded=page.waitForResponse(r=>r.url().includes('offering_ref=SVC_listings'+index)&&r.url().includes('/transactions/requests'));
   await row.getByRole('link',{name:'Voir la demande'}).click();
   const response=await loaded;expect(response.ok()).toBeTruthy();expect((await response.json()).requests.map((v:{request_ref:string})=>v.request_ref)).toEqual(['SWR_listings'+index]);
   await expect(page.locator('.transaction-row.svc-work-row strong')).toHaveText([name]);
 }
});
for(const [locale,label] of [['en','Jobs from individuals'],['ln','Misala oyo bato bapesi'],['sw','Kazi kutoka kwa watu binafsi']])test('listing filters in '+locale,async({page,context})=>{
 await signIn(context,'listings');await page.goto((locale==='en'?'':'/'+locale)+'/shida/space/?view=listings');
 await page.getByRole('button',{name:label+' (2)'}).click();await expect(page.locator('.personal-listing')).toHaveCount(2);
});

test('a failed catalogue read can be retried without showing the welcome state',async({page,context})=>{
 await signIn(context,'listings');
 await page.route('**/job-offer/?kind=catalogue',r=>r.fulfill({status:503,json:{}}),{times:1});
 await page.goto(route);
 const status=page.locator('.space-content [role=status]').filter({has:page.getByRole('button')});
 await expect(status).toBeVisible();
 await expect(page.getByText('Vous n’avez pas encore d’annonce.')).toHaveCount(0);
 await status.getByRole('button').click();
 await expect(page.getByRole('button',{name:'Toutes (5)'})).toBeVisible();
});

test('French employment marketplace keeps both hiring categories',async({page})=>{
 await page.goto('/fr/shida/emplois/');
 await expect(page.getByRole('link',{name:'Offres professionnelles',exact:true})).toBeVisible();
 const personal=page.getByRole('link',{name:'Emplois de particuliers',exact:true});
 await personal.click();await expect(personal).toHaveAttribute('aria-current','page');
 await expect(page.getByRole('link',{name:'Je cherche quelqu’un',exact:true})).toHaveAttribute('href',/view=job-offer&intent=mission/);
});
