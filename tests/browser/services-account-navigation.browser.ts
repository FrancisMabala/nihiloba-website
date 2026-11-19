import {test,expect,type Page} from '@playwright/test';
import {publicAccountCopy} from '../../app/lib/public-account-copy';
import {requestWords} from '../../app/lib/services-request-copy';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';

async function fixture(page:Page){
 const state={signedIn:true,binding:'a'.repeat(64),profiles:[] as unknown[],capabilities:['profile'],status:200,writes:0,profileReads:0};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  if(!['127.0.0.1','localhost'].includes(url.hostname))return route.abort();
  if(!path.startsWith('/api/'))return route.continue();
  if(request.method()!=='GET')state.writes++;
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return state.signedIn?reply({binding:state.binding,user:{display_name:'Pilot Customer'}}):reply({},401);
  if(path==='/api/shida/personal/services'){state.profileReads++;return reply({profiles:state.profiles},state.status);}
  if(path.endsWith('/personal/services/capabilities'))return reply({capabilities:state.capabilities},state.status);
  if(path.endsWith('/personal/services/onboarding')&&request.method()==='GET')return reply({progress:[],professional_profile:null,remaining_capacity:5});
  if(path.endsWith('/service-requests/briefs'))return reply({briefs:[],has_more:false});
  if(path.endsWith('/service-requests/postings'))return reply({requests:[],next_ref:null});
  if(path.endsWith('/employment/logout')){state.signedIn=false;return reply({authenticated:false});}
  if(path==='/api/shida/personal/auth/whatsapp')return reply({challenge_ref:'DWC_navigation',expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);
  if(path.endsWith('/DWC_navigation/session')){state.signedIn=true;return reply({authenticated:true});}
  if(path.endsWith('/DWC_navigation'))return reply({status:'verified'});
  return reply({},404);
 });
 return state;
}

for(const status of [403,500,200])test(`unavailable provider discovery is hidden in management (${status})`,async({page})=>{
 const state=await fixture(page);state.status=status;state.profiles=[{}];await page.goto('/shida/space?view=management');
 await expect(page.locator('h1')).toHaveText('Manage my activities');
 await expect.poll(()=>state.profileReads).toBeGreaterThan(0);
 await expect(page.locator('.space-content').getByRole('link',{name:'My services',exact:true})).toHaveCount(0);
 await expect(page.locator('.space-content').getByRole('link',{name:'Offer my services',exact:true})).toHaveCount(0);
 expect(state.writes).toBe(0);
});

test('guest hero preserves new French request through WhatsApp code sign-in',async({page})=>{
 const state=await fixture(page);state.signedIn=false;
 await page.setViewportSize({width:390,height:900});await page.goto('/fr/shida/services');
 await expect(page.getByRole('button',{name:publicAccountCopy.fr.signInLabel})).toHaveText(publicAccountCopy.fr.signIn);
 await expect(page.locator('.market-space')).toHaveCount(0);expect(state.profileReads).toBe(0);
 await page.screenshot({path:'docs/evidence/services-account-navigation/hero-fr-390.png',fullPage:true});
 await page.locator('.mp-hero').getByRole('link',{name:'Décrire mon besoin'}).click();
 await expect(page).toHaveURL(/\/fr\/shida\/service-requests\/?\?new=1$/);
 const t=personalLoginCopy.fr;
 await page.getByRole('button',{name:t.start,exact:true}).click();
 await expect(page.getByRole('link',{name:t.open})).toBeVisible();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.getByLabel(t.codeLabel).fill('610294');await page.getByRole('button',{name:t.verify,exact:true}).click();
 await expect(page.getByRole('region',{name:requestWords('fr').title,exact:true})).toBeVisible();
 await expect(page.locator('input[type=file]')).toHaveCount(0);expect(new URL(page.url()).searchParams.get('new')).toBe('1');
});

for(const locale of ['en','fr','ln','sw'] as const)test(`empty Services setup settles and opens its first-service entry without writes ${locale}`,async({page})=>{
 const state=await fixture(page),consoleErrors:string[]=[],pageErrors:string[]=[];
 page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});
 page.on('pageerror',error=>pageErrors.push(error.message));
 const prefix=locale==='en'?'':`/${locale}`;
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});await page.goto(`${prefix}/shida/seller/services/`);
  await expect(page.locator('.svc-provider-setup')).toBeVisible();
  await expect(page.locator('.svc-setup-start')).toBeEnabled();
  // Observe more than one passive-effect cycle: a visible setup alone concealed
  // the baseline loop, which repeatedly logged errors while retaining its UI.
  await page.waitForTimeout(300);
  expect(consoleErrors.filter(message=>message.includes('Maximum update depth exceeded'))).toEqual([]);
  await page.locator('.svc-setup-start').click();
  await expect(page.locator('.svc-onboarding')).toBeVisible();
  await expect(page.locator('.svc-onboarding')).toHaveAttribute('aria-busy','false');
  await expect(page.locator('.svc-onboarding-main>button')).toBeEnabled();
  expect(state.writes).toBe(0);
  await page.locator('.wz-header-brand').click();await expect(page).toHaveURL(new RegExp(`${prefix}/shida/services/?$`));
  await page.goto(`${prefix}/shida/seller/services/`);await expect(page.locator('.svc-provider-setup')).toBeVisible();
  await page.waitForTimeout(300);
  expect(consoleErrors.filter(message=>message.includes('Maximum update depth exceeded'))).toEqual([]);
  expect(pageErrors).toEqual([]);expect(state.writes).toBe(0);
 }
});
