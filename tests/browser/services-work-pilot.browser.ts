import {test,expect,type Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {workPilotFixture} from './fixtures/services-work-pilot';
import {workText} from '../../app/lib/services-work-copy';
import {servicesText,type ServicesLocale} from '../../app/components/shida/services-transaction-copy';

const evidence=process.env.PILOT_EVIDENCE??process.env.PILOT_OUTPUT!;
const phase=process.env.PILOT_BASELINE?'before':'after';
const route=(locale='fr',view='work')=>`${locale==='en'?'':'/'+locale}/shida/seller/services?view=${view}`;
async function capture(page:Page,name:string){
 await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0);});
 await page.screenshot({path:join(evidence,`${phase}-${name}.png`),animations:'disabled'});
}
async function fonts(page:Page){return page.evaluate(()=>Object.fromEntries(['body','.svc-work-kpi','.svc-work-kpi strong','.svc-work-tabs button','.svc-work-filters select','.svc-client-work td','.management-mobile-nav button'].map(selector=>{const el=document.querySelector(selector);if(!el)return [selector,null];const s=getComputedStyle(el);return [selector,{family:s.fontFamily,size:s.fontSize,lineHeight:s.lineHeight,weight:s.fontWeight,color:s.color,background:s.backgroundColor}];})));}
async function renderedFonts(page:Page){
 const session=await page.context().newCDPSession(page);await session.send('DOM.enable');await session.send('CSS.enable');
 const {root}=await session.send('DOM.getDocument');const result:Record<string,unknown>={};
 for(const selector of ['.svc-work-kpi span','.svc-work-tabs button','.svc-work-filters select','.svc-client-work td']){
  const {nodeId}=await session.send('DOM.querySelector',{nodeId:root.nodeId,selector});
  if(nodeId)result[selector]=(await session.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;
 }
 await session.detach();return result;
}

test('paired fixtures and actual computed fonts',async({page})=>{
 test.setTimeout(180000);mkdirSync(evidence,{recursive:true});
 const state=await workPilotFixture(page),measurements=[];
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  for(const mode of ['populated','empty','error','loading'] as const){
   state.empty=mode==='empty';state.failed=mode==='error';state.loading=mode==='loading';
   await page.goto(route());await expect(page.locator('.svc-work-kpi')).toHaveCount(4);
   if(mode==='populated')await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
   if(mode==='empty')await expect(page.locator('.svc-work-empty')).toBeVisible();
   if(mode==='error')await expect(page.locator('.svc-work-kpi strong')).toHaveText(['—','—','—','—']);
   if(mode==='loading')await expect(page.locator('.services-transactions [role=status]').first()).toBeVisible();
   await capture(page,`${mode}-${width}`);
   measurements.push({width,mode,fonts:await fonts(page),renderedFonts:await renderedFonts(page)});
  }
 }
 state.loading=false;state.failed=false;state.empty=false;
 for(const width of [390,820]){
  await page.setViewportSize({width,height:900});await page.goto(route());await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
  await page.locator('.management-mobile-nav button').last().click();await expect(page.locator('.management-more-sheet')).toBeVisible();await capture(page,`more-${width}`);
 }
 writeFileSync(join(evidence,`${phase}-computed-fonts.json`),JSON.stringify(measurements,null,2)+'\n');
});

async function fits(page:Page){
 const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
 expect(size.document,JSON.stringify(size)).toBeLessThanOrEqual(size.viewport+1);
}
async function ready(page:Page,locale:ServicesLocale='fr'){
 await page.goto(route(locale));await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
}
test.describe('adopted pilot',()=>{
 test.skip(!!process.env.PILOT_BASELINE,'Capture the unchanged baseline before adopting presentation.');
 for(const locale of ['fr','en','ln','sw'] as const)test(`responsive boundaries, labels and fonts ${locale}`,async({page})=>{
  test.setTimeout(180000);const state=await workPilotFixture(page);state.long=true;
  for(const width of [320,390,767,768,820,1023,1024,1440]){
   await page.setViewportSize({width,height:900});await ready(page,locale);await fits(page);
   await expect(page.locator('.svc-work-kpi strong')).toHaveText(['1','1','1','1']);
   const grid=(await page.locator('.svc-work-kpis').boundingBox())!,summary=(await page.locator('.svc-work-summary').boundingBox())!;
   expect(grid.width).toBeCloseTo(summary.width,0);
   const firstCard=(await page.locator('.svc-work-kpi').first().boundingBox())!,secondCard=(await page.locator('.svc-work-kpi').nth(1).boundingBox())!;
   expect(firstCard.y).toBeCloseTo(secondCard.y,0);
   expect(await page.locator('.svc-view-heading').evaluate(el=>el.getBoundingClientRect().height)).toBeLessThanOrEqual(1);
   await expect(page.getByRole('heading',{level:1})).toHaveCount(1);
   const nav=page.locator('.management-mobile-nav');
   if(width<1024){await expect(nav).toBeVisible();await expect(nav.locator('[aria-current=page]')).toHaveText(/.+/);}
   else {await expect(nav).toBeHidden();await expect(page.locator('.management-desktop-navigation')).toBeVisible();}
   expect(await page.locator('.svc-work-kpi').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(230, 242, 255)');
   expect(await page.locator('.svc-work-filters select').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
   expect(await page.locator('.svc-client-work td').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
   for(const control of await page.locator('.svc-work-kpi,.svc-work-tabs button,.svc-work-filters button,.svc-work-filters select').all()){
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
   }
   const contrasts=await page.locator('.svc-work-kpi').evaluateAll(cards=>cards.map(card=>{
    const style=getComputedStyle(card);
    const luminance=(color:string)=>{
     const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(n=>Number(n)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);
     return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    };
    const a=luminance(style.color),b=luminance(style.backgroundColor);
    return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   }));
   for(const contrast of contrasts)expect(contrast).toBeGreaterThanOrEqual(4.5);
   if(width<1024){
    await nav.locator('button').last().tap();const dialog=page.locator('.management-more-sheet');await expect(dialog).toBeVisible();
    const box=(await dialog.boundingBox())!;
    if(width<768){expect(Math.abs(box.y+box.height-900)).toBeLessThanOrEqual(2);expect(box.width).toBeCloseTo(width,0);}
    else {expect(box.width).toBeLessThanOrEqual(560);expect(box.y).toBeGreaterThan(8);expect(Math.abs(box.y-(900-box.height)/2)).toBeLessThanOrEqual(2);}
    await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(nav.locator('button').last()).toBeFocused();
   }
  }
 });

 for(const locale of ['fr','en','ln','sw'] as const)test(`all tabs, metrics, filters, details and activity messages ${locale}`,async({page})=>{
  await page.setViewportSize({width:390,height:900});await workPilotFixture(page);await ready(page,locale);
  const tabs=page.locator('.svc-work-tabs button'),rows=page.locator('.svc-client-work tbody tr');
  await expect(tabs).toHaveCount(4);
  for(const [index,content] of [[0,'Client de démonstration'],[1,'Consultation prévue'],[2,'Mission entretien'],[3,'Suivi de la consultation']] as const){
   await tabs.nth(index).tap();await expect(rows).toContainText(index===0?['Client de démonstration','Client 2']:index===1?['Consultation prévue','Mission entretien']:[content]);
   await expect(tabs.nth(index)).toHaveAttribute('aria-pressed','true');
   const selected=(await tabs.nth(index).boundingBox())!,strip=(await page.locator('.svc-work-tabs').boundingBox())!;
   expect(selected.x).toBeGreaterThanOrEqual(strip.x);expect(selected.x+selected.width).toBeLessThanOrEqual(strip.x+strip.width+1);
  }
  await rows.first().getByRole('button').click();await expect(page.locator('.svc-work-detail')).toContainText('Message lié à la demande.');
  await page.locator('.svc-work-detail').getByRole('button',{name:servicesText(locale,'back'),exact:true}).click();await expect(rows).toContainText(['Suivi de la consultation']);
  for(const [index,content] of ['Client de démonstration','Entretien à domicile','Consultation prévue','Mission entretien'].entries()){
   await page.locator('.svc-work-kpi').nth(index).click();await expect(rows).toHaveCount(1);await expect(rows).toContainText([content]);
  }
  await tabs.first().click();await page.locator('.svc-work-filters select').first().selectOption('SVC_one');
  await expect(rows).toHaveCount(1);await rows.first().getByRole('button').click();await expect(page.locator('.svc-work-detail')).toContainText('Description synthétique');
  await expect(page.locator('.svc-work-detail').getByRole('button',{name:servicesText(locale,'review'),exact:true})).toBeVisible();
  await page.locator('.svc-work-detail').getByRole('button',{name:servicesText(locale,'back'),exact:true}).click();
  await expect(page.locator('.svc-work-filters select').first()).toHaveValue('SVC_one');await expect(rows).toHaveCount(1);
  await page.locator('.svc-work-filters select').nth(1).selectOption('sent');await expect(page.locator('.svc-work-empty')).toContainText(workText(locale,'noMatch'));
  await page.getByRole('button',{name:workText(locale,'reset'),exact:true}).click();await expect(rows).toHaveCount(2);
  await page.locator('.management-mobile-nav button').last().tap();await page.locator('.management-more-sheet .svc-return-space').tap();
  await expect(page).toHaveURL(new RegExp(`${locale==='en'?'':'/'+locale}/shida/space/?$`));
 });

 for(const locale of ['fr','en','ln','sw'] as const)test(`loading, empty, failure, retry and denial ${locale}`,async({page})=>{
  const state=await workPilotFixture(page);state.empty=true;await page.setViewportSize({width:390,height:900});await page.goto(route(locale));
  await expect(page.locator('.svc-work-empty')).toContainText(workText(locale,'empty'));await expect(page.locator('.svc-work-kpi strong')).toHaveText(['0','0','0','0']);
  state.empty=false;state.failed=true;await page.locator('.svc-work-filters button').click();
  await expect(page.locator('.svc-work-kpi strong')).toHaveText(['—','—','—','—']);await expect(page.locator('.svc-work-empty')).toHaveCount(0);
  await expect(page.locator('.svc-work [role=status]')).toContainText([servicesText(locale,'load_failed')]);
  state.failed=false;state.loading=true;await page.locator('.svc-work-filters button').click();await expect(page.locator('.svc-work-filters button')).toBeDisabled();
  await expect(page.locator('.svc-work [role=status]').first()).toContainText(servicesText(locale,'loading'));
  state.loading=false;await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
  state.denied=true;await page.locator('.svc-work-filters button').click();await expect(page.locator('.svc-workspace')).toHaveCount(0);
 });

 test('keyboard, navigation, direct links, return destination and unaffected views',async({page})=>{
  await workPilotFixture(page);await page.setViewportSize({width:820,height:900});await ready(page);
  const nav=page.locator('.management-mobile-nav');await nav.locator('button').nth(2).click();await expect(page.locator('.svc-planner')).toBeVisible();await expect(page.locator('.shida-responsive')).toHaveCount(1);
  await nav.locator('button').nth(1).click();await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);await expect(page.locator('#services-view-title')).toBeFocused();
  await page.reload();await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
  await page.goto(route('fr','overview'));await expect(page.locator('.svc-daily')).toBeVisible();await page.goto(route());await expect(page.locator('.svc-client-work')).toBeVisible();
  await page.goBack();await expect(page.locator('.svc-daily')).toBeVisible();await page.goForward();await expect(page.locator('.svc-client-work')).toBeVisible();
  const first=page.locator('.svc-work-kpi').first();await first.focus();await page.keyboard.press('Tab');await expect(page.locator('.svc-work-kpi').nth(1)).toBeFocused();
  expect(await page.locator('.svc-work-kpi').nth(1).evaluate(el=>getComputedStyle(el).outlineWidth)).toBe('3px');
  await nav.locator('button').last().focus();await page.keyboard.press('Enter');const dialog=page.locator('.management-more-sheet');await expect(dialog).toBeVisible();
  // Native dialog may move focus to browser chrome at the wrap boundary. It must
  // never enter background page controls, and the next Tab returns to the dialog.
  for(let i=0;i<12;i++){
   await page.keyboard.press('Tab');
   const focus=await dialog.evaluate(el=>el.contains(document.activeElement)?'dialog':document.activeElement===document.body?'chrome':'background');
   expect(focus).not.toBe('background');
   if(focus==='chrome'){await page.keyboard.press('Tab');expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);}
  }
  await page.keyboard.press('Escape');await expect(nav.locator('button').last()).toBeFocused();
  await nav.locator('button').last().click();await dialog.locator('.svc-return-space').click();await expect(page).toHaveURL(/\/fr\/shida\/space\/?$/);
  await page.setViewportSize({width:1440,height:900});await ready(page);await expect(page.locator('.svc-work-desktop-options summary')).toBeVisible();
  await page.evaluate(()=>{
   const diagnostic=window as Window&{pilotFullscreen?:{target:string;error:string}};
   const original=Element.prototype.requestFullscreen;
   Element.prototype.requestFullscreen=function(options){
    diagnostic.pilotFullscreen={target:this.className,error:''};
    return original.call(this,options).catch(error=>{diagnostic.pilotFullscreen!.error=String(error);throw error;});
   };
  });
  await page.locator('.svc-work-desktop-options summary').click();await expect(page.locator('.svc-work-desktop-options .business-fullscreen-action')).toBeVisible();
  await page.locator('.svc-work-desktop-options .business-fullscreen-action').click();
  await expect.poll(()=>page.evaluate(()=>{
   const outcome=(window as Window&{pilotFullscreen?:{target:string;error:string}}).pilotFullscreen;
   return document.fullscreenElement?'entered':outcome?.error;
  })).toMatch(/entered|TypeError: not granted/);
  const fullscreen=await page.evaluate(()=>({active:!!document.fullscreenElement,...(window as Window&{pilotFullscreen?:{target:string;error:string}}).pilotFullscreen}));
  expect(fullscreen.target).toContain('connected-workspace');
  test.info().annotations.push({type:'fullscreen',description:fullscreen.active?'Entered fullscreen':`Browser denied fullscreen: ${fullscreen.error}; destination and graceful fallback verified.`});
  if(fullscreen.active)await page.evaluate(()=>document.exitFullscreen());
  await expect(page.locator('.svc-work-desktop-options details')).not.toHaveAttribute('open','');
  await page.locator('.management-desktop-navigation .seller-navigation button').first().click();await expect(page.locator('.svc-daily')).toBeVisible();await expect(page.locator('.shida-responsive')).toHaveCount(1);
 });

 test('enlarged text, long list, pagination, focus and bottom clearance',async({page})=>{
  test.setTimeout(180000);
  const state=await workPilotFixture(page);state.long=true;state.count=26;
  for(const locale of ['fr','en','ln','sw'])for(const width of [320,390,820,1440])for(const scale of [1.5,2]){
   await page.setViewportSize({width,height:900});await page.goto(route(locale));await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(20);
   await page.addStyleTag({content:`html{font-size:${16*scale}px!important}`});await fits(page);
   await page.locator('.svc-work-list > .transaction-actions button').last().click();await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(6);
   const last=page.locator('.svc-client-work tbody tr').last().getByRole('button');await last.focus();await last.scrollIntoViewIfNeeded();
   await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   if(width<1024){
    const box=(await last.boundingBox())!,bar=(await page.locator('.management-mobile-nav').boundingBox())!;
    expect(box.y+box.height).toBeLessThanOrEqual(bar.y);await page.locator('.management-mobile-nav button').last().click();await fits(page);await page.keyboard.press('Escape');
   }
  }
 });
});
