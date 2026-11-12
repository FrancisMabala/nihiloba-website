import {test,expect,type Page} from '@playwright/test';
import {fixture} from './account-security-fixture';
import {deletionText} from '../../app/lib/account-deletion-copy';
import {deletionUx,obligationCount} from '../../app/lib/deletion-ux-copy';
import {deletionReviewText} from '../../app/lib/deletion-review-copy';
import {securityText} from '../../app/lib/account-security-copy';
const obligations=[
 {reference:'BUS_fixture1',kind:'organization_responsibilities',display_name:'Soleil Restaurant SARL',responsibility:'owner',action:'organization',action_path:'https://business.nihiloba.com/businesses/BUS_fixture1/settings'},
 {reference:'BUS_fixture2',kind:'organization_responsibilities',display_name:'Soleil Food Distribution',responsibility:'admin',action:'organization',action_path:'https://business.nihiloba.com/businesses/BUS_fixture2/settings'},
 {reference:'ROD_fixture',kind:'restaurant_order',display_name:'Restaurant de démonstration',status:'preparing',occurred_at:'2026-11-07T10:30:00Z',action:'activity',action_path:'/shida/restaurant-orders/ROD_fixture/'},
];
async function preview(page:Page,items=obligations){await page.route('**/api/shida/personal/security/delete/',route=>route.fulfill({json:{eligible:!items.length,obligations:items,retained_records:false}}));}
for(const locale of ['en','fr','ln','sw'] as const)for(const width of [390,1440])test(`compact obligations and centered error ${locale} ${width}`,async({page})=>{
 await fixture(page,true,true);let failed=false,reads=0;
 await page.route('**/api/shida/personal/security/delete/',async route=>{reads++;await new Promise(resolve=>setTimeout(resolve,150));return route.fulfill(failed?{status:503,json:{detail:'security_unavailable'}}:{json:{eligible:false,obligations,retained_records:false}});});
 await page.setViewportSize({width,height:1050});await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=settings`);await page.locator('.space-danger > summary').click();
 const zone=page.locator('#account-deletion');
 await expect(zone.getByRole('button',{name:deletionText(locale,'check'),exact:true})).toBeVisible();
 await expect(zone.getByRole('button',{name:deletionText(locale,'check'),exact:true})).toHaveCSS('background-color','rgb(6, 77, 59)');
 await expect(zone.locator('.deletion-obligations')).toHaveCount(0);await expect(zone.locator('.account-deletion-review')).toHaveCount(0);
 await expect(zone.locator('.deletion-consequences')).not.toHaveAttribute('open','');
 await zone.getByRole('button',{name:deletionText(locale,'check'),exact:true}).click();
 await expect(zone).toContainText(obligationCount(locale,3));await expect(zone).not.toContainText('BUS_');await expect(zone).not.toContainText('ROD_');
 await expect(zone.getByRole('link',{name:deletionUx(locale,'manage')}).first()).toHaveAttribute('href',`https://business.nihiloba.com/businesses/BUS_fixture1/settings?lang=${locale}`);
 await expect(zone.getByRole('link',{name:deletionUx(locale,'order')})).toHaveAttribute('href',`${locale==='en'?'':'/'+locale}/shida/restaurant-orders/ROD_fixture/`);
 await zone.scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 // Capture the page from its top so fixed offscreen skip links are not stamped
 // into a full-page screenshot at the current scroll offset.
 await page.evaluate(()=>window.scrollTo(0,0));
 await page.screenshot({path:`test-results/deletion-ux/obligations-${locale}-${width}.png`,fullPage:true});
 failed=true;const refresh=zone.getByRole('button',{name:deletionUx(locale,'refresh'),exact:true});await refresh.click();
 const dialog=page.getByRole('dialog',{name:deletionUx(locale,'unavailable')});await expect(dialog).toBeVisible();await expect(dialog).toContainText(deletionUx(locale,'noRequest'));
 const box=await dialog.boundingBox();expect(box).toBeTruthy();expect(Math.abs(box!.x+box!.width/2-width/2)).toBeLessThan(3);expect(box!.y).toBeGreaterThanOrEqual(0);expect(box!.y+box!.height).toBeLessThanOrEqual(1051);
 await expect(dialog.locator('.shida-confirmation-close')).toHaveCSS('width','44px');
 await expect(dialog.locator('.shida-confirmation-submit')).toHaveCSS('background-color','rgb(21, 63, 50)');
 await page.screenshot({path:`test-results/deletion-ux/error-${locale}-${width}.png`,fullPage:false});
 await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(refresh).toBeFocused();await expect(zone).toContainText(deletionUx(locale,'stale'));
 await expect(zone.getByRole('button',{name:deletionText(locale,'confirm'),exact:true})).toHaveCount(0);
 failed=false;await refresh.click();await expect(zone).toContainText(obligationCount(locale,3));expect(reads).toBe(3);
});
test('retry is real, bounded to one request, and keeps the modal open while unavailable',async({page})=>{
 await fixture(page);let reads=0,fail=true;
 await page.route('**/api/shida/personal/security/delete/',async route=>{reads++;await new Promise(resolve=>setTimeout(resolve,250));return route.fulfill(fail?{status:503,json:{}}:{json:{eligible:true,obligations:[],retained_records:false}});});
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:deletionText('fr','retry'),exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
 await expect(dialog).toHaveAttribute('aria-busy','true');await expect(dialog.getByRole('button',{name:deletionText('fr','retry'),exact:true})).toBeDisabled();
 await expect(dialog).toHaveAttribute('aria-busy','false');expect(reads).toBe(2);await expect(dialog).toBeVisible();
 fail=false;await dialog.getByRole('button',{name:deletionText('fr','retry'),exact:true}).click();await expect(dialog).toHaveCount(0);await expect(page.locator('#account-deletion')).toContainText(deletionText('fr','eligible'));expect(reads).toBe(3);
});
for(const code of [401,503])test(`failed eligibility and unknown request status never claim no request (${code})`,async({page})=>{
 await fixture(page);await page.route('**/api/shida/personal/security/delete/',route=>route.fulfill({status:code,json:{detail:'security_unavailable'}}));
 await page.route('**/api/shida/personal/security/delete/status/',route=>route.fulfill({status:code,json:{}}));
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog).not.toContainText(deletionUx('fr','noRequest'));
 await expect(dialog).toContainText(deletionUx('fr',code===401?'signIn':'unknown'));
 await expect(page.getByRole('button',{name:deletionText('fr','confirm'),exact:true})).toHaveCount(0);
});
test('network timeout is a technical failure, not a blocking obligation',async({page})=>{
 await fixture(page);await page.route('**/api/shida/personal/security/delete/',route=>route.abort('timedout'));
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.deletion-obligations')).toHaveCount(0);await expect(page.getByRole('button',{name:deletionText('fr','confirm'),exact:true})).toHaveCount(0);
});
test('missing name has a safe fallback and revoked permission disappears only after authoritative refresh',async({page})=>{
 await fixture(page);let resolved=false;
 await page.route('**/api/shida/personal/security/delete/',route=>route.fulfill({json:{eligible:resolved,obligations:resolved?[]:[{...obligations[0],display_name:null,action:'review',action_path:null}],retained_records:false}}));
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();const zone=page.locator('#account-deletion');await zone.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 await expect(zone.locator('.deletion-obligations')).toContainText(deletionUx('fr','organization'));await expect(zone).not.toContainText('BUS_');await expect(zone.getByRole('link',{name:deletionUx('fr','manage')})).toHaveCount(0);
 resolved=true;await zone.getByRole('button',{name:deletionUx('fr','refresh'),exact:true}).click();await expect(zone).toContainText(deletionText('fr','eligible'));await expect(zone.locator('.deletion-obligations')).toHaveCount(0);
});
test('review preserves the explanation across closing and failed rechecks, then submits selected internal references once',async({page})=>{
 const state=await fixture(page,true,true);let failed=false,submissions=0;
 await page.route('**/api/shida/personal/security/delete/',route=>route.fulfill(failed?{status:503,json:{}}:{json:{eligible:false,obligations,retained_records:false}}));
 await page.route('**/api/shida/personal/security/delete/reviews/',route=>{
  if(route.request().method()==='POST'){expect(state.proof).toBe(true);expect(route.request().postDataJSON().obligations).toEqual(['BUS_fixture1']);submissions++;return route.fulfill({json:{reference:'SCT_actual',state:'deletion_requested',created_at:'2026-11-07',updated_at:'2026-11-07'}});}
  return route.fulfill({json:{requests:[]}});
 });
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByLabel(securityText('fr','preferEmail'),{exact:true}).check();
 const zone=page.locator('#account-deletion');await zone.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();
 const open=zone.locator('.deletion-actions').getByRole('button',{name:deletionUx('fr','review'),exact:true});await open.click();
 const review=zone.locator('.account-deletion-review');await review.getByLabel('Soleil Restaurant SARL',{exact:true}).check();await review.getByRole('textbox').fill('Please review this administrator responsibility.');
 await review.getByRole('button',{name:deletionUx('fr','close'),exact:true}).click();await open.click();await expect(review.getByRole('textbox')).toHaveValue('Please review this administrator responsibility.');
 failed=true;await zone.getByRole('button',{name:deletionUx('fr','refresh'),exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(review.getByRole('textbox')).toHaveValue('Please review this administrator responsibility.');
 failed=false;await zone.getByRole('button',{name:deletionUx('fr','refresh'),exact:true}).click();await expect(review.getByRole('textbox')).toBeEnabled();
 await review.getByRole('button',{name:deletionUx('fr','reviewSelection'),exact:true}).click();await expect(review.locator('.deletion-review-summary')).toContainText('Soleil Restaurant SARL');await expect(review).not.toContainText('BUS_');
 await review.getByRole('button',{name:deletionReviewText('fr','title'),exact:true}).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
 const proof=page.getByRole('region',{name:securityText('fr','emailProof'),exact:true});await proof.getByLabel(securityText('fr','code'),{exact:true}).fill('12345678');await proof.getByRole('button',{name:securityText('fr','verify'),exact:true}).click();
 await expect(review).toContainText('SCT_actual');expect(submissions).toBe(1);await expect(review.getByRole('textbox')).toHaveCount(0);
});
test('existing clarification opens the actual private case and submits a clarification through existing support',async({page})=>{
 await fixture(page,true,true);await preview(page);let replies=0;
 await page.route('**/api/shida/personal/security/delete/reviews/',route=>route.fulfill({json:{requests:[{reference:'SCT_clarification',state:'deletion_clarification',created_at:'2026-11-07',updated_at:'2026-11-07'}]}}));
 await page.route('**/api/shida/personal/support/SCT_clarification/**',route=>{if(route.request().method()==='POST'){replies++;expect(route.request().postDataJSON()).toEqual({message:'My clarification for this request.'});}return route.fulfill({json:{ticket:{public_ref:'SCT_clarification',category:'account_deletion',message:'Please clarify your request.',status:'answered',created_at:'2026-11-07'},messages:[]}});});
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();const zone=page.locator('#account-deletion');await zone.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();await zone.locator('.deletion-actions').getByRole('button',{name:deletionUx('fr','review'),exact:true}).click();
 const review=zone.locator('.account-deletion-review');await expect(review.getByRole('textbox')).toHaveCount(0);await review.getByRole('link',{name:deletionReviewText('fr','support'),exact:true}).click();
 await expect(page).toHaveURL(/case=SCT_clarification/);await page.locator('.space-support textarea').fill('My clarification for this request.');await page.locator('.space-support form button[type="submit"]').click();await expect.poll(()=>replies).toBe(1);
});
test('an uncertain deletion write reconciles with the original proof and never starts a new confirmation',async({page})=>{
 await fixture(page,true,true);let writes=0;const proofs:string[]=[];
 const receipt={reference:'DEL_actual',status:'scheduled',scheduled_at:'2026-12-07T10:00:00Z',can_cancel:true};
 await page.route('**/api/shida/personal/security/delete/',route=>{if(route.request().method()==='GET')return route.fulfill({json:{eligible:true,obligations:[],retained_records:false}});writes++;proofs.push(route.request().postDataJSON().authorization);return writes<3?route.abort('timedout'):route.fulfill({json:receipt});});
 await page.route('**/api/shida/personal/security/delete/status/',route=>route.fulfill({status:401,json:{}}));await page.route('**/api/shida/personal/deletion/',route=>route.fulfill({status:401,json:{}}));
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByLabel(securityText('fr','preferEmail'),{exact:true}).check();await page.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();await page.getByRole('button',{name:deletionText('fr','confirm'),exact:true}).click();
 const proof=page.getByRole('region',{name:securityText('fr','emailProof'),exact:true});await proof.getByRole('textbox').fill('12345678');await proof.getByRole('button',{name:securityText('fr','verify'),exact:true}).click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog).not.toContainText(deletionUx('fr','noRequest'));await expect(page.getByRole('button',{name:deletionText('fr','confirm'),exact:true})).toHaveCount(0);
 await dialog.getByRole('button',{name:deletionUx('fr','status'),exact:true}).click();await expect(page).toHaveURL(/\/fr\/shida\/deletion\/$/);expect(writes).toBe(3);expect(new Set(proofs).size).toBe(1);
});
test('an existing scheduled deletion discovered during reconciliation opens its existing status flow',async({page})=>{
 await fixture(page);const receipt={reference:'DEL_existing',status:'scheduled',scheduled_at:'2026-12-07T10:00:00Z',can_cancel:true};
 await page.route('**/api/shida/personal/security/delete/',route=>route.fulfill({status:401,json:{}}));await page.route('**/api/shida/personal/security/delete/status/',route=>route.fulfill({json:{deletion:receipt}}));await page.route('**/api/shida/personal/deletion/',route=>route.fulfill({json:{deletion:receipt,binding:'a'.repeat(64)}}));
 await page.goto('/fr/shida/space/?view=settings');await page.locator('.space-danger > summary').click();await page.getByRole('button',{name:deletionText('fr','check'),exact:true}).click();await expect(page).toHaveURL(/\/fr\/shida\/deletion\/$/);await expect(page.getByRole('button',{name:deletionText('fr','cancel'),exact:true})).toBeVisible();
});
