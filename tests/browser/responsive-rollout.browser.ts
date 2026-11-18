import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {setup} from './management-layout-fixture';
import {workPilotFixture} from './fixtures/services-work-pilot';
import {restaurantFixture} from './responsive-rollout-fixtures';
const evidence=process.env.ROLLOUT_EVIDENCE??process.env.ROLLOUT_OUTPUT!;
const baseline=!!process.env.ROLLOUT_BASELINE;
async function fits(page:Page){const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(el=>el.scrollWidth>el.clientWidth+1&&el.getBoundingClientRect().height>0).slice(0,20).map(el=>({tag:el.tagName,cls:el.className,width:el.clientWidth,scroll:el.scrollWidth,text:el.textContent?.slice(0,60)}))}));expect(layout.scroll,JSON.stringify(layout)).toBeLessThanOrEqual(layout.width+1);}
for(const marketplace of ['services','wenze','restaurants'] as const)for(const locale of ['fr','en','ln','sw'] as const)test(`${marketplace} contract ${locale}`,async({page})=>{
 mkdirSync(evidence,{recursive:true});await page.clock.install({time:new Date('2026-11-18T10:00:00Z')});
 const prefix=locale==='en'?'':`/${locale}`;
 let url=`${prefix}/shida/seller/${marketplace}?view=${marketplace==='services'?'overview':'today'}`;
 if(marketplace==='services')await workPilotFixture(page);
 if(marketplace==='wenze'){const f=await setup(page,'active',locale,'Boutique de la Délégation de l’Union européenne en République démocratique du Congo');url=f.url+'&view=today';}
 if(marketplace==='restaurants')await restaurantFixture(page);
 for(const width of baseline?[390,1440]:[320,390,767,768,820,1023,1024,1440]){
  await page.setViewportSize({width,height:900});await page.goto(url);
  const nav=page.locator('.management-mobile-nav');await expect(nav).toHaveCount(1);
  await expect(page.locator(marketplace==='services'?'.svc-daily-kpi':marketplace==='wenze'?'.wt-metric':'.rst-ops-metrics article').first()).toBeVisible();
  if(locale==='fr'&&[390,1440].includes(width)){await page.screenshot({path:join(evidence,`${baseline?'before':'after'}-${marketplace}-${width}.png`),animations:'disabled'});
   writeFileSync(join(evidence,`${baseline?'before':'after'}-${marketplace}-${width}-fonts.json`),JSON.stringify(await page.locator('body,.shida-summary-card,.management-mobile-nav').evaluateAll(elements=>elements.map(el=>{const style=getComputedStyle(el);return {selector:el.className,font:style.fontFamily,size:style.fontSize,color:style.color,background:style.backgroundColor};})),null,2)+'\n');
   const session=await page.context().newCDPSession(page);await session.send('DOM.enable');await session.send('CSS.enable');
   const {root:documentNode}=await session.send('DOM.getDocument');const {nodeId}=await session.send('DOM.querySelector',{nodeId:documentNode.nodeId,selector:await page.evaluate(()=>{const sample=[...document.querySelectorAll('.shida-summary-card strong,.management-mobile-nav button span,.sidebar a')].find(el=>el.getBoundingClientRect().height>0&&el.getBoundingClientRect().width>0);if(sample)sample.setAttribute('data-font-evidence','sample');return '[data-font-evidence=sample]';})});
   if(nodeId)writeFileSync(join(evidence,`${baseline?'before':'after'}-${marketplace}-${width}-rendered-fonts.json`),JSON.stringify((await session.send('CSS.getPlatformFontsForNode',{nodeId})).fonts,null,2));
   await session.detach();
  }
  if(baseline)continue;
  await fits(page);
  if(width<1024){
   await expect(nav).toBeVisible();const more=nav.locator('[aria-haspopup=dialog]');if(await more.count()){await more.click();
   const sheet=page.locator('.management-more-sheet');await expect(sheet).toBeVisible();const box=(await sheet.boundingBox())!;
   if(width<768)expect(Math.abs(box.y+box.height-900)).toBeLessThan(2);
   else {expect(box.width).toBeLessThanOrEqual(560);expect(Math.abs(box.y-(900-box.height)/2)).toBeLessThan(2);}
   await page.keyboard.press('Escape');await expect(more).toBeFocused();}
  }else await expect(nav).toBeHidden();
  for(const card of await page.locator('.shida-summary-card:visible').all()){
   expect(await card.evaluate(el=>getComputedStyle(el).backgroundImage)).toBe('none');
  }
 }
 if(!baseline){await page.setViewportSize({width:320,height:900});await page.goto(url);await expect(page.locator('.management-mobile-nav')).toBeVisible();await page.evaluate(()=>document.documentElement.style.fontSize='200%');await fits(page);}
});

test('public marketplace headings remain visible and focus uses the shared contrast treatment',async({page})=>{
 test.skip(baseline,'Only shared focus changes on public pages.');
 await page.setViewportSize({width:390,height:900});
 for(const route of ['/fr/shida/wenze','/fr/shida/restaurants','/fr/shida/emplois']){
  await page.goto(route);const heading=page.getByRole('heading',{level:1}).first();
  await expect(heading).toBeVisible();expect((await heading.boundingBox())!.height).toBeGreaterThan(20);
  await page.keyboard.press('Tab');
  expect(await page.locator(':focus').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
 }
});
