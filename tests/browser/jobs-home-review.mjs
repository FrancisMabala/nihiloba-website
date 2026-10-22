import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.SHIDA_TEST_URL||'http://127.0.0.1:3043';
const output=process.env.SHIDA_EVIDENCE_DIR||'docs/evidence/jobs-contract';
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
try{
 for(const locale of ['en','fr','ln','sw']){
  const api=await fetch(`https://api.nihiloba.com/api/public/shida/jobs?page_size=50&language=${locale==='en'?'en':'fr'}`);assert.equal(api.status,200);const data=await api.json();
  const jobs=new Map(data.items.map(item=>[item.slug||item.public_ref,item]));
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:950}});
   const path=`${locale==='en'?'':`/${locale}`}/shida/`;const r=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(r.status(),200);
   assert.equal(await page.locator('.discovery-categories>a').count(),7);
   const cards=page.locator('.discovery-job');await cards.first().waitFor({state:'visible'});await expect(cards).toHaveCount(Math.min(3,jobs.size));
   for(const card of await cards.all()){const link=card.locator('h4 a');const href=await link.getAttribute('href');const key=decodeURIComponent(href.split('/').filter(Boolean).at(-1));assert.ok(jobs.has(key),'Homepage link must identify a real published API job');assert.equal(await link.innerText(),jobs.get(key).title);}
   assert.equal(await page.locator('.discovery-group').first().locator('.discovery-state').count(),0);
   assert.equal(await page.locator('a[href*="employeurs/null"]').count(),0);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   assert.equal(await page.locator('.discovery-illustration').count(),2);
   if(locale==='fr')await page.screenshot({path:`${output}/fr-${width}.png`,fullPage:true});
   checks.push({path,width,status:r.status(),publicJobCards:await cards.count(),matchesPublicApi:true,overflow:false});
   if(locale==='en'&&width===1440){const href=await cards.first().locator('h4 a').getAttribute('href');const detail=await page.goto(base+href);assert.equal(detail.status(),200);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('a[href*="employeurs/null"]').count(),0);}
   await page.close();
  }
 }
 const sitemap=await fetch(base+'/sitemap.xml');const xml=await sitemap.text();assert.equal(sitemap.status,200);assert.ok(!xml.includes('/employeurs/null'));assert.ok(xml.includes('/shida/emplois/JOB_'));
 await fs.writeFile(`${output}/verification.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),checks,sitemapHasNoAnonymousEmployerUrls:true},null,2));
 console.log(`Verified ${checks.length} homepage views with real public API job matches, detail navigation, SVG entries and sitemap safety at ${base}.`);
}finally{await browser.close();}
