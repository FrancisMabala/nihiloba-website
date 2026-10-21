import {test,expect,type Page} from '@playwright/test';
import {servicesAccountCopy} from '../../app/lib/services-account-navigation';
import {marketplaceAccountCopy} from '../../app/components/shida/marketplace-account-copy';
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

for(const [locale,width] of [['fr',390],['en',1440],['ln',320],['sw',820]] as const){
 test(`customer and provider account navigation ${locale} ${width}`,async({page})=>{
  const state=await fixture(page),t=servicesAccountCopy[locale],a=marketplaceAccountCopy[locale],prefix=locale==='en'?'':`/${locale}`;
  await page.setViewportSize({width,height:900});await page.goto(`${prefix}/shida/services`);
  await expect(page.locator('.svc-public-topline')).not.toContainText(t.requests);
  await expect(page.locator('.mp-hero').getByRole('link',{name:t.describe})).toHaveAttribute('href',`${prefix}/shida/service-requests/?new=1`);
  const account=page.getByRole('button',{name:`${a.account} · Pilot Customer`,exact:true}),menu=page.locator('.market-menu');
  await account.click();await expect(menu.getByRole('link',{name:t.requests,exact:true})).toHaveAttribute('href',`${prefix}/shida/service-requests`);
  await expect(menu.getByRole('link',{name:t.bills,exact:true})).toHaveAttribute('href',`${prefix}/shida/service-bills`);
  await expect(menu.getByRole('link',{name:t.offer,exact:true})).toBeVisible();await expect(menu.getByRole('link',{name:t.provider,exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(account).toBeFocused();
  await page.locator('.market-space').click();await expect(page.locator('#activity').getByRole('link',{name:t.bills})).toBeVisible();
  await expect(page.locator('.account-space').getByRole('link',{name:t.offer,exact:true})).toBeVisible();
  state.profiles=[{public_ref:'SVC_owned'}];await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.account-space').getByRole('link',{name:t.provider,exact:true})).toBeVisible();
  await expect(page.locator('.account-space').getByRole('link',{name:t.offer,exact:true})).toHaveCount(0);
  await account.click();await expect(menu.getByRole('link',{name:t.provider,exact:true})).toBeVisible();
  await page.screenshot({path:`docs/evidence/services-account-navigation/account-${locale}-${width}.png`});
  state.status=403;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('link',{name:t.provider,exact:true})).toHaveCount(0);
  await expect(page.getByRole('link',{name:t.offer,exact:true})).toHaveCount(0);
  expect(state.writes).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}

for(const status of [403,500,200])test(`failed or malformed discovery never becomes provider setup (${status})`,async({page})=>{
 const state=await fixture(page);state.status=status;state.profiles=[{}];
 await page.goto('/shida/space');await expect.poll(()=>state.profileReads).toBeGreaterThan(0);
 await page.getByRole('button',{name:'My SHIDA account · Pilot Customer'}).click();
 await expect(page.getByRole('link',{name:'My provider area',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Offer my services',exact:true})).toHaveCount(0);
 await expect(page.locator('#activity').getByRole('link',{name:'Received bills'})).toBeVisible();
});

test('account switch and logout remove provider links even when names match',async({page})=>{
 const state=await fixture(page);state.profiles=[{public_ref:'SVC_owned'}];
 await page.goto('/shida/space');await expect(page.locator('.account-space').getByRole('link',{name:'My provider area'})).toBeVisible();
 state.binding='b'.repeat(64);state.profiles=[];
 await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
 await expect(page.getByRole('link',{name:'My provider area'})).toHaveCount(0);
 await expect(page.locator('.account-space').getByRole('link',{name:'Offer my services'})).toBeVisible();
 await page.getByRole('button',{name:'My SHIDA account · Pilot Customer'}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page.getByRole('button',{name:'Sign in to SHIDA'})).toBeVisible();await expect(page.getByRole('link',{name:'Offer my services'})).toHaveCount(0);
});

test('a delayed provider response cannot restore the previous account link',async({page})=>{
 const state=await fixture(page);let release!:()=>void,started=false;
 const held=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/shida/personal/services',async route=>{
  if(!started){started=true;await held;await route.fulfill({json:{profiles:[{public_ref:'SVC_previous'}]}}).catch(()=>{});}
  else await route.fulfill({json:{profiles:[]}});
 });
 await page.goto('/shida/services');await expect.poll(()=>started).toBe(true);
 state.binding='b'.repeat(64);await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
 await page.getByRole('button',{name:'My SHIDA account · Pilot Customer'}).click();
 await expect(page.locator('.market-menu').getByRole('link',{name:'Offer my services'})).toBeVisible();
 release();await expect(page.getByRole('link',{name:'My provider area'})).toHaveCount(0);
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'My SHIDA account · Pilot Customer'}).click();
 await expect(page.locator('.market-menu').getByRole('link',{name:'Offer my services'})).toBeVisible();
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
