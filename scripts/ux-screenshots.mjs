import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
await page.route('**/api/shida/**',r=>r.fulfill({status:401,json:{}}));
await page.route('**/_next/image**',r=>r.fulfill({path:'public/NIHILOBA_logo.png',contentType:'image/png'}));
for(const width of [320,390,820,1440]) {
 await page.setViewportSize({width,height:900});
 for(const market of ['emplois','wenze']) {
  await page.goto(`${process.env.UX_TEST_URL||'http://127.0.0.1:3054'}/fr/shida/${market}${market==='wenze'?'?min_price=10&availability=in_stock':''}`);
  await page.locator('.marketplace-public h1').waitFor();
  await page.addStyleTag({content:'nextjs-portal{display:none}'});
  await page.screenshot({path:`docs/evidence/ux-refinement-20261028/${process.argv[2]||'after'}-${market}-${width}.png`,fullPage:true});
 }
}
await browser.close();
