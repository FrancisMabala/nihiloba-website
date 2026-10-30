import {test,expect} from '@playwright/test';
for(const width of [390,1440])for(const locale of ['fr','en','ln','sw'])test(`notifications ${locale} ${width}`,async({page})=>{
 let signedIn=true,read=false,ack=false;const actions:string[]=[];
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session'))return signedIn?reply({binding:'a'.repeat(64),user:{display_name:'Test Recipient'}}):reply({},401);
  if(path.includes('/notifications')){
   if(path.endsWith('/count'))return reply({unread_count:read?0:1});
   if(path.endsWith('/actions')){const action=route.request().postDataJSON().action;actions.push(action);if(action==='read')read=true;if(action==='acknowledge')ack=true;return reply({updated:1});}
   if(path.endsWith('/handoff'))return reply({url:'https://wa.me/243899000000?text=SHIDA%20NOTIFICATION%20test'});
   return reply({items:[{reference:'NTF_test',marketplace:'wenze',title:'Test order',description:'A new order awaits your response.',created_at:'2026-10-30T10:00:00Z',read,acknowledged:ack,action_required:true,expired:false,action_url:'https://nihiloba.com/fr/shida/seller/wenze'}],next_cursor:null});
  }
  return reply({},404);
 });
 await page.setViewportSize({width,height:900});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space`);
 await page.locator('.notification-bell').click();const panel=page.locator('.notification-panel');await expect(panel.getByText('Test order')).toBeVisible();
 await expect.poll(()=>actions.includes('view')).toBe(true);expect(actions).not.toContain('read');expect(actions).not.toContain('acknowledge');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await panel.locator('article button').first().click();await expect.poll(()=>read).toBe(true);expect(ack).toBe(false);
 await panel.locator('article button').last().click();await expect(panel.locator('a[href^="https://wa.me/"]')).toBeVisible();expect(ack).toBe(false);
 if(locale==='fr')await page.screenshot({path:`docs/evidence/notifications/center-${width}.png`});
 await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(page.locator('.notification-bell')).toBeFocused();
 signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));await expect(page.locator('.notification-center')).toHaveCount(0);
});
