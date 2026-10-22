import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.SHIDA_TEST_URL||'http://127.0.0.1:3044';
const output=process.env.SHIDA_EVIDENCE_DIR||'docs/evidence/phase2';
const markets=['wenze','restaurants','services','emplois','appartements','hotels','transport'];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[];const details=[];
try{
 for(const locale of ['en','fr','ln','sw'])for(const width of [390,820,1440]){
  const page=await browser.newPage({viewport:{width,height:960}});
  for(const market of markets){
   const path=`${locale==='en'?'':`/${locale}`}/shida/${market}/`;
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200,path);
   await expect(page.locator('h1')).toHaveCount(1);await expect(page.locator('.mp-discovery-header')).toHaveCount(1);
   assert.equal(await page.locator('.marketplace-public .mp-art').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${path} ${width}`);
   const primary=market==='transport'?page.locator('.transport-request .button'):page.locator('.marketplace-public form').first();
   await expect(primary).toBeVisible();const box=await primary.boundingBox();assert.ok(box.y<640,`primary action too low ${path} ${width}: ${box.y}`);
   if(locale==='fr'&&width!==820){await page.locator('.marketplace-public img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode().catch(()=>{});})));await page.screenshot({path:`${output}/${market}-${width}.png`,fullPage:true});}
   checks.push({path,width,status:200,primaryY:Math.round(box.y),noOverflow:true});
   if(locale==='en'&&width===1440&&market!=='transport'){
    const selector=market==='emplois'?'.job-result h3 a':market==='restaurants'?'.rd-card h3 a':'.marketplace-card h2 a';
    const link=page.locator(selector).first();if(await link.count()){
     const href=await link.getAttribute('href');const target=new URL(href,base);const response=await page.goto(base+target.pathname+target.search,{waitUntil:'domcontentloaded'});
     assert.equal(response.status(),200,`detail ${target.pathname}`);await expect(page.locator('h1')).toHaveCount(1);details.push({market,path:target.pathname,status:200});
    }else details.push({market,skipped:'No published listings'});
   }

  }
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:960}});
 for(const market of markets.filter(x=>x!=='transport')){
  await page.goto(`${base}/shida/${market}/`,{waitUntil:'domcontentloaded'});
  const form=page.locator('.marketplace-public form').first();await form.locator('input[name=query]').fill('phase2-no-match-xyz');
  await Promise.all([page.waitForURL(/query=phase2-no-match-xyz/),form.locator('button[type=submit],button:not([type])').first().click()]);
  await expect(page.locator('input[name=query]').first()).toHaveValue('phase2-no-match-xyz');
  assert.equal(await page.locator('.marketplace-public .mp-art').count(),0);
 }
 await page.goto(`${base}/shida/wenze/?view=shops`);await expect(page.locator('input[name=view]')).toHaveValue('shops');
 await page.goto(`${base}/shida/hotels/?city=Goma&area=Centre&rooms=2&rental_period=night`);await expect(page.locator('input[name=rooms]')).toHaveValue('2');await expect(page.locator('select[name=rental_period]')).toHaveValue('night');
 await page.close();
 await fs.writeFile(`${output}/verification.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),checks,details,searchSubmissions:6},null,2));
 console.log(`Verified ${checks.length} localized responsive marketplace views, six search submissions, shop view and hotel filters at ${base}`);
}finally{await browser.close();}
