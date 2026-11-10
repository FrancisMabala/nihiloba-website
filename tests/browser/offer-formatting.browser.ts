import {test,expect} from '@playwright/test';
test.use({channel:'msedge'});
for(const locale of ['en','fr','ln','sw']) for(const width of [390,1440]) {
  test(`formatted external offer and employer link ${locale} ${width}`,async({page})=>{
    await page.setViewportSize({width,height:960});
    // Exercise the real production Next proxy behind an internal URL, with
    // the browser's public Origin preserved just as on Render.
    await page.route('**/api/shida/public-jobs/**',async route=>{
      const response=await route.fetch({headers:{...route.request().headers(),origin:'https://nihiloba.com'}});
      await route.fulfill({response});
    });
    await page.route('https://careers.example/**',route=>route.fulfill({contentType:'text/html',body:'<h1>Employer application fixture</h1>'}));
    await page.goto(`${locale==='en'?'':`/${locale}`}/shida/emplois/formatted`);
    const content=page.locator('.job-detail-content');
    await expect(content.getByRole('heading',{name:'Gestion des équipes'})).toBeVisible();
    await expect(content.locator('ul li')).toHaveCount(2);
    await expect(content.locator('ol li')).toHaveCount(2);
    await expect(content.locator('strong').filter({hasText:'Encadrer'})).toBeVisible();
    await expect(content.locator('em')).toContainText('Suivi quotidien.');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(locale==='fr') await page.screenshot({path:`docs/evidence/offer-formatting-public-${width}.png`,fullPage:true});
    const actions=page.locator('.job-external-action button');
    await expect(actions).toHaveCount(1);
    const applicationResponse=page.waitForResponse(response=>response.url().includes('/external-action') && response.status() !== 308 && response.status() !== 307);
    await actions.click();
    const response=await applicationResponse;
    expect(response.status()).toBe(200);
    await expect(page).toHaveURL('https://careers.example/apply?id_job=973&id_origin=0');
    await expect(page.getByRole('heading',{name:'Employer application fixture'})).toBeVisible();
  });
}
