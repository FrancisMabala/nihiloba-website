import {signInReader} from './job-reader-session';
import {test, expect} from '@playwright/test';


test.beforeEach(async ({page, browserName, baseURL}) => {
  await signInReader(page);
  if (browserName !== 'webkit' || !baseURL?.startsWith('http://127.0.0.1:')) return;
  // This fixture serves HTTP. WebKit otherwise upgrades same-origin scripts to TLS.
  await page.route(baseURL + '/**', async route => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const response = await route.fetch();
    const headers = response.headers();
    headers['content-security-policy'] = headers['content-security-policy'].replace('upgrade-insecure-requests', '');
    await route.fulfill({response, headers});
  });
});
for (const locale of ['en', 'fr', 'ln', 'sw']) for (const width of [390, 1440]) {
  test(`formatted external offer and employer link ${locale} ${width}`, async ({page, context, isMobile}) => {
    await page.setViewportSize({width, height: 800});
    const prefix = locale === 'en' ? '' : `/${locale}`;
    const destination = 'https://careers.example/apply?id_job=973&id_origin=0';
    let releaseDestination!: () => void;
    const delay = new Promise<void>(resolve => { releaseDestination = resolve; });
    let resolutions = 0;
    const writes: string[] = [];
    page.on('request', request => {
      if (request.method() === 'POST') writes.push(new URL(request.url()).pathname.replace(/\/$/,''));
    });
    // Preserve the public browser Origin across the production reverse proxy.
    await page.route('**/api/shida/public-jobs/**', async route => {
      if (route.request().url().includes('/external-action')) {
        resolutions++;
        await delay;
      }
      const response = await route.fetch({headers: {...route.request().headers(), origin: 'https://nihiloba.com'}});
      await route.fulfill({response});
    });
    await context.route('https://careers.example/**', route => route.fulfill({
      contentType: 'text/html', body: '<h1>Employer application fixture</h1>',
    }));
    await page.goto(`${prefix}/shida/emplois/formatted/`);
    const original = page.url();
    const content = page.locator('.job-detail-content');
    await expect(content.getByRole('heading', {name: 'Gestion des équipes'})).toBeVisible();
    await expect(content.locator('ul li')).toHaveCount(2);
    await expect(content.locator('ol li')).toHaveCount(2);
    await expect(content.locator('strong').filter({hasText: 'Encadrer'})).toBeVisible();
    await expect(content.locator('em')).toContainText('Suivi quotidien.');
    await expect(content.locator('.job-external-source a')).toHaveAttribute('href', 'https://www.airtel.cd/careers');
    await expect(content.locator('.job-employer-identity')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const offers = page.locator('.job-detail-identity .button-text');
    await offers.click();
    await expect(page).toHaveURL(new RegExp('/employeurs/ORG_airtel/?$'));
    await page.getByRole('link', {name: 'Field Engineer', exact: true}).click();
    await expect(page.getByRole('heading', {name: 'Field Engineer', exact: true})).toBeVisible();
    await expect(page).toHaveURL(/\/emplois\/field-engineer\/$/);
    await page.goto(original);

    const warning = page.locator('.job-applicant-safety');
    await expect(warning.locator('svg')).toBeVisible();
    await expect(warning.locator('p span')).toHaveCSS('color', 'rgb(129, 37, 42)');
    await expect(warning.getByRole('link')).toHaveCSS('text-decoration-line', 'underline');
    const action = page.locator('.job-external-action button');
    await expect(action).toHaveCount(1);
    await expect(page.locator('.job-new-tab-hint')).toBeVisible();
    if (locale === 'fr') {
      await expect(action).toHaveAccessibleDescription('S’ouvre dans un nouvel onglet.');
      await expect(warning.locator('p')).toHaveText('Méfiez-vous des employeurs demandant des paiements inattendus ou des informations personnelles sensibles.');
      await page.screenshot({path: `test-results/offer-formatting-public-${width}.png`, fullPage: true});
    }
    if (width === 390) await expect(page.locator('.job-external-action')).toHaveCSS('position', 'fixed');
    await action.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo({top:120, behavior:'instant'}));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(120);
    const scrollY = await page.evaluate(() => window.scrollY);

    writes.length = 0;
    const popupPromise = context.waitForEvent('page');
    if (isMobile) await action.tap(); else await action.click();
    const popup = await popupPromise;
    try {
      await expect.poll(() => resolutions).toBe(1);
      await expect(popup).toHaveURL('about:blank');
      await expect(action).toBeDisabled();
      expect(context.pages()).toHaveLength(2);
    } finally {
      releaseDestination();
    }
    await expect(popup).toHaveURL(destination);
    await expect(popup.getByRole('heading', {name: 'Employer application fixture'})).toBeVisible();
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    await expect(action).toBeEnabled();
    await expect(page).toHaveURL(original);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    expect(context.pages()).toHaveLength(2);
    expect(resolutions).toBe(1);
    expect(writes.filter(path => !path.endsWith('/view') && !path.endsWith('/view/'))).toEqual(['/api/shida/public-jobs/JOB_airtel/external-action']);
  });
}

for(const [locale,contract,travel] of [['fr','Bénévolat / volontariat','Déplacements requis'],['en','Volunteering','Travel required'],['ln','Mosala ya bolingo','Esengeli kosala mibembo'],['sw','Kazi ya kujitolea','Safari zinahitajika']]) for(const width of [390,1440]) {
  test(`volunteering and travel ${locale} ${width}`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    await page.goto(`${locale==='en'?'':'/'+locale}/shida/emplois/travel/`);
    await expect(page.getByText(contract,{exact:true})).toBeVisible();
    await expect(page.locator('.job-travel')).toContainText(travel);
    await expect(page.locator('.job-travel')).toContainText('Beni et Goma, deux fois par mois.');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(locale==='fr')await page.screenshot({path:testInfo.outputPath('travel-public.png'),fullPage:true});
  });
}

test('a rejected destination closes the waiting tab and allows a retry', async ({page, context, isMobile}) => {
  await page.route('**/external-action/**', route => route.fulfill({status: 409, json: {error: 'job_unavailable'}}));
  await page.goto('/fr/shida/emplois/formatted');
  const original = page.url();
  const action = page.locator('.job-external-action button');
  const popupPromise = context.waitForEvent('page');
  if (isMobile) await action.tap(); else await action.click();
  const popup = await popupPromise;
  await expect.poll(() => popup.isClosed()).toBe(true);
  await expect(page.locator('.job-external-action [role="status"]')).toContainText('Cette offre n’est plus ouverte');
  await expect(action).toBeEnabled();
  await expect(page).toHaveURL(original);
});
