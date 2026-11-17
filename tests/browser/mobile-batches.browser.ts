import {test,expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import {fixture as personal} from './mobile-batch-personal-fixture';
import {fixture as today} from './mobile-batch-today-fixture';
import {seed,enter} from './mobile-batch-menu-fixture';
import {setup} from './mobile-batch-pos-fixture';
import {managementNavigation} from './restaurant-management-navigation';
const dir='C:/NIHILOBA/release-evidence/mobile-batches-20261117';
const phase=process.env.SHIDA_EVIDENCE_PHASE||'after';
test('personal matched evidence',async({page})=>{
 await mkdir(dir,{recursive:true});await personal(page);await page.setViewportSize({width:390,height:844});
 for(const view of ['transactions','messages','settings','questions','management','listings&tab=article','manage']){
  await page.goto('/fr/shida/space?view='+view);await expect(page.locator('.space-content')).toBeVisible();
  await expect(page.getByText('Chargement…',{exact:true})).toHaveCount(0);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:`${dir}/${phase}-${view.replace('&tab=','-')}-390.png`});
 }
});
test('today matched evidence',async({page})=>{
 const state=await today(page);await page.setViewportSize({width:390,height:844});
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_test&tab=today');
 await expect(page.locator('.rst-operations')).toBeVisible();await expect(page.getByText(/185.?000/).first()).toBeVisible();
 await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.screenshot({path:`${dir}/${phase}-today-390.png`});
 state.moneyFailure=503;state.readyFailure=true;await page.locator('.rst-ops-heading').getByRole('button',{name:/Actualiser/}).click();
 await expect(page.locator('.rst-operations').getByText(/indisponibles/i).first()).toBeVisible();await page.screenshot({path:`${dir}/${phase}-today-partial-390.png`});
});
test('menu matched evidence',async({page})=>{
 await seed(page);await page.setViewportSize({width:390,height:844});await enter(page);await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
 await page.screenshot({path:`${dir}/${phase}-menu-390.png`});
});
test('pos matched evidence',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page);await page.screenshot({path:`${dir}/${phase}-pos-empty-390.png`});
 await page.getByRole('button',{name:'Ajouter Poisson grillé',exact:true}).click();await expect(page.locator('.rst-selling-mobile-summary')).toBeVisible();
 await page.screenshot({path:`${dir}/${phase}-pos-cart-390.png`});
});
for(const width of [320,375,390,430,820,1440])test(`compact layouts and touch actions ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});await seed(page);await enter(page);
 const toggle=page.getByRole('switch',{name:/Disponibilité/});await expect(toggle).toHaveAttribute('aria-checked','true');await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('.rst-menu-form')).toHaveCount(0);
 await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','true');
 await page.locator('.rst-menu-filter-panel summary').click();await page.locator('.rst-menu-filters select').selectOption('hidden');await expect(page.locator('.rst-menu-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Effacer les filtres'}).click();await expect(page.locator('.rst-menu-card')).toHaveCount(1);
 await page.locator('.rst-menu-filters input').fill('no match');await expect(page.locator('.rst-menu-card')).toHaveCount(0);await page.locator('.rst-menu-filters input').fill('');await expect(page.locator('.rst-menu-card')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.locator('.rst-menu-row-actions').getByRole('button',{name:'Modifier',exact:true}).click();await expect(page.locator('.rst-menu-form')).toBeVisible();
});
test('availability retries the same uncertain command and respects blockers',async({page})=>{
 const state=await seed(page);state.lost='enable';await enter(page);const toggle=page.getByRole('switch');await toggle.click();
 await expect(toggle).toContainText('Réessayer');await expect(toggle).toHaveAttribute('aria-checked','true');await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');
 expect(state.writes).toHaveLength(2);expect(state.writes[0].body).toEqual(state.writes[1].body);
 state.items[0].enable_blocker='sold_out';state.items[0].menu_state='sold_out';await page.reload();await expect(toggle).toBeDisabled();
});
for(const width of [320,375,390,430,820,1440])test(`POS quantities, review and preserved navigation ${width}`,async({page})=>{
 await page.setViewportSize({width,height:844});const state=await setup(page);await expect(page.locator('.rst-selling-mobile-summary')).toHaveCount(0);
 const add=page.getByRole('button',{name:'Ajouter Poisson grillé',exact:true});await add.click();await add.click();await add.click();
 const tile=page.locator('.rst-selling-item').filter({has:add});await expect(tile.locator('.rst-tile-controls>span')).toHaveText('3');
 await tile.getByRole('button',{name:/Diminuer/}).click();await expect(tile.locator('.rst-tile-controls>span')).toHaveText('2');
 expect(state.writes.filter(w=>w.path.endsWith('/counter-baskets'))).toHaveLength(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await managementNavigation(page,'Mon menu');await expect(page.locator('.rst-menu-workspace')).toBeVisible();await managementNavigation(page,'Vendre');await expect(tile.locator('.rst-tile-controls>span')).toHaveText('2');
 if(width<=700)await page.locator('.rst-selling-mobile-summary').click();await expect(page.locator('.rst-selling-line')).toContainText('Poisson grillé');
 expect(state.writes.filter(w=>/prepare|receipts/.test(w.path))).toHaveLength(0);
});
for(const width of [320,375,390,430])test(`personal section title and sales destination ${width}`,async({page})=>{
 await personal(page);await page.setViewportSize({width,height:844});
 for(const view of ['management','listings','job-search','transactions','messages','settings','questions']){
  await page.goto('/fr/shida/space?view='+view);const summary=page.locator('.space-section-selector>summary');await expect(summary).toBeVisible();
  expect(await summary.evaluate(el=>getComputedStyle(el).fontWeight)).toBe('400');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.goto('/fr/shida/space?view=listings&tab=article');await page.locator('.qs-orders-link').click();await expect(page.locator('.tx-roles [aria-pressed=true]')).toContainText('Mes ventes personnelles');
 await expect(page.locator('.tx-overview')).not.toContainText('ne peuvent pas être chargées');await expect(page).toHaveURL(/view=transactions&role=seller/);
 await page.reload();await expect(page.locator('.tx-roles [aria-pressed=true]')).toContainText('Mes ventes personnelles');await page.goBack();await expect(page.locator('.qs-listing-card')).toBeVisible();
});
test('enlarged text keeps controls in view and categories reachable',async({page})=>{
 await page.setViewportSize({width:320,height:844});await seed(page);await enter(page);await page.addStyleTag({content:'html{font-size:24px!important}.rst-menu-workspace button,.rst-menu-workspace summary{font-size:24px!important}'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.getByRole('switch').click();await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
 const category=page.locator('.rst-menu-categories button').last();await category.click();await expect(category).toHaveAttribute('aria-pressed','true');await page.screenshot({path:`${dir}/after-menu-enlarged-320.png`,fullPage:true});
});
test('dashboard serializes reads, preserves stale figures and retries without false zero',async({page})=>{
 const state=await today(page);let inFlight=0,maximum=0;
 await page.route('**/RST_test/**',async route=>{const path=new URL(route.request().url()).pathname;if(path.endsWith('/capabilities'))return route.fallback();inFlight++;maximum=Math.max(maximum,inFlight);await new Promise(resolve=>setTimeout(resolve,40));await route.fallback();inFlight--;});
 await page.goto('/fr/shida/seller/restaurants/?establishment=RST_test&tab=today');await expect(page.locator('.rst-ops-updated')).toBeVisible();expect(maximum).toBe(1);
 const stamp=await page.locator('.rst-ops-updated').innerText();state.moneyFailure=503;state.readyFailure=true;await page.getByRole('button',{name:'Actualiser',exact:true}).click();await expect(page.locator('.rst-ops-partial')).toBeVisible();
 await expect(page.locator('.rst-ops-money')).toContainText('185 000');await expect(page.locator('.rst-ops-money')).toContainText('plus à jour');await expect(page.locator('.rst-ops-incomplete')).toBeVisible();await expect(page.locator('.rst-ops-updated')).toHaveText(stamp);
 state.moneyFailure=0;await page.locator('.rst-ops-money').getByRole('button',{name:'Réessayer'}).click();await expect(page.locator('.rst-ops-money .rst-ops-error')).toHaveCount(0);await expect(page.locator('.rst-metric-preparing .rst-ops-error')).toBeVisible();
 state.moneyFailure=403;await page.getByRole('button',{name:'Actualiser',exact:true}).click();await expect(page.locator('.rst-ops-money')).not.toContainText('185 000');await expect(page.locator('.rst-ops-money')).toContainText('pas accès');
});

test('empty mobile basket can recover an uncertain creation without a duplicate command',async({page})=>{
 await page.setViewportSize({width:390,height:844});await setup(page);
 const commands:unknown[]=[];let first=true;
 await page.route('**/counter-baskets/',async route=>{
  if(route.request().method()!=='POST')return route.fallback();
  commands.push(route.request().postDataJSON());
  if(first){first=false;return route.abort();}
  return route.fallback();
 });
 const add=page.getByRole('button',{name:'Ajouter Poisson grillé',exact:true});await add.click();
 const retry=page.locator('.rst-selling-create-retry');await expect(retry).toBeVisible();await retry.click();
 await expect(retry).toHaveCount(0);await expect(add).toBeEnabled();await add.click();
 await expect(page.locator('.rst-selling-mobile-summary')).toBeVisible();
 expect(commands).toHaveLength(2);expect(commands[0]).toEqual(commands[1]);
});
