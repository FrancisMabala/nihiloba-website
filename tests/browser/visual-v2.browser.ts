import {test,expect} from '@playwright/test';
test.beforeEach(async({page,browserName})=>{
 await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
 await page.route('**/_next/image**',r=>r.fulfill({path:'public/NIHILOBA_logo.png',contentType:'image/png'}));
 if(browserName==='webkit')await page.route('http://127.0.0.1:3044/**',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const response=await route.fetch({maxRedirects:0}),headers=response.headers();headers['content-security-policy']=headers['content-security-policy']?.replace(/;?\s*upgrade-insecure-requests/g,'')||'';
  if(response.status()>=300&&response.status()<400)return route.continue();
  await route.fulfill({response,headers});
 });
});
for(const locale of ['en','fr','ln','sw'])for(const width of [360,820,1440])test(`visual discovery interactions ${locale} ${width}`,async({page,browserName})=>{
 await page.setViewportSize({width,height:960});const base=`${locale==='en'?'':`/${locale}`}/shida`;
 await page.goto(`${base}/`);await expect(page.locator('.discovery-job').first()).toBeVisible();
 const cards=page.locator('.discovery-categories>a');await expect(cards).toHaveCount(7);
 const sizes=await cards.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().height));expect(Math.max(...sizes)-Math.min(...sizes)).toBeLessThan(2);
 for(const market of ['emplois','services','wenze','appartements','hotels','restaurants','transport'])await expect(page.locator(`.discovery-categories>[data-market="${market}"]`)).toHaveAttribute('href',`${base}/${market}/`);
 await expect(page.locator('#school a')).toHaveAttribute('href',`${base}/ecole/`);await expect(page.locator('#business a')).toHaveAttribute('href','https://business.nihiloba.com');
 await expect(page.locator('.discovery-account-note a')).toHaveAttribute('href',`${base}/register/`);
 // Native keyboard activation and a useful visible outline are preserved.
 await cards.nth(2).focus();await expect(cards.nth(2)).toBeFocused();
 expect(await cards.nth(2).evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
 if(locale==='fr'&&browserName==='chromium')await page.screenshot({path:`docs/evidence/visual-v2-20261023/home-${width}.png`,fullPage:true});
 await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/shida\/wenze\/?$/);
 await expect(page.locator('.wzp-selling article')).toHaveCount(2);
 const sell=page.locator('.wzp-selling');await sell.scrollIntoViewIfNeeded();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 if(locale==='fr'&&browserName==='chromium')await page.screenshot({path:`docs/evidence/visual-v2-20261023/selling-${width}.png`,fullPage:true});
 await sell.locator('a').first().click();await expect(page).toHaveURL(new RegExp('/shida/register/\\?returnTo='));expect(new URL(page.url()).searchParams.get('returnTo')).toBe(`${base}/wenze/sell/`);
 await page.goto(`${base}/wenze/`);await page.locator('.wzp-selling a').last().click();await expect(page).toHaveURL(new RegExp('/shida/register/\\?returnTo='));expect(new URL(page.url()).searchParams.get('returnTo')).toBe(`${base}/seller/wenze/`);
});
test('homepage search retains selected marketplace, city and query',async({page})=>{
 await page.goto('/fr/shida/');await page.locator('.discovery-search select').selectOption('services');await page.locator('.discovery-query input').fill('coiffure');await page.locator('.discovery-search input[name=city]').fill('Kinshasa');await page.locator('.discovery-search button').click();await expect(page).toHaveURL(/\/fr\/shida\/services/);expect(new URL(page.url()).searchParams.get('query')).toBe('coiffure');expect(new URL(page.url()).searchParams.get('city')).toBe('Kinshasa');
});
test('discovery text and primary/secondary actions meet normal-text contrast',async({page})=>{
 for(const path of ['/fr/shida/','/fr/shida/wenze/']){
  await page.goto(path);
  const checks=await page.locator('.discovery-categories strong,.discovery-categories small,.discovery-entries p,.discovery-entries a,.discovery-account-note a,.discovery-story-link a,.discovery .service-category,.wzp-selling p,.wzp-selling a').evaluateAll(elements=>{
   const context=document.createElement('canvas').getContext('2d')!;
   function rgba(value:string){context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);return [...context.getImageData(0,0,1,1).data];}
   function luminance(c:number[]){const linear=c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;}
   return elements.map(el=>{let parent:Element|null=el,background=[255,255,255,255];while(parent){const color=rgba(getComputedStyle(parent).backgroundColor);if(color[3]===255){background=color;break;}parent=parent.parentElement;}const foreground=rgba(getComputedStyle(el).color),a=luminance(foreground),b=luminance(background);return {text:el.textContent,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
  });
  expect(checks.length).toBeGreaterThan(0);for(const check of checks)expect(check.ratio,check.text||'text').toBeGreaterThanOrEqual(4.5);
 }
});
