import {authDesignCopy} from '../../app/lib/auth-design-copy';
import {test,expect,type Page} from '@playwright/test';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';
import {publicAccountCopy} from '../../app/lib/public-account-copy';

async function fixture(page:Page){
 const state={loggedIn:false,status:'pending',name:'Synthetic Personal',exchanges:0,starts:0,logoutFailure:false};
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  if(url.origin!==new URL(process.env.UX_TEST_URL||'http://127.0.0.1:3027').origin)return route.abort();
  if(!path.startsWith('/api/'))return route.continue();
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return state.loggedIn?reply({binding:'b'.repeat(64),user:{display_name:state.name}}):reply({},401);
  if(path.endsWith('/employment/logout')){if(state.logoutFailure)return route.abort();state.loggedIn=false;return reply({authenticated:false});}
  if(path==='/api/shida/personal/auth/whatsapp'){state.starts++;return reply({challenge_ref:'DWC_public_'+state.starts,expires_at:new Date(Date.now()+300000).toISOString(),whatsapp_url:'https://wa.me/243000000000?text=synthetic-not-sent'},201);}
  if(path.includes('/personal/auth/whatsapp/DWC_')){
   if(request.method()==='DELETE')return reply({status:'cancelled'});
   if(path.endsWith('/session')){state.exchanges++;if(request.postDataJSON()?.code!=='610294')return reply({error:{code:'invalid_code'}},400);state.loggedIn=true;return reply({authenticated:true});}
   return reply({status:state.status});
  }
  return reply({},401);
 });return state;
}

for(const [locale,width] of [['en',1440],['en',320],['fr',390],['fr',1024]] as const){
 test(`visible public sign-in, WhatsApp code and sign-out ${locale} ${width}`,async({page})=>{
  const state=await fixture(page),t=publicAccountCopy[locale],login=personalLoginCopy[locale];
  await page.setViewportSize({width,height:900});
  const path=`${locale==='en'?'':'/fr'}/shida/services/?category=cleaning&city=Kinshasa`;
  await page.goto(path);const entry=page.getByRole('button',{name:t.signInLabel,exact:true});
  await expect(entry).toBeVisible();expect(state.starts).toBe(0);
  await expect(page.getByRole('heading',{name:'Services'})).toBeVisible();
  await page.screenshot({path:`test-results/auth-evidence/legacy-login-header-${locale}-${width}.png`});
  await entry.click();const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:authDesignCopy[locale].whatsapp,exact:true}).click();await expect(dialog.getByRole('link',{name:login.open})).toBeVisible();
  expect(state.exchanges).toBe(0);state.status='verified';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  const code=dialog.getByLabel(login.codeLabel);await expect(code).toBeVisible();
  await code.fill('000000');await dialog.getByRole('button',{name:authDesignCopy[locale].verify,exact:true}).click();await expect(dialog.getByRole('alert')).toHaveText(login.invalidCode);expect(state.loggedIn).toBe(false);
  await page.screenshot({path:`test-results/auth-evidence/legacy-login-code-${locale}-${width}.png`});await code.fill('610294');
  await dialog.getByRole('button',{name:authDesignCopy[locale].verify,exact:true}).click();await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:`${t.accountLabel} · ${state.name}`,exact:true})).toBeAttached();expect(page.url()).toContain(path);expect(state.exchanges).toBe(2);
  await page.locator('.market-avatar').click();await page.locator('.auth-account-menu').getByRole('button',{name:t.signOut,exact:true}).click();await expect(dialog).not.toBeVisible();await expect(entry).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes('DWC_')||v.includes('610294')||v.includes('Synthetic Personal')))).toBe(false);
 });
}

test('keyboard dismissal keeps public browsing and does not start login',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/');const entry=page.getByRole('button',{name:'Sign in to SHIDA'});await entry.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(entry).toBeFocused();expect(state.starts).toBe(0);
});

for(const locale of ['ln','sw'] as const)test(`localized public account entry ${locale} on mobile`,async({page})=>{
 const state=await fixture(page),t=publicAccountCopy[locale],login=personalLoginCopy[locale];
 await page.setViewportSize({width:320,height:850});await page.goto(`/${locale}/shida/service-bills/`);
 await page.getByRole('button',{name:t.signInLabel,exact:true}).click();const dialog=page.getByRole('dialog');
 await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:authDesignCopy[locale].whatsapp,exact:true}).click();state.status='verified';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(dialog.getByLabel(login.codeLabel)).toBeVisible();expect(state.exchanges).toBe(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('closing a pending login cannot silently authenticate; reopening starts a fresh request',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/services/');await page.getByRole('button',{name:'Sign in to SHIDA'}).click();let dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:authDesignCopy.en.whatsapp,exact:true}).click();await expect(dialog.getByRole('link',{name:personalLoginCopy.en.open})).toBeVisible();
 await page.keyboard.press('Escape');state.status='verified';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));expect(state.exchanges).toBe(0);
 await page.getByRole('button',{name:'Sign in to SHIDA'}).click();dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:authDesignCopy.en.whatsapp,exact:true}).click();
 await expect(dialog.getByLabel(personalLoginCopy.en.codeLabel)).toBeVisible();expect(state.starts).toBe(2);expect(state.exchanges).toBe(0);
});

test('account changes and expired sessions clear the old identity',async({page})=>{
 const state=await fixture(page);state.loggedIn=true;await page.goto('/shida/services/');await page.getByRole('button',{name:'My SHIDA account'}).click();await expect(page.locator('.market-menu').getByText(state.name,{exact:true})).toBeVisible();
 state.name='Another Personal';await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'shida-personal-session-changed',newValue:'changed'})));
 await expect(page.locator('.market-menu')).toHaveCount(0);await page.getByRole('button',{name:'My SHIDA account · Another Personal'}).click();await expect(page.locator('.market-menu').getByText(state.name,{exact:true})).toBeVisible();
 state.loggedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.market-menu')).toHaveCount(0);await page.getByRole('button',{name:'Sign in to SHIDA'}).click();await expect(page.getByRole('dialog').getByRole('button',{name:authDesignCopy.en.whatsapp,exact:true})).toBeVisible();
});

test('failed sign-out does not restore an uncertain account and can be retried',async({page})=>{
 const state=await fixture(page);state.loggedIn=true;state.logoutFailure=true;await page.goto('/shida/services/');await page.getByRole('button',{name:'My SHIDA account'}).click();await page.locator('.market-menu').getByRole('button',{name:'Change account',exact:true}).click();const dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('alert')).toContainText(publicAccountCopy.en.logoutFailed);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(dialog.getByText(state.name)).toHaveCount(0);
 state.logoutFailure=false;await dialog.getByRole('button',{name:publicAccountCopy.en.retry,exact:true}).click();await expect(dialog.getByRole('button',{name:authDesignCopy.en.whatsapp,exact:true})).toBeVisible();expect(state.loggedIn).toBe(false);
});
