# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: restaurant-panel-recovery.browser.ts >> application rendering defects are not disguised as recoverable downloads
- Location: tests\browser\restaurant-panel-recovery.browser.ts:204:6

# Error details

```
TypeError: expect(received).toHaveLength(expected)

Matcher error: received value must have a length property whose value must be a number

Received has value: null
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /This page couldn.t load/ })
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: /This page couldn.t load/ }) with timeout 5000ms
  - waiting for getByRole('heading', { name: /This page couldn.t load/ })
  - Test ended.

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
    - region "Restaurants & Malewa":
      - complementary:
        - strong: Chez maman — Restaurant & Malewa de la commune de Limete
        - navigation "Restaurants & Malewa":
          - button "Aujourd’hui"
          - button "Vendre"
          - button "Commandes"
          - button "Mon menu"
          - button "Mon stock"
          - button "Réservations"
          - button "Finances"
          - button "Statistiques"
          - button "Avis clients"
          - button "Mon établissement"
      - button "Plein écran"
      - group: ⋮
      - status: Chargement…
- alert
```

# Test source

```ts
  116 |   await page.waitForTimeout(1200);expect(state.attempts).toBe(requestsPerFailure*2);await shell(page);
  117 |   // Represents a document reload obtaining assets from the current deployment;
  118 |   // this is not a production rolling-deploy/CDN test.
  119 |   state.fail=false;let documents=0;page.on('request',request=>{if(request.resourceType()==='document')documents++;});
  120 |   await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  121 |   await expect(page.locator('.rst-orders-screen')).toBeVisible();expect(documents).toBe(1);
  122 |   await expect(page).toHaveURL(/establishment=RST_0.*tab=orders/);
  123 |  });
  124 |
  125 |  test('leave a failed destination without downloading it again',async({page})=>{
  126 |   await restaurantPanelFixture(page);await page.setViewportSize({width:390,height:900});await today(page);
  127 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  128 |   await page.locator('.rst-panel-recovery').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  129 |   await expect(page.locator('.rst-ops-updated')).toBeVisible();
  130 |   await managementNavigation(page,'Mon menu');await expect(page.locator('.rst-menu-workspace')).toContainText('Pondu');
  131 |   await managementNavigation(page,'Commandes');await expect(page.locator('.rst-panel-recovery')).toBeVisible();
  132 |   expect(state.attempts).toBe(requestsPerFailure);
  133 |  });
  134 |
  135 |  test('counter basket survives another panel failure and cancelled full reload',async({page})=>{
  136 |   await restaurantPanelFixture(page);await page.setViewportSize({width:1440,height:900});
  137 |   const basket={basket_ref:'RBA_draft',revision:1,quote:null,quote_ref:null,order_ref:null};let creates=0;
  138 |   await page.route('**/RST_0/pos/**',route=>{
  139 |    const p=new URL(route.request().url()).pathname.replace(/\/$/,'');
  140 |    if(p.endsWith('/pos'))return route.fulfill({json:{intake_released:true,items:[{public_ref:'RMI_1',name:'Pondu',pricing_model:'UNIT_PRICED',currency:'CDF',unit_price:'3000',sale_unit_label:'assiette',availability:'available',presentation:'fixed_dish',counter_options:{portions:[],extras:[]}}],recent:[]}});
  141 |    if(p.endsWith('/counter-unpaid'))return route.fulfill({json:{items:[],total:0,has_more:false}});
  142 |    if(p.endsWith('/counter-baskets')){if(route.request().method()==='POST'){creates++;return route.fulfill({json:basket});}return route.fulfill({json:{items:[],total:0,has_more:false}});}
  143 |    if(p.endsWith('/RBA_draft'))return route.fulfill({json:basket});
  144 |    return route.fallback();
  145 |   });
  146 |   await today(page);await managementNavigation(page,'Vendre');
  147 |   await page.getByRole('button',{name:'Ajouter Pondu',exact:true}).click();
  148 |   await page.locator('.rst-selling-line input').fill('3');
  149 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  150 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  151 |   await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  152 |   await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  153 |   await recovery.getByRole('button',{name:'Recharger la page',exact:true}).click();
  154 |   await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  155 |   await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  156 |   await expect(recovery.getByRole('button',{name:'Réessayer',exact:true})).toBeEnabled();
  157 |   state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  158 |   await expect(page.locator('.rst-orders-screen')).toBeVisible();
  159 |   await managementNavigation(page,'Vendre');await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  160 |   expect(creates).toBe(1);
  161 |   await page.locator('.wz-header .market-avatar').click();
  162 |   await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  163 |   await expect(page.getByRole('dialog')).toContainText('Quitter ce formulaire');
  164 |   await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  165 |   await expect(page.locator('.rst-selling-line input')).toHaveValue('3');
  166 |  });
  167 |
  168 |  for(const action of ['navigate','switch','logout'] as const)test(`late download completion cannot undo ${action}`,async({page})=>{
  169 |   const account=await restaurantPanelFixture(page,2);await page.setViewportSize({width:390,height:900});await today(page);
  170 |   const state=await failDownload(page);await managementNavigation(page,'Commandes');
  171 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();
  172 |   let release!:()=>void;state.release=new Promise<void>(resolve=>{release=resolve;});state.fail=false;
  173 |   try{
  174 |    await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  175 |    await expect.poll(()=>state.attempts).toBe(requestsPerFailure+1);await expect(page.locator('.rst-panel-loading')).toBeVisible();
  176 |    if(action==='navigate')await managementNavigation(page,'Aujourd’hui');
  177 |    if(action==='switch'){
  178 |     await page.locator('.rst-restaurant-identity:visible button').click();
  179 |     await page.locator('.rst-grid .rst-card').filter({has:page.getByRole('heading',{name:'Restaurant 2',exact:true})}).getByRole('button').click();
  180 |    }
  181 |    if(action==='logout'){
  182 |     await page.locator('.wz-header .market-avatar').click();
  183 |     await page.locator('.auth-account-menu').getByRole('button',{name:/déconnexion|déconnecter/i}).click();
  184 |     await expect.poll(()=>account.logout).toBe(true);
  185 |    }
  186 |    release();await page.waitForTimeout(300);
  187 |    await expect(page.locator('.rst-orders-screen')).toHaveCount(0);
  188 |    if(action==='logout')await expect(page.getByText(managementCopy.fr.signedOut,{exact:true})).toBeVisible();
  189 |    else {await expect(page.locator('.rst-today')).toBeVisible();if(action==='switch')await expect(page.locator('.management-restaurant-context')).toContainText('Restaurant 2');}
  190 |   }finally{release();}
  191 |  });
  192 |
  193 |  test('narrow enlarged-text recovery controls remain reachable',async({page})=>{
  194 |   await restaurantPanelFixture(page);await page.setViewportSize({width:320,height:900});await today(page);
  195 |   await page.addStyleTag({content:'html{font-size:32px!important}'});
  196 |   await failDownload(page);await managementNavigation(page,'Commandes');
  197 |   const recovery=page.locator('.rst-panel-recovery');await expect(recovery).toBeVisible();await shell(page);
  198 |   for(const button of await recovery.getByRole('button').all()){
  199 |    await button.scrollIntoViewIfNeeded();const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
  200 |    const nav=await page.locator('.management-mobile-nav').boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(nav!.y);
  201 |   }
  202 |  });
  203 |
  204 |  test('application rendering defects are not disguised as recoverable downloads',async({page})=>{
  205 |   await restaurantPanelFixture(page);await today(page);
  206 |   const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  207 |   await page.route('**'+chunkFor('rst-orders-screen'),async route=>{
  208 |    const response=await route.fetch(),body=await response.text();
  209 |    // Inject a render exception into the actual compiled Orders function, after a
  210 |    // successful script download. This is deliberately not an API-error fixture.
  211 |    const signature=/function [\w$]+\(\{path:[^}]+onIntake:[^}]+\}\)\{/g;
  212 |    expect(body.match(signature)).toHaveLength(1);
  213 |    await route.fulfill({response,body:body.replace(signature,'$&throw new Error("Synthetic panel render defect");')});
  214 |   });
  215 |   await managementNavigation(page,'Commandes');
> 216 |   await expect(page.getByRole('heading',{name:/This page couldn.t load/})).toBeVisible();
      |                                                                            ^ Error: expect(locator).toBeVisible() failed
  217 |   await expect(page.locator('.rst-panel-recovery')).toHaveCount(0);
  218 |   expect(errors).toContain('Synthetic panel render defect');
  219 |  });
  220 |
  221 |  test('shared editor remains mounted when its hours module fails',async({page})=>{
  222 |   await restaurantPanelFixture(page);await page.setViewportSize({width:1440,height:900});await today(page);
  223 |   await managementNavigation(page,sellerDesignCopy.fr.hours);
  224 |   await expect(page.locator('.rst-hours-overview')).toBeVisible();
  225 |   const state=await failDownload(page,'rst-week-editor');
  226 |   await page.locator('.rst-hours-overview').getByRole('button',{name:restaurantText('fr','edit'),exact:true}).click();
  227 |   const editor=page.locator('.rst-editor'),recovery=page.locator('.rst-panel-recovery');
  228 |   await expect(recovery).toBeVisible();await expect(editor).toBeVisible();
  229 |   await editor.getByRole('button',{name:restaurantText('fr','addClosure'),exact:true}).click();
  230 |   const field=editor.locator('input[type="datetime-local"]').first();
  231 |   await field.fill('2026-12-01T09:00');
  232 |   state.fail=false;await recovery.getByRole('button',{name:'Réessayer',exact:true}).click();
  233 |   await expect(page.locator('.rst-week-editor')).toBeVisible();
  234 |   await expect(field).toHaveValue('2026-12-01T09:00');
  235 |   await page.locator('#restaurant-navigation').getByRole('button',{name:'Aujourd’hui',exact:true}).click();
  236 |   await expect(page.getByRole('dialog')).toBeVisible();
  237 |   await page.getByRole('button',{name:'Rester ici',exact:true}).click();
  238 |   await expect(field).toHaveValue('2026-12-01T09:00');
  239 |  });
  240 | }
  241 |
  242 |
```
