# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restaurant-lazy-panels.browser.ts >> deferred direct destination settings 1440
- Location: tests\browser\restaurant-lazy-panels.browser.ts:20:6

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.rst-settings').getByRole('button').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.rst-settings').getByRole('button').first() with timeout 5000ms
  - waiting for locator('.rst-settings').getByRole('button').first()

```

```yaml
- link "Aller au contenu":
  - /url: "#main-content"
- main:
  - link "Accueil NIHILOBA":
    - /url: /fr
    - text: NIHILOBA
  - link "SHIDA Restaurants":
    - /url: /fr/shida/restaurants
  - button "Langue": FR
  - button "Mon compte SHIDA · Francis Mabala": FM
  - group:
    - alert: Cet établissement est indisponible pour votre accès actuel. Revenez à l’espace vendeur Personnel.
    - link "Vérifier":
      - /url: /fr/shida/seller/restaurants/
- alert
```

# Test source

```ts
  1   | import {test,expect} from '@playwright/test';
  2   | import {restaurantPanelFixture as fixture} from './restaurant-panel-fixtures';
  3   | import {restaurantText} from '../../app/lib/restaurant-seller-copy';
  4   | import {managementNavigation} from './restaurant-management-navigation';
  5   | import {mkdirSync,writeFileSync} from 'node:fs';
  6   | import {join} from 'node:path';
  7   |
  8   | const at='2026-11-18T12:00:00Z';
  9   |
  10  | const destinations=[
  11  |  ['orders','.rst-orders-screen'],['items','.rst-menu-workspace'],
  12  |  ['reservations','.rst-reservations'],['inventory','.rst-stock'],
  13  |  ['activity','.rst-statistics-design'],['recovery','.rst-invoices'],
  14  |  ['daily','.rst-daily'],['profile','.rst-profile-overview'],
  15  |  ['hours','.rst-hours-overview'],['settings','.rst-settings'],
  16  |  ['photos','.rst-photo-editor'],['reviews','.rst-reviews'],
  17  | ] as const;
  18  |
  19  | for(const width of [390,1440])for(const [tab,selector] of destinations){
  20  |  test(`deferred direct destination ${tab} ${width}`,async({page})=>{
  21  |   await fixture(page);await page.setViewportSize({width,height:900});
  22  |   await page.goto(`/fr/shida/seller/restaurants/?establishment=RST_0&tab=${tab}`);
  23  |   await expect(page.locator(selector)).toBeVisible();
  24  |   await expect(page.locator('.rst-panel-loading')).toHaveCount(0);
  25  |   await expect(page.locator('.rst-today')).toHaveCount(0);
  26  |   await expect(page.locator('.rst-restaurant-identity:visible strong').first()).toContainText('Chez maman');
  27  |   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  28  |   // Error-only fixtures still must render the destination's real controls; a
  29  |   // selected label or a fallback overview alone does not satisfy this check.
> 30  |   await expect(page.locator(selector).getByRole('button').first()).toBeVisible();
      |                                                                    ^ Error: expect(locator).toBeVisible() failed
  31  |   if(tab==='activity'){
  32  |    await expect(page.locator('.rst-stats-presets button')).toHaveCount(4);
  33  |    await expect(page.locator(selector).getByRole('alert').first()).toBeVisible();
  34  |    await expect(page.locator('.rst-stats-three')).toHaveCount(0);
  35  |   }
  36  |  });
  37  | }
  38  |
  39  | for(const locale of ['fr','en','ln','sw'] as const)test(`deferred loading preserves navigation and locale ${locale}`,async({page})=>{
  40  |  await fixture(page);await page.setViewportSize({width:390,height:900});
  41  |  await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
  42  |  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  43  |  let release!:()=>void;const hold=new Promise<void>(resolve=>{release=resolve;});let chunks=0;
  44  |  await page.route('**/_next/static/chunks/**/*.js',async route=>{chunks++;await hold;await route.continue();});
  45  |  await page.locator('.rst-metric-incoming > button').click();
  46  |  await expect(page.locator('.rst-panel-loading')).toHaveText(restaurantText(locale,'loading'));
  47  |  await expect(page.locator('.management-mobile-nav')).toBeVisible();
  48  |  expect(chunks).toBeGreaterThan(0);
  49  |  release();await expect(page.locator('.rst-orders-screen')).toBeVisible();
  50  |  await expect(page.locator('.rst-panel-loading')).toHaveCount(0);
  51  | });
  52  |
  53  | for(const width of [390,1440])test(`first menu and finance openings render useful content ${width}`,async({page},testInfo)=>{
  54  |  await fixture(page);await page.setViewportSize({width,height:900});
  55  |  await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
  56  |  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  57  |  if(process.env.PERF_OUTPUT){mkdirSync(process.env.PERF_OUTPUT,{recursive:true});await page.screenshot({path:join(process.env.PERF_OUTPUT,`today-lazy-${width}.png`),fullPage:true});}
  58  |  const costs=[];
  59  |  for(const [name,selector] of [['Mon menu','.rst-menu-workspace'],['Finances','.rst-daily']] as const){
  60  |   const scripts:string[]=[];const received=(response:import('@playwright/test').Response)=>{if(response.request().resourceType()==='script')scripts.push(response.url());};
  61  |   page.on('response',received);const start=Date.now();await managementNavigation(page,name);
  62  |   await expect(page.locator(selector)).toBeVisible();
  63  |   if(name==='Mon menu')await expect(page.locator(selector)).toContainText('Pondu, poisson et accompagnement au choix');
  64  |   else await expect(page.locator('[data-metric=received] strong')).toContainText('3');
  65  |   costs.push({name,firstUsefulMs:Date.now()-start,asyncScripts:scripts.length});page.off('response',received);
  66  |  }
  67  |  const evidence=JSON.stringify({width,network:'local routed synthetic responses; HTTP cache disabled by routing',costs},null,2);
  68  |  await testInfo.attach('first-opening-costs',{body:evidence,contentType:'application/json'});
  69  |  if(process.env.PERF_OUTPUT){mkdirSync(process.env.PERF_OUTPUT,{recursive:true});writeFileSync(join(process.env.PERF_OUTPUT,`first-menu-finance-${width}.json`),evidence);}
  70  |  await managementNavigation(page,'Commandes');await expect(page.locator('.rst-orders-screen')).toContainText('Aucune commande à traiter');
  71  | });
  72  |
  73  | test('counter draft survives lazy panel navigation and keeps leave protection',async({page})=>{
  74  |  await fixture(page);await page.setViewportSize({width:1440,height:900});
  75  |  const dish={public_ref:'RMI_1',name:'Pondu',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish',counter_options:{portions:[],extras:[]}};
  76  |  const basket={basket_ref:'RBA_draft',revision:1,quote:null,quote_ref:null,order_ref:null};let creates=0;
  77  |  await page.route('**/RST_0/pos/**',route=>{
  78  |   const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  79  |   if(p.endsWith('/pos'))return route.fulfill({json:{intake_released:true,items:[dish],recent:[]}});
  80  |   if(p.endsWith('/counter-unpaid'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  81  |   if(p.endsWith('/counter-baskets')){if(route.request().method()==='POST'){creates++;return route.fulfill({json:basket});}return route.fulfill({json:{items:[],total:0,has_more:false}});}
  82  |   if(p.endsWith('/RBA_draft'))return route.fulfill({json:basket});
  83  |   return route.fallback();
  84  |  });
  85  |  await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=pos');
  86  |  await page.getByRole('button',{name:'Ajouter Pondu',exact:true}).click();
  87  |  await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
  88  |  await managementNavigation(page,'Commandes');await expect(page.locator('.rst-orders-screen')).toBeVisible();
  89  |  await managementNavigation(page,'Vendre');await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
  90  |  expect(creates).toBe(1);
  91  |  await page.locator('.wz-header .market-avatar').click();
  92  |  await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  93  |  await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  94  |  await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  95  |  await expect(page.locator('.rst-selling-line input')).toHaveValue('1');
  96  | });
  97  |
  98  | test('deferred signed-out entry preserves login and marketplace links',async({page})=>{
  99  |  await fixture(page);await page.route('**/employment/session/**',route=>route.fulfill({status:401,json:{}}));
  100 |  await page.goto('/fr/shida/seller/restaurants/');
  101 |  await expect(page.locator('.shida-seller-landing')).toBeVisible();
  102 |  await expect(page.locator('.ssl-marketplaces a')).toHaveCount(3);
  103 |  await expect(page.locator('.ssl-entry').getByRole('button',{name:/WhatsApp/i})).toBeVisible();
  104 |  await expect(page.locator('.rst-management')).toHaveCount(0);
  105 | });
  106 |
  107 | test('deferred protected receipt keeps its canonical destination and terms',async({page})=>{
  108 |  await fixture(page);await page.route('**/orders/ROD_receipt/receipt/**',route=>route.fulfill({json:{order_ref:'ROD_receipt',state:'accepted',entry_source:'counter',fulfillment_method:'takeaway',submitted_at:at,receipt_terms:{establishment_name:'Chez maman',currency:'CDF',order_total:'3000',food_subtotal:'3000',delivery_fee:null,standalone:[{key:'line',name:'Pondu',quantity:1,sale_unit_label:'assiette',subtotal:'3000'}],plates:[]}}}));
  109 |  await page.goto('/fr/shida/seller/restaurants/RST_0/receipts/ROD_receipt/');
  110 |  await expect(page.getByRole('heading',{name:/Chez maman/})).toBeVisible();
  111 |  await expect(page.locator('.rst-selling-reference')).toContainText('ROD_receipt');
  112 |  await expect(page.locator('.rst-details')).toContainText('3000 CDF');
  113 |  await expect(page.locator('.rst-management')).toHaveCount(0);
  114 | });
  115 |
```
