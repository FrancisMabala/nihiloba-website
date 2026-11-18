# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restaurant-panel-recovery.browser.ts >> failed orders download retries in place 390
- Location: tests\browser\restaurant-panel-recovery.browser.ts:68:74

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Aller au contenu" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - link "Accueil NIHILOBA" [ref=e8] [cursor=pointer]:
            - /url: /fr
            - text: NIHILOBA
          - link "SHIDA Restaurants" [ref=e9] [cursor=pointer]:
            - /url: /fr/shida/restaurants
            - text: SHIDA
            - generic [ref=e10]: Restaurants
        - generic [ref=e11]:
          - button "Langue" [ref=e13] [cursor=pointer]: FR
          - button "Mon compte SHIDA · Francis Mabala" [ref=e15] [cursor=pointer]: FM
      - group [ref=e16]:
        - region "Restaurants & Malewa" [ref=e17]:
          - generic [ref=e19]:
            - generic [ref=e20]:
              - generic [ref=e22]:
                - generic [aria-hidden] [ref=e24]: C
                - strong [ref=e25]: Chez maman — Restaurant & Malewa de la commune de Limete
              - group [ref=e28]:
                - generic "Autres actions" [ref=e29] [cursor=pointer]: ⋮
            - navigation "Navigation de l’activité" [ref=e30]:
              - button "Aujourd’hui" [ref=e31] [cursor=pointer]
              - button "Commandes" [ref=e35] [cursor=pointer]
              - button "Vendre" [ref=e39] [cursor=pointer]
              - button "Plus" [ref=e43] [cursor=pointer]
            - alert [active] [ref=e49]:
              - heading "Cette rubrique n’a pas pu se charger." [level=2] [ref=e50]
              - paragraph [ref=e51]: Réessayez ou revenez à votre espace.
              - generic [ref=e52]:
                - button "Réessayer" [ref=e53] [cursor=pointer]
                - button "Aujourd’hui" [ref=e54] [cursor=pointer]
  - alert [ref=e55]
```

# Test source

```ts
  1   | import {test,expect,type Page} from '@playwright/test';
  2   | import {mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
  3   | import {join} from 'node:path';
  4   | import {restaurantPanelFixture} from './restaurant-panel-fixtures';
  5   | import {managementNavigation} from './restaurant-management-navigation';
  6   | import {restaurantPanelRecoveryCopy} from '../../app/lib/restaurant-panel-recovery-copy';
  7   | import {managementCopy} from '../../app/lib/restaurant-management-copy';
  8   | import {sellerDesignCopy} from '../../app/lib/restaurant-seller-design-copy';
  9   | import {workflowText} from '../../app/lib/restaurant-workflow-copy';
  10  | import {workText} from '../../app/lib/restaurant-work-copy';
  11  | import {restaurantText} from '../../app/lib/restaurant-seller-copy';
  12  |
  13  | type Locale=keyof typeof restaurantPanelRecoveryCopy;
  14  | const destinations=[
  15  |  {tab:'orders',marker:'rst-orders-screen',name:(locale:Locale)=>workText(locale,'orders')},
  16  |  {tab:'items',marker:'rst-menu-workspace',name:(locale:Locale)=>sellerDesignCopy[locale].menu},
  17  |  {tab:'daily',marker:'rst-daily',name:(locale:Locale)=>workflowText(locale,'finances')},
  18  | ] as const;
  19  |
  20  | function chunkFor(marker:string){
  21  |  const root=join(process.cwd(),'.next','static','chunks');
  22  |  const matches=readdirSync(root,{recursive:true}).map(String).filter(file=>file.endsWith('.js')&&readFileSync(join(root,file),'utf8').includes(marker));
  23  |  expect(matches,`unique production panel chunk for ${marker}`).toHaveLength(1);
  24  |  return '/_next/static/chunks/'+matches[0].replaceAll('\\','/');
  25  | }
  26  |
  27  | async function today(page:Page,locale:Locale='fr'){
  28  |  await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/restaurants/?establishment=RST_0&tab=today`);
  29  |  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  30  |  await expect(page.locator('.rst-today-refresh')).toBeEnabled();
  31  | }
  32  | async function failDownload(page:Page,marker='rst-orders-screen',status=0){
  33  |  const path=chunkFor(marker),state={attempts:0,fail:true,release:null as null|Promise<void>};
  34  |  await page.route('**'+path,async route=>{
  35  |   state.attempts++;
  36  |   if(state.release)await state.release;
  37  |   if(!state.fail)return route.continue();
  38  |   return status?route.fulfill({status,contentType:'text/plain',body:'Synthetic unavailable asset'}):route.abort('failed');
  39  |  });
  40  |  return state;
  41  | }
  42  | async function shell(page:Page){
  43  |  await expect(page.locator('.wz-header')).toBeVisible();
  44  |  await expect(page.locator('.rst-restaurant-identity:visible strong').first()).toContainText('Chez maman');
  45  |  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  46  | }
  47  |
  48  | if(process.env.PANEL_RECOVERY_BASELINE==='1')for(const width of [390,1440])test(`baseline actual Orders chunk failure ${width}`,async({page})=>{
  49  |  await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});
  50  |  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  51  |  await page.goto('/fr/shida/seller/restaurants/?establishment=RST_0&tab=today');
  52  |  await expect(page.locator('.rst-ops-updated')).toBeVisible();
  53  |  const path=chunkFor('rst-orders-screen');let attempts=0;let fail=true;
  54  |  await page.route('**'+path,route=>{attempts++;return fail?route.abort('failed'):route.continue();});
  55  |  await page.locator('.rst-metric-incoming > button').click();
  56  |  await expect.poll(()=>attempts).toBe(1);
  57  |  await expect(page.getByText(/This page couldn.t load/)).toBeVisible();
  58  |  fail=false;await page.waitForTimeout(1000);
  59  |  await expect(page.locator('.rst-management')).toHaveCount(0);
  60  |  const output=process.env.PERF_OUTPUT!;mkdirSync(output,{recursive:true});
  61  |  await page.screenshot({path:join(output,`download-failed-${width}.png`),fullPage:true});
  62  |  const observation={width,path,attempts,errors,headerVisible:await page.locator('.wz-header').count(),workspaceVisible:await page.locator('.rst-management').count(),retryButtons:await page.getByRole('button').allTextContents(),restoredDownloadDidNotRecover:await page.getByText(/This page couldn.t load/).isVisible()};
  63  |  writeFileSync(join(output,`download-failed-${width}.json`),JSON.stringify(observation,null,2));
  64  |  await page.reload();await expect(page.locator('.rst-orders-screen')).toBeVisible();
  65  | });
  66  |
  67  | if(process.env.PANEL_RECOVERY_BASELINE!=='1'){
  68  |  for(const width of [390,1440])for(const destination of destinations)test(`failed ${destination.tab} download retries in place ${width}`,async({page})=>{
  69  |   await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});
  70  |   const scripts:string[]=[];page.on('request',request=>{if(request.resourceType()==='script')scripts.push(new URL(request.url()).pathname);});
  71  |   await today(page);expect(scripts).not.toContain(chunkFor(destination.marker));
  72  |   const state=await failDownload(page,destination.marker);
  73  |   await managementNavigation(page,destination.name('fr'));
  74  |   const recovery=page.locator('.rst-panel-recovery');
  75  |   await expect(recovery).toContainText(restaurantPanelRecoveryCopy.fr.title);
  76  |   await expect(recovery).toBeFocused();await shell(page);
  77  |   await expect(recovery).not.toContainText(/chunk|\.js|offline|hors ligne/i);
> 78  |   await page.waitForTimeout(800);expect(state.attempts).toBe(1);
      |                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  79  |   if(process.env.PERF_OUTPUT&&destination.tab==='orders'){
  80  |    mkdirSync(process.env.PERF_OUTPUT,{recursive:true});
  81  |    await page.screenshot({path:join(process.env.PERF_OUTPUT,`download-failed-${width}.png`),fullPage:true});
  82  |   }
  83  |   state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  84  |   await expect(page.locator(`.${destination.marker}`)).toBeVisible();
  85  |   await expect(recovery).toHaveCount(0);expect(state.attempts).toBe(2);
  86  |   if(destination.tab==='items')await expect(page.locator('.rst-menu-workspace')).toContainText('Pondu, poisson et accompagnement au choix');
  87  |   if(destination.tab==='daily')await expect(page.locator('[data-metric=received] strong')).toContainText('3');
  88  |   if(destination.tab==='orders')await expect(page.locator('.rst-orders-screen')).toContainText('Aucune commande à traiter');
  89  |   await managementNavigation(page,managementCopy.fr.work);await expect(page.locator('.rst-ops-updated')).toBeVisible();
  90  |   await managementNavigation(page,destination.name('fr'));await expect(page.locator(`.${destination.marker}`)).toBeVisible();
  91  |   expect(state.attempts).toBe(2);await shell(page);
  92  |  });
  93  |
  94  |  for(const locale of ['en','ln','sw'] as const)for(const width of [390,1440])test(`localized keyboard recovery ${locale} ${width}`,async({page})=>{
  95  |   await restaurantPanelFixture(page);await page.setViewportSize({width,height:900});await today(page,locale);
  96  |   const state=await failDownload(page);await managementNavigation(page,workText(locale,'orders'));
  97  |   const recovery=page.locator('.rst-panel-recovery'),copy=restaurantPanelRecoveryCopy[locale];
  98  |   await expect(recovery).toContainText(copy.title);await expect(recovery).toBeFocused();
  99  |   await page.keyboard.press('Tab');await expect(recovery.getByRole('button',{name:copy.retry,exact:true})).toBeFocused();
  100 |   await page.keyboard.press('Enter');await expect(recovery).toContainText(copy.reloadHelp);
  101 |   await expect(recovery.getByRole('button',{name:copy.reload,exact:true})).toBeVisible();
  102 |   state.fail=false;await recovery.getByRole('button',{name:copy.retry,exact:true}).click();await expect(page.locator('.rst-orders-screen')).toBeVisible();
  103 |   expect(state.attempts).toBe(3);await shell(page);
  104 |  });
  105 |
  106 |  test('repeated unavailable asset has no request storm and offers deliberate reload',async({page})=>{
  107 |   await restaurantPanelFixture(page);await page.setViewportSize({width:390,height:900});await today(page);
  108 |   const state=await failDownload(page,'rst-orders-screen',404);await managementNavigation(page,'Commandes');
  109 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  110 |   await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  111 |   await expect(recovery.getByRole('button',{name:'Recharger la page',exact:true})).toBeVisible();
  112 |   await expect(recovery).toContainText('modifications non enregistrées');
  113 |   await page.waitForTimeout(1200);expect(state.attempts).toBe(2);await shell(page);
  114 |   // Represents a document reload obtaining assets from the current deployment;
  115 |   // this is not a production rolling-deploy/CDN test.
  116 |   state.fail=false;let documents=0;page.on('request',request=>{if(request.resourceType()==='document')documents++;});
  117 |   await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  118 |   await expect(page.locator('.rst-orders-screen')).toBeVisible();expect(documents).toBe(1);
  119 |   await expect(page).toHaveURL(/establishment=RST_0.*tab=orders/);
  120 |  });
  121 |
  122 |  test('leave a failed destination without downloading it again',async({page})=>{
  123 |   await restaurantPanelFixture(page);await page.setViewportSize({width:390,height:900});await today(page);
  124 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  125 |   await page.locator('.rst-panel-recovery').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  126 |   await expect(page.locator('.rst-ops-updated')).toBeVisible();
  127 |   await managementNavigation(page,'Mon menu');await expect(page.locator('.rst-menu-workspace')).toContainText('Pondu');
  128 |   await managementNavigation(page,'Commandes');await expect(page.locator('.rst-panel-recovery')).toBeVisible();
  129 |   expect(state.attempts).toBe(1);
  130 |  });
  131 |
  132 |  test('counter basket survives another panel failure and cancelled full reload',async({page})=>{
  133 |   await restaurantPanelFixture(page);await page.setViewportSize({width:1440,height:900});
  134 |   const basket={basket_ref:'RBA_draft',revision:1,quote:null,quote_ref:null,order_ref:null};let creates=0;
  135 |   await page.route('**/RST_0/pos/**',route=>{
  136 |    const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  137 |    if(p.endsWith('/pos'))return route.fulfill({json:{intake_released:true,items:[{public_ref:'RMI_1',name:'Pondu',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish',counter_options:{portions:[],extras:[]}}],recent:[]}});
  138 |    if(p.endsWith('/counter-unpaid'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  139 |    if(p.endsWith('/counter-baskets')){if(route.request().method()==='POST'){creates++;return route.fulfill({json:basket});}return route.fulfill({json:{items:[],total:0,has_more:false}});}
  140 |    if(p.endsWith('/RBA_draft'))return route.fulfill({json:basket});
  141 |    return route.fallback();
  142 |   });
  143 |   await today(page);await managementNavigation(page,'Vendre');
  144 |   await page.getByRole('button',{name:'Ajouter Pondu',exact:true}).click();
  145 |   await page.locator('.rst-selling-line input').fill('3');
  146 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  147 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  148 |   await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  149 |   await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  150 |   await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  151 |   await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  152 |   await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  153 |   await expect(recovery.getByRole('button',{name:'Réessayer',exact:true})).toBeEnabled();
  154 |   state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  155 |   await expect(page.locator('.rst-orders-screen')).toBeVisible();
  156 |   await managementNavigation(page,'Vendre');await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  157 |   expect(creates).toBe(1);
  158 |   await page.locator('.wz-header .market-avatar').click();
  159 |   await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  160 |   await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  161 |   await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  162 |   await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  163 |  });
  164 |
  165 |  for(const action of ['navigate','switch','logout'] as const)test(`late download completion cannot undo ${action}`,async({page})=>{
  166 |   const account=await restaurantPanelFixture(page,2);await page.setViewportSize({width:390,height:900});await today(page);
  167 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  168 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  169 |   let release!:()=>void;state.release=new Promise<void>(resolve=>{release=resolve;});state.fail=false;
  170 |   try{
  171 |    await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  172 |    await expect.poll(()=>state.attempts).toBe(2);await expect(page.locator('.rst-panel-loading')).toBeVisible();
  173 |    if(action==='navigate')await managementNavigation(page,'Aujourd’hui');
  174 |    if(action==='switch'){
  175 |     await page.locator('.rst-restaurant-identity:visible button').click();
  176 |     await page.locator('.rst-grid .rst-card').filter({has:page.getByRole('heading',{name:'Restaurant 2',exact:true})}).getByRole('button').click();
  177 |    }
  178 |    if(action==='logout'){
```
