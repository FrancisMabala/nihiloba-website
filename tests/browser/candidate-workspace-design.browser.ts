import {test,expect as baseExpect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {jobSearchCopy,jobSearchPath} from '../../app/lib/job-search-copy';
import {candidateWorkspaceCopy} from '../../app/lib/candidate-workspace-copy';

const expect=baseExpect.configure({timeout:20000});

test('candidate saves, resumes and selects company alerts in the same account',async({page,context,request})=>{
 test.setTimeout(180000);
 const base='http://127.0.0.1:3047',workspace=(section:string)=>'/fr/shida/space/?view=job-search&section='+section;
 await context.addCookies([{name:'nihiloba_personal_session',value:'activities-acceptance-candidate-session',domain:'127.0.0.1',path:'/'}]);
 await context.route(/\/api\/shida\/(personal|public-jobs)\//,async route=>{
   if(route.request().method()==='GET')return route.continue();
   const response=await route.fetch({headers:{...route.request().headers(),origin:'https://nihiloba.com'}});
   expect(response.ok(),route.request().url()+' '+response.status()).toBeTruthy();await route.fulfill({response});
 });
 await context.route('https://careers.example/**',r=>r.fulfill({contentType:'text/html',body:'<title>Official careers page</title>'}));
 const listings=await (await request.get('http://127.0.0.1:8057/api/public/shida/jobs?query=Technicien&language=fr')).json();
 const job=(title:string)=>listings.items.find((j:{title:string})=>j.title===title).public_ref;
 const first=job('Technicien réseau'),second=job('Technicien énergie');
 const jobPage=(ref:string)=>'/fr/shida/emplois/'+ref+'/';
 // Reset only the disposable candidate's two relationships so reruns exercise the same writes.
 const session=await (await context.request.get(base+'/api/shida/employment/session/')).json();
 const headers={'X-Shida-Session':session.binding,origin:'https://nihiloba.com'};
 for(const ref of [first,second])for(const action of ['save','follow']){
  const result=await context.request.put(base+'/api/shida/personal/job-search/jobs/'+ref+'/?language=fr',{headers,data:{action,enabled:false}});expect(result.ok()).toBeTruthy();
 }
 await page.goto(jobPage(first));
 await page.getByRole('button',{name:jobSearchCopy.fr.save,exact:true}).click();await expect(page).toHaveURL(/section=saved/);
 await expect(page.locator('.workspace-record')).toContainText('Technicien réseau');
 await page.goto(workspace('overview'));
 const saved=page.locator('.search-panel').filter({has:page.getByRole('heading',{name:'Offres enregistrées'})});
 await expect(saved).toContainText(candidateWorkspaceCopy.fr.external);
 await expect(page.locator('.search-counts')).toContainText('0 candidature');
 await saved.getByRole('link',{name:/Voir l’offre/}).click();
 const popupPromise=page.waitForEvent('popup');
 await page.getByRole('button',{name:candidateWorkspaceCopy.fr.official}).click();
 const popup=await popupPromise;await expect(popup).toHaveURL('https://careers.example/apply/42');await popup.close();
 await page.goto(workspace('overview'));await expect(page.locator('.search-counts')).toContainText('0 candidature');
 await expect(page.getByRole('link',{name:/Revoir l’offre enregistrée/})).toHaveAttribute('href',new RegExp(first));
 const draft=page.locator('.search-profile-row').filter({hasText:candidateWorkspaceCopy.fr.individual});
 await expect(draft).toContainText(candidateWorkspaceCopy.fr.draft);const draftUrl=await draft.getAttribute('href');
 expect(new URL(draftUrl!,base).searchParams.get('record')).toMatch(/^\w+_/);
 await draft.click();await expect(page.locator('.occ-wizard')).toBeVisible();
 await expect(page.locator('.occ-wizard')).toContainText('Kinshasa · Lemba et Limete');
 await expect(page.locator('.occ-wizard')).toContainText('Lemba');
 const savedDraft=await (await context.request.get(base+'/api/shida/personal/candidate/?language=fr',{headers})).json();
 const record=savedDraft.progress.find((d:{public_ref:string})=>d.public_ref===new URL(draftUrl!,base).searchParams.get('record'));
 expect(JSON.parse(record.values.occasional_answers).discovery).toBeFalsy();
 for(const ref of [first,second]){
  await page.goto(jobPage(ref));await page.getByRole('button',{name:jobSearchCopy.fr.follow,exact:true}).click();await expect(page).toHaveURL(/section=following/);
 }
 await page.goto(workspace('alerts'));
 const kivu=page.getByRole('switch',{name:/Kivu Réseaux/}),congo=page.getByRole('switch',{name:/Énergie Congo/});
 await expect(kivu).toHaveAttribute('aria-checked','false');await expect(congo).toHaveAttribute('aria-checked','false');
 await kivu.click();await expect(kivu).toHaveAttribute('aria-checked','true');
 const email=page.getByRole('radio',{name:'E-mail',exact:true});
 if(await email.isChecked()){const whatsapp=page.getByRole('radio',{name:'WhatsApp'});await whatsapp.click();await expect(whatsapp).toBeChecked();}
 await email.click();await expect(email).toBeChecked();await page.reload();
 await expect(email).toBeChecked();await expect(kivu).toHaveAttribute('aria-checked','true');await expect(congo).toHaveAttribute('aria-checked','false');
 const evidence=process.env.ACTIVITIES_EVIDENCE_DIR;if(evidence)mkdirSync(evidence,{recursive:true});
 for(const width of [1536,390])for(const section of ['overview','profiles','alerts']){
  await page.setViewportSize({width,height:width===390?844:960});await page.goto(workspace(section));
  const ready=section==='overview'?page.locator('.search-profile-row').last():section==='profiles'?page.getByRole('button',{name:candidateWorkspaceCopy.fr.resume}):kivu;
  await expect(ready).toBeVisible();await expect(page.locator('.search-tabs a')).toHaveCount(6);
  if(section==='overview')await expect(page.locator('.search-counts')).toContainText('2 entreprises suivies');
  await expect(page.locator('button.market-avatar:visible').first()).toBeInViewport();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  if(evidence){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(evidence,section+'-'+width+'.png'),fullPage:true,animations:'disabled'});}
 }
 for(const lang of ['en','ln','sw'] as const){
  await page.goto(jobSearchPath(lang,'profiles'));await expect(page.getByRole('heading',{name:candidateWorkspaceCopy[lang].individual})).toBeVisible();
 }
});
