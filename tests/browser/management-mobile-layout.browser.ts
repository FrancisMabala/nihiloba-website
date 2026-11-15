import {test,expect,type Page} from '@playwright/test';
import {setup} from './management-layout-fixture';

const evidence=process.env.SHIDA_MOBILE_EVIDENCE_DIR||'test-results/management-mobile/evidence';
const longName='Boutique de la Délégation de l’Union européenne en République démocratique du Congo';
async function fits(page:Page){const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width})).slice(0,15)}));expect(layout.scroll,JSON.stringify(layout)).toBeLessThanOrEqual(layout.width);}
async function labelsFit(page:Page){
 const metrics=await page.locator('.management-mobile-nav>button').evaluateAll(buttons=>buttons.map(button=>{
  const label=button.querySelector('span')!,text=label.firstChild!,rect=button.getBoundingClientRect();
  const words=label.textContent!.matchAll(/\S+/g);let split=false;
  for(const word of words){const lines=new Set<number>();for(let i=word.index!;i<word.index!+word[0].length;i++){const range=document.createRange();range.setStart(text,i);range.setEnd(text,i+1);lines.add(Math.round(range.getBoundingClientRect().top));}if(lines.size>1)split=true;}
  return {split,width:rect.width,overflow:label.scrollWidth>label.clientWidth+1,iconTop:button.querySelector('svg')!.getBoundingClientRect().top};
 }));
 expect(metrics.every(m=>!m.split&&!m.overflow)).toBe(true);
 expect(Math.max(...metrics.map(m=>m.width))-Math.min(...metrics.map(m=>m.width))).toBeLessThan(1);
 expect(Math.max(...metrics.map(m=>m.iconTop))-Math.min(...metrics.map(m=>m.iconTop))).toBeLessThan(1);
}
for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,390,430,820,1440])test(`shop reflow ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:850});const f=await setup(page,'active',locale,longName);
 await page.goto(f.url+'&view=shop');const identity=page.locator('.wz-shop-identity');await expect(identity).toContainText(longName);
 await fits(page);
 if(width<1024){
  await labelsFit(page);await expect(page.locator('.business-fullscreen')).toBeHidden();
  const menu=page.locator('.business-secondary-actions');await expect(menu).toBeVisible();
  await menu.locator('summary').click();await expect(menu.locator('button')).toBeVisible();await page.keyboard.press('Escape');await expect(menu.locator('summary')).toBeFocused();
  if(width<=760){const card=await identity.boundingBox(),meta=await page.locator('.ws-shop-metadata').boundingBox(),name=await page.locator('.ws-shop-name').boundingBox(),photoAction=await page.locator('.ws-upload').boundingBox();expect(meta!.width).toBeGreaterThan(card!.width*.8);expect(meta!.y).toBeGreaterThanOrEqual(name!.y+name!.height-1);expect(photoAction!.y).toBeGreaterThan(meta!.y);}
 }else {await expect(page.locator('.business-fullscreen')).toBeVisible();await expect(page.locator('.wz-desktop-navigation')).toBeVisible();}
 if(locale==='fr')await page.screenshot({path:`${evidence}/shop-${width}.png`,fullPage:true});
 for(const index of [1,2]){await page.locator('.wz-shop-tabs button').nth(index).click();await fits(page);}
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 if(width<1024){const last=page.locator('.wz-account-access');await last.scrollIntoViewIfNeeded();const box=await last.boundingBox(),nav=await page.locator('.management-mobile-nav').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(nav!.y+1);}
 expect(f.errors).toEqual([]);expect(f.writes).toHaveLength(0);
});

test('shop actions, unsupported fullscreen and changing viewport',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(document,'fullscreenEnabled',{get:()=>false}));
 await page.setViewportSize({width:320,height:740});const f=await setup(page,'active','en','Boutique'+ 'LongUninterruptedName'.repeat(8));await page.goto(f.url+'&view=shop');
 await expect(page.locator('.business-secondary-actions')).toHaveCount(0);await fits(page);
 await page.getByRole('button',{name:'Edit presentation',exact:true}).click();
 const editor=page.locator('.wz-editor');await editor.getByLabel('Name',{exact:true}).fill('Updated mobile shop');
 await editor.getByRole('button',{name:'Save',exact:true}).click();await expect(page.locator('.ws-shop-name')).toContainText('Updated mobile shop');expect(f.writes.at(-1)?.body).toMatchObject({expected_revision:1,fields:{name:'Updated mobile shop'}});
 await page.locator('.ws-upload summary').click();await page.locator('.ws-upload').getByRole('button',{name:'Remove',exact:true}).click();await expect(page.locator('.wz-shop-identity img')).toHaveCount(0);await fits(page);
 for(const size of [{width:320,height:520},{width:430,height:800},{width:820,height:600}]){await page.setViewportSize(size);await labelsFit(page);await fits(page);}
 await page.addStyleTag({content:'html{font-size:125%}.seller-design .management-mobile-nav.management-mobile-nav button{font-size:16px}'});await page.setViewportSize({width:320,height:740});await expect.poll(()=>page.locator('.management-mobile-nav>button').count()).toBeLessThan(5);await labelsFit(page);await fits(page);
 expect(f.errors).toEqual([]);
});

test('fullscreen from secondary menu, normal identity and mobile photo panel',async({page})=>{
 await page.setViewportSize({width:390,height:844});const f=await setup(page,'active','fr');await page.goto(f.url+'&view=shop');await expect(page.locator('.ws-shop-name')).toContainText('Boutique du Fleuve');
 const header=await page.locator('.wz-header').boundingBox(),identityBar=await page.locator('.connected-mobile-bar').boundingBox();expect(identityBar!.y-header!.y-header!.height).toBeLessThanOrEqual(8);
 const menu=page.locator('.business-secondary-actions');await menu.locator('summary').click();await menu.locator('button').click();
 await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
 await menu.locator('summary').click();await menu.locator('button').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
 await page.screenshot({path:`${evidence}/shop-390-normal.png`,fullPage:true});
 await page.locator('.ws-upload summary').click();await fits(page);await expect(page.locator('.ws-upload').getByRole('button').first()).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await fits(page);await page.locator('.ws-upload summary').click();await page.screenshot({path:`${evidence}/shop-desktop-normal.png`,fullPage:true});
 expect(f.writes).toHaveLength(0);expect(f.errors).toEqual([]);
});
