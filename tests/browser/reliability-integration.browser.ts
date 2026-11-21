import {test,expect,type Page,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {FORM_DRAFT_KEY} from '../../app/lib/registration/local-draft';
import {registrationResumeCopy} from '../../app/lib/registration/resume-copy';

const web='https://localhost:3046',admin='https://admin.localhost:3048';
const owner='2f654732-a44d-4755-99df-55a111aa50cf',generation='51987dc09ff14327bfc222f9ddff9b14';
function fixtures(){
 const existingPath=process.env.SHIDA_INTEGRATION_EXISTING_PRIVATE,additionPath=process.env.SHIDA_INTEGRATION_ADDITION_PRIVATE;
 if(existingPath!=='C:/NIHILOBA/local-dev/acceptance-runtime/fixture-private.json'||additionPath!=='C:/NIHILOBA/release-evidence/reliability-registration-20261121/real-integration-v1/fixture-private.json')throw Error('Explicit approved private fixture paths required');
 const old=JSON.parse(readFileSync(existingPath,'utf8')),added=JSON.parse(readFileSync(additionPath,'utf8'));
 if([old,added].some(f=>f.owner_uuid!==owner||f.generation!==generation)||!old.admin?.token||!old.personal?.token||!added.registration_draft?.token)throw Error('Owned synthetic fixture metadata mismatch');
 const ownerPath=process.env.SHIDA_INTEGRATION_OWNER_PRIVATE;
 if(ownerPath){
  if(ownerPath!=='C:/NIHILOBA/release-evidence/reliability-registration-20261121/real-integration-v1/owner-fixture-private.json')throw Error('Unexpected owner fixture path');
  const fresh=JSON.parse(readFileSync(ownerPath,'utf8'));
  if(fresh.owner_uuid!==owner||fresh.generation!==generation||fresh.admin?.account_ref!==old.admin.account_ref||!fresh.admin?.token)throw Error('Owner fixture binding mismatch');
  old.admin=fresh.admin;
 }
 return {old,added};
}
async function read(page:Page,path:string){return page.evaluate(async path=>{const response=await fetch(path,{cache:'no-store'});return{status:response.status,cache:response.headers.get('cache-control'),body:await response.json()};},path);}
async function syntheticSession(context:BrowserContext,mode:'admin'|'draft'){
 const f=fixtures(),entry=mode==='admin'?f.old.admin:f.added.registration_draft;
 await context.addCookies([{name:mode==='admin'?'__Host-shida_admin':'nihiloba_personal_session',value:entry.token,domain:mode==='admin'?'admin.localhost':'localhost',path:mode==='admin'?'/':'/api/shida',httpOnly:true,secure:true,sameSite:mode==='admin'?'Strict':'Lax'}]);
}

test('real Website gateway preserves a pending browser-bound registration across reload',async({page,context},info)=>{
 await page.setViewportSize({width:390,height:844});
 await page.addInitScript(key=>{if(!sessionStorage.getItem(key))sessionStorage.setItem(key,JSON.stringify({version:1,expires:Date.now()+86400000,kind:'personal',values:{first_name:'Local',family_name:'Fixture',city:'Goma',country_code:'CD'},phone:'+243910004336',language:'fr'}));},FORM_DRAFT_KEY);
 await page.goto(web+'/fr/shida/register/');
 // Creating the challenge only persists its local binding and returns a deep link.
 // The deep link is deliberately discarded here and never opened or logged.
 const created=await page.evaluate(async()=>{const r=await fetch('/api/shida/personal/auth/whatsapp/registration/',{method:'POST',headers:{'X-Shida-Eligibility':'adult-v1','X-Shida-Language':'fr'}});const b=await r.json();return{status:r.status,reference:b.challenge_ref,expires:b.expires_at};});
 expect(created.status).toBe(201);expect(typeof created.reference==='string').toBe(true);
 const before=(await context.cookies()).find(c=>c.name==='nihiloba_personal_challenge');
 expect(!!before?.httpOnly).toBe(true);expect(before?.path).toBe('/api/shida');
 const first=await read(page,'/api/shida/personal/auth/whatsapp/registration/resume/');
 expect(first.status).toBe(200);expect(first.cache).toContain('no-store');expect(first.body.status).toBe('pending');expect(Object.keys(first.body).sort()).toEqual(['challenge_ref','expires_at','language','status']);
 expect(first.body.expires_at===created.expires).toBe(true);
 await page.reload();await expect(page.getByText(registrationResumeCopy.fr.restored,{exact:true})).toBeVisible();await expect(page.getByText(registrationResumeCopy.fr.pending,{exact:true})).toBeVisible();
 await expect(page.locator('.candidate-login a[href*="wa.me"]')).toHaveCount(0);
 const after=(await context.cookies()).find(c=>c.name==='nihiloba_personal_challenge');expect(after?.value===before?.value).toBe(true);expect(after?.expires===before?.expires).toBe(true);
 expect((await context.cookies()).some(c=>c.name==='nihiloba_personal_session')).toBe(false);
 const storage=await page.evaluate(()=>[...Object.values(sessionStorage),...Object.values(localStorage)].join('|'));expect(storage.includes(created.reference)).toBe(false);
 expect((await read(page,'/api/shida/registration/personal/')).status).toBe(401);
 await page.screenshot({path:info.outputPath('real-pending-mobile.png'),fullPage:true});
 // Same reference/deadline with a different verifier must fail through the real Backend.
 const segments=before!.value.split('.');segments[2]='X'.repeat(43);
 await context.addCookies([{...before!,value:segments.join('.')}]);
 expect((await read(page,'/api/shida/personal/auth/whatsapp/registration/resume/')).status).toBe(404);
 await context.clearCookies({name:'nihiloba_personal_challenge'});
 expect((await read(page,'/api/shida/personal/auth/whatsapp/registration/resume/')).status).toBe(404);
});

test('real canonical draft wins over local content on automatic restoration',async({page,context},info)=>{
 await syntheticSession(context,'draft');await page.setViewportSize({width:390,height:844});
 await page.addInitScript(key=>sessionStorage.setItem(key,JSON.stringify({version:1,expires:Date.now()+86400000,kind:'personal',values:{first_name:'Unverified',family_name:'Local',city:'Paris',country_code:'FR'},phone:'+243910004336',language:'fr'})),FORM_DRAFT_KEY);
 const mutations:string[]=[];page.on('request',r=>{if(r.method()!=='GET'&&r.url().includes('/api/shida/registration/'))mutations.push(r.method());});
 await page.goto(web+'/fr/shida/register/');await expect(page.locator('#registration-first_name')).toHaveValue('Canonical');await expect(page.locator('#registration-family_name')).toHaveValue('Fixture');await expect(page.locator('#registration-city')).toHaveValue('Goma');
 const state=await read(page,'/api/shida/registration/personal/');expect(state.status).toBe(200);expect(state.body.values.first_name).toBe('Canonical');expect(mutations).toEqual([]);
 expect(await page.evaluate(key=>sessionStorage.getItem(key)===null,FORM_DRAFT_KEY)).toBe(true);
 await page.screenshot({path:info.outputPath('real-canonical-draft.png'),fullPage:true});
});

test('real Admin statistics render and accept matching period filters',async({page,context},info)=>{
 await syntheticSession(context,'admin');await page.setViewportSize({width:1440,height:1000});await page.goto(admin+'/');
 const me=await read(page,'/api/admin/me');expect(me.status).toBe(200);expect(me.body.account_ref===fixtures().old.admin.account_ref).toBe(true);
 await expect(page.getByRole('heading',{name:'Audience du site NIHILOBA / SHIDA',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Utilisation de SHIDA par canal',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'7 jours',exact:true}).click();await page.getByLabel('Données affichées').selectOption('all');await page.getByLabel('Fuseau horaire').selectOption('UTC');
 const end=new Date().toISOString().slice(0,10),start=new Date(Date.now()-6*86400000).toISOString().slice(0,10),q=new URLSearchParams({start,end,timezone:'UTC',population:'all'});
 const channels=await read(page,'/api/admin/channel-statistics?'+q),audience=await read(page,'/api/admin/website-statistics?'+q);
 expect(channels.status).toBe(200);expect(channels.cache).toContain('no-store');expect(channels.body.policy).toBe('channel-statistics-v1');
 expect(channels.body.coverage.registered_accounts_only).toBe(true);expect(channels.body.coverage.authentication_excluded).toBe(true);expect(channels.body.registrations.total).toBe(channels.body.registrations.web+channels.body.registrations.whatsapp+channels.body.registrations.unknown);
 expect(audience.status).toBe(200);expect(audience.body.coverage.consenting_only).toBe(true);expect(audience.body.coverage.human_count).toBe(false);expect(audience.body.coverage.population_filter_applied).toBe(false);
 await page.screenshot({path:info.outputPath('real-admin-statistics.png'),fullPage:true});
});

test('real Admin preview rejects named and outside-window accounts without sending',async({page,context})=>{
 await syntheticSession(context,'admin');await page.goto(admin+'/');const f=fixtures();
 for(const [ref,reason] of [[f.old.personal.account_ref,'has_name'],[f.added.registration_draft.account_ref,'outside_service_window']]){
  const result=await page.evaluate(async ref=>{const r=await fetch('/api/admin/users/'+ref+'/registration-reminder/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const b=await r.json();const code=typeof b.detail==='string'?b.detail:b.detail?.code;return{status:r.status,error:['admin_access_denied','admin_reauthentication_required','forbidden','csrf_failed','service_unavailable'].includes(code)?code:'other',eligible:b.eligible,reason:b.reason,hasPreview:b.preview_reference!==null,mode:b.delivery_mode};},ref);
  expect(result.status,result.error).toBe(200);expect(result.eligible).toBe(false);expect(result.reason).toBe(reason);expect(result.hasPreview).toBe(false);expect(result.mode).toBe('service_window_only');
 }
});

test('real unauthenticated Admin aggregate and reminder requests are denied',async({page})=>{
 await page.goto(admin+'/');expect((await read(page,'/api/admin/channel-statistics')).status).toBe(401);expect((await read(page,'/api/admin/website-statistics')).status).toBe(401);
 const status=await page.evaluate(async ref=>(await fetch('/api/admin/users/'+ref+'/registration-reminder/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,fixtures().added.registration_draft.account_ref);expect(status).toBe(401);
});
