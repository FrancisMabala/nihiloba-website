import {test,expect} from '@playwright/test';
import {personalLoginCopy} from '../../app/lib/personal-login-copy';

for(const market of ['wenze','restaurants','services'])for(const locale of ['en','fr','ln','sw'] as const)test(`${market} ${locale}: shared entry, responsive image and existing sign-in`,async({page})=>{
 let starts=0;
 await page.addInitScript(()=>{window.open=()=>null;});
 await page.route('**/api/**',route=>{const req=route.request(),path=new URL(req.url()).pathname.replace(/\/$/,'');if(path.endsWith('/employment/session'))return route.fulfill({status:401,json:{}});if(path.endsWith('/personal/auth/whatsapp')){if(req.method()==='DELETE')return route.fulfill({json:{status:'cancelled'}});starts++;return route.fulfill({status:201,json:{challenge_ref:'DWC_fixture',whatsapp_url:'https://wa.me/243000000000?text=not-sent',expires_at:new Date(Date.now()+300000).toISOString()}});}if(path.endsWith('/DWC_fixture'))return route.fulfill({json:{status:'pending'}});return route.fulfill({status:404,json:{}});});
 await page.setViewportSize({width:1440,height:1000});const prefix=locale==='en'?'':`/${locale}`;await page.goto(`${prefix}/shida/seller/${market}/`);
 await expect(page.locator('.shida-seller-landing')).toBeVisible();await expect(page.locator('.ssl-marketplaces a[aria-current="page"]')).toHaveAttribute('href',`${prefix}/shida/seller/${market}/`);
 await expect.poll(()=>page.locator('.ssl-art img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 if(locale==='en')await page.screenshot({path:`docs/evidence/seller-landing/${market}-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('.ssl-art').evaluate(el=>Math.abs(el.getBoundingClientRect().width-el.parentElement!.getBoundingClientRect().width))).toBeLessThan(4);
 await expect(page.locator('footer')).toHaveCount(0);
 const start=page.getByRole('button',{name:personalLoginCopy[locale].start,exact:true});expect((await start.boundingBox())!.y).toBeLessThan(760);
 if(locale==='en'||locale==='fr')await page.screenshot({path:`docs/evidence/seller-landing/${market}-${locale}-mobile.png`,fullPage:true});
 await start.click();await expect(page.getByRole('link',{name:personalLoginCopy[locale].open})).toHaveAttribute('href','https://wa.me/243000000000?text=not-sent');await expect(page.getByText(personalLoginCopy[locale].help,{exact:true})).toBeVisible();expect(starts).toBe(1);
 await page.getByRole('button',{name:personalLoginCopy[locale].cancel,exact:true}).click();await expect(page.getByText(personalLoginCopy[locale].cancelled,{exact:true})).toBeVisible();
});
