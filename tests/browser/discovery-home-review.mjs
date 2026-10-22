import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.SHIDA_TEST_URL || 'http://127.0.0.1:3042';
const output = 'docs/evidence/discovery-home';
await fs.mkdir(output,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 for(const locale of ['en','fr','ln','sw']) {
  for(const width of [320,390,820,1440]) {
   const page=await browser.newPage({viewport:{width,height:950}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/shida/**',route=>route.fulfill({status:401,json:{}}));
   const path=`${locale==='en'?'':`/${locale}`}/shida/`;
   const response=await page.goto(base+path,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   await page.locator('.discovery-group').first().waitFor();
   assert.equal(await page.locator('html').getAttribute('lang'),locale);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('.discovery-categories>a').count(),7);
   assert.equal(await page.locator('.discovery-illustration').count(),2);
   assert.equal(await page.locator('.discovery-entries img').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${locale} ${width}: overflow`);
   const search=await page.locator('.discovery-search').boundingBox();assert.ok(search.y<400,`${locale} ${width}: search too low`);
   assert.equal(await page.locator('.discovery-search input[name=locale]').inputValue(),locale);
   await page.locator('.market-language').click();assert.equal(await page.locator('.market-disclosure nav button').count(),4);
   await page.keyboard.press('Escape');
   assert.equal(errors.length,0,errors.join('\n'));
   if(width!==320)await page.screenshot({path:`${output}/${locale}-${width}.png`,fullPage:true});
   results.push({locale,width,status:response.status(),overflow:false,groups:await page.locator('.discovery-group').count(),errors});
   await page.close();
  }
 }
 const page=await browser.newPage({viewport:{width:1440,height:950}});
 await page.route('**/api/shida/**',route=>route.fulfill({status:401,json:{}}));
 await page.goto(base+'/fr/shida/');
 await page.locator('select[name=market]').selectOption('services');
 await page.locator('input[name=query]').fill('coiffure');await page.locator('input[name=city]').fill('Kinshasa');
 await page.locator('.discovery-search button').click();await page.waitForURL('**/fr/shida/services/**');
 assert.equal(new URL(page.url()).searchParams.get('query'),'coiffure');assert.equal(new URL(page.url()).searchParams.get('city'),'Kinshasa');
 for(const path of ['/about/shida/','/fr/about/shida/']){const r=await page.goto(base+path);assert.equal(r.status(),200);assert.equal(await page.locator('.shida-story').count(),8);}
 // A synthetic session is confined to this browser test; no production login or mutation.
 await page.unroute('**/api/shida/**');
 await page.route('**/api/shida/**',route=>route.fulfill(route.request().url().includes('/employment/session')?{json:{binding:'b'.repeat(64),user:{display_name:'Discovery Test'}}}:{status:401,json:{}}));
 await page.goto(base+'/shida/');
 const account=page.locator('.market-avatar');await account.waitFor();await account.click();
 assert.ok(await page.locator('.market-menu a[href="/shida/space"]').count());
 assert.equal(await page.locator('.discovery-entries a[href="https://business.nihiloba.com"]').count(),1);
 await page.close();
 await fs.writeFile(`${output}/verification.json`,JSON.stringify(results,null,2));
 console.log(`Passed ${results.length} locale/viewport checks, search handoff, story routes, and guest/Personal account navigation. Business entry preserves the existing separate dashboard session.`);
}finally{await browser.close();}
