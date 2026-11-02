import {test,expect} from '@playwright/test';

for(const simulateBlur of [false,true])for(const action of ['Sign out','Change account'])test(`${action} ${simulateBlur?'after focus loss':'by direct tap'}`,async({page,isMobile})=>{
 let signedIn=true,logouts=0;
 // Only the local HTTP test server lacks TLS. Keep all other production CSP
 // directives; WebKit otherwise upgrades its script URLs to nonexistent HTTPS.
 await page.route('http://127.0.0.1:3051/shida/space/',async route=>{
  const response=await route.fetch();const headers={...response.headers()};
  headers['content-security-policy']=headers['content-security-policy'].replace('upgrade-insecure-requests','');
  await route.fulfill({response,headers});
 });
 await page.route('**/api/**',route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');
  if(path.endsWith('/employment/session'))return route.fulfill({status:signedIn?200:401,json:signedIn?{binding:'a'.repeat(64),user:{display_name:'Signout Test'}}:{}});
  if(path.endsWith('/employment/logout')){signedIn=false;logouts++;return route.fulfill({json:{authenticated:false}});}
  if(path.endsWith('/notifications/count'))return route.fulfill({json:{unread_count:0}});
  return route.fulfill({json:{items:[],total:0}});
 });
 await page.goto('/shida/space/');
 const avatar=page.getByRole('button',{name:'My SHIDA account · Signout Test',exact:true});
 await avatar.click();
 const menu=page.locator('.auth-account-menu');
 await expect(menu).toBeVisible();
 // Safari may blur the focused close button without focusing the tapped button.
 // Reproduce that focus transition before the click in every engine.
 if(simulateBlur)await menu.getByRole('button',{name:'Close account menu'}).evaluate(el=>(el as HTMLElement).blur());
 await expect(menu).toBeVisible();
 const button=menu.getByRole('button',{name:action,exact:true});
 if(isMobile)await button.tap();else await button.click();
 await expect.poll(()=>logouts).toBe(1);
 await expect(avatar).toHaveCount(0);
 if(action==='Sign out')await expect(page.locator('.shida-account-dialog')).not.toBeVisible();
 else await expect(page.locator('.shida-account-dialog')).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button',{name:'Sign in to SHIDA',exact:true}).first()).toBeVisible();
 await expect(avatar).toHaveCount(0);
});
