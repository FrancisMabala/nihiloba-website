import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
const token='synthetic-private-marketplace-browser-token';
for(const width of [390,1440])test(`private discovery, mode switching and logout at ${width}`,async({page,context})=>{
 await page.setViewportSize({width,height:900});
 await context.addCookies([{name:'nihiloba_personal_session',value:token,domain:'127.0.0.1',path:'/api/shida',httpOnly:true,sameSite:'Lax'}]);
 // Only the local fixture server is contacted. Production same-origin checks
 // still run against the canonical browser Origin.
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://127.0.0.1:3027')return route.abort();
  if(url.pathname==='/api/shida/test-marketplace/'||url.pathname==='/api/shida/employment/logout/'){
   const incoming=await route.request().allHeaders();
   if(route.request().postDataJSON()?.enabled===true){
    expect(incoming['x-shida-session']===createHash('sha256').update('nihiloba-personal-editor:'+token).digest('hex')).toBe(true);
    expect(incoming.cookie?.includes('nihiloba_personal_session='+token)).toBe(true);
   }
   const response=await route.fetch({headers:{...incoming,origin:'https://nihiloba.com','sec-fetch-site':'same-origin'}});
   return route.fulfill({response});
  }
  return route.continue();
 });
 await page.goto('/shida/wenze/');
 await expect(page.getByRole('link',{name:'Ordinary public product',exact:true})).toBeVisible();
 const control=page.locator('.shida-test-marketplace-control');
 await control.locator('summary').click();
 const activated=page.waitForResponse(response=>response.url().endsWith('/api/shida/test-marketplace/'));
 await control.getByRole('button',{name:'Open test marketplace',exact:true}).click();
 const activationResponse=await activated;
 expect(activationResponse.status()).toBe(200);
 expect(activationResponse.headers()['vary']).toContain('Cookie');
 await expect(page.getByRole('link',{name:'Private rehearsal product',exact:true})).toBeVisible();
 await expect(page.getByText('Ordinary public product',{exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const response=await page.reload();
 expect(response?.headers()['cache-control']).toContain('private');
 expect(response?.headers()['cache-control']).toContain('no-store');
 expect(response?.headers()['x-robots-tag']).toContain('noindex');
 expect(response?.headers()['referrer-policy']).toBe('no-referrer');
 // Next owns the HTML RSC Vary header. Privacy relies on explicit no-store,
 // not cache-key partitioning. The private JSON gateway still varies on Cookie.
 const cookies=await context.cookies();expect(cookies.find(c=>c.name==='nihiloba_test_marketplace_session')?.httpOnly).toBe(true);
 expect(await page.evaluate(()=>document.cookie)).not.toContain(token);
 const anonymous=await context.browser()!.newContext({baseURL:'http://127.0.0.1:3027'});const outsider=await anonymous.newPage();
 await outsider.goto('/shida/wenze/');await expect(outsider.getByRole('link',{name:'Ordinary public product',exact:true})).toBeVisible();
 await expect(outsider.getByText('Private rehearsal product',{exact:true})).toHaveCount(0);await anonymous.close();
 await control.locator('summary').click();
 const panel=await control.locator('.shida-test-marketplace-panel').boundingBox();
 expect(panel&&panel.x>=0&&panel.x+panel.width<=width).toBeTruthy();
 await page.screenshot({path:test.info().outputPath(`private-marketplace-${width}.png`)});
 await control.getByRole('button',{name:'Return to public marketplace',exact:true}).click();
 await expect(page.getByRole('link',{name:'Ordinary public product',exact:true})).toBeVisible();
 expect((await context.cookies()).some(c=>c.name==='nihiloba_test_marketplace_session')).toBe(false);
 await control.locator('summary').click();await control.getByRole('button',{name:'Open test marketplace',exact:true}).click();
 await expect(page.getByRole('link',{name:'Private rehearsal product',exact:true})).toBeVisible();
 // A shared-browser logout event must discard the private server-rendered page.
 await context.clearCookies({name:/nihiloba_(personal_session|test_marketplace_session|test_marketplace_mode)/});
 await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
 await expect(page.getByRole('link',{name:'Ordinary public product',exact:true})).toBeVisible();
 await expect(page.getByText('Private rehearsal product',{exact:true})).toHaveCount(0);
});
