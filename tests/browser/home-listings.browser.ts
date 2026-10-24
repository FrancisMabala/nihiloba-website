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

for(const locale of ['en','fr','ln','sw'])for(const width of [360,820,1440])test(`compact homepage listings ${locale} ${width}`,async({page,browserName})=>{
 await page.setViewportSize({width,height:960});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/`);
 const job=page.locator('.discovery-job').first();await expect(job).toBeVisible();
 const panel=await page.locator('.discovery-listings').evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopWidth,padding:s.paddingLeft};});
 expect(panel).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px',padding:'0px'});
 const icon=await job.locator('.discovery-job-icon').boundingBox(),title=await job.locator('h4').boundingBox();
 expect(title!.x).toBeGreaterThan(icon!.x+icon!.width);expect(Math.abs(title!.y-icon!.y)).toBeLessThan(2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(page.locator('.discovery-categories>a')).toHaveCount(7);
 await expect(page.locator('.discovery .service-card').first()).toBeVisible();
 await expect(page.locator('.discovery-job')).toHaveCount(3);
 await expect(page.locator('.discovery-job time')).toHaveCount(2);
 await expect(page.locator('.discovery-feed')).not.toContainText('PRIVATE_ADDRESS_SENTINEL');
 await expect(page.locator('.discovery-feed')).not.toContainText('PRIVATE_LANDMARK_SENTINEL');
 if(width===1440){const heights=await page.locator('.discovery-job').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));expect(Math.max(...heights)-Math.min(...heights)).toBeLessThan(2);}
 const heading=page.locator('.discovery-group-heading h3').first();expect(await heading.evaluate(el=>getComputedStyle(el).fontWeight)).toBe('700');
 const link=job.locator('.discovery-detail');await link.focus();await expect(link).toBeFocused();
 await link.blur();
 if(locale==='fr'&&browserName==='chromium')await page.locator('.discovery-listings').screenshot({path:`docs/evidence/home-listings-20261024/listings-${width}.png`});
});
