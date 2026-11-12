import {expect,test,type BrowserContext} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {overviewCopy} from '../../app/lib/activity-overview-copy';

async function signIn(context:BrowserContext,kind:string){
 await context.addCookies([{name:'nihiloba_personal_session',value:'activities-acceptance-'+kind+'-session',domain:'127.0.0.1',path:'/'}]);
}
const evidence=process.env.ACTIVITIES_EVIDENCE_DIR;
for(const [lang,width] of [['fr',1536],['fr',390],['en',390],['ln',390],['sw',390]] as const)test('owned activities and exact destinations '+lang+' '+width,async({context,page})=>{
 await signIn(context,'overview');
 const prefix=lang==='en'?'':'/'+lang,overview=prefix+'/shida/space?view=overview';
 await page.setViewportSize({width,height:width===390?844:960});await page.goto(overview);
 const panel=page.locator('.activity-overview');
 const shop=panel.locator('button[data-kind=shop]');
 await expect(shop).toContainText(overviewCopy[lang].shop[1].replace('{n}','2'));
 await shop.focus();await page.keyboard.press('Enter');const choices=panel.locator('#overview-shop');
 await expect(choices.locator('li')).toHaveCount(2);
 if(width===390){
   const box=await choices.boundingBox(),next=await panel.locator('[data-kind=malewa]').boundingBox();
   expect(box!.y+box!.height).toBeLessThanOrEqual(next!.y);
 }
 if(lang==='fr'&&evidence){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(evidence,width===390?'overview-mobile.png':'overview-desktop.png'),fullPage:false,animations:'disabled'});}
 const second=choices.getByRole('link').nth(1),name=await second.locator('strong').innerText();
 const expectedRef=new URL((await second.getAttribute('href'))!,'http://localhost').searchParams.get('store');
 expect(expectedRef).toBeTruthy();await second.click();await expect(page).toHaveURL(new RegExp('store='+expectedRef));
 const selector=page.locator('.wz-store-selector select');await expect(selector).toHaveValue(expectedRef!);await expect(selector.locator('option:checked')).toHaveText(name);
 await page.goBack();await expect(shop).toBeVisible({timeout:15000});
 for(const [kind,record] of [['malewa','Malewa Mama Rose'],['profile','Électricité à domicile'],['job','Vendeur en boutique']] as const){
   const link=panel.locator('a[data-kind='+kind+']');await expect(link).toContainText(record);await expect(link).toContainText(overviewCopy[lang][kind][0]);
   const href=(await link.getAttribute('href'))!;expect(href.startsWith(prefix+'/shida/')).toBe(true);
   await link.click();await expect(page).toHaveURL(url=>url.pathname.replace(/\/$/,'')===href.split('?')[0]&&[...new URLSearchParams(href.split('?')[1])].every(([k,v])=>url.searchParams.get(k)===v));
   if(kind==='job')await expect(page.locator('.mission-card h2')).toHaveText(record);
   if(kind==='malewa')await expect(page.getByText(record,{exact:true}).first()).toBeVisible();
   if(kind==='profile')await expect(page.getByText(/Installation|Réparation/).first()).toBeVisible();
   await page.goBack();await expect(shop).toBeVisible({timeout:15000});
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const kind of ['empty','one','properties'])test('overview '+kind,async({context,page})=>{
 await signIn(context,kind);await page.goto('/fr/shida/space?view=overview');const main=page.locator('.activity-overview');
 if(kind==='empty'){await expect(main.locator('.overview-welcome')).toBeVisible();await expect(main.locator('.overview-card')).toHaveCount(0);await expect(main.getByRole('link',{name:'Explorer les marchés'})).toBeVisible();}
 if(kind==='one'){const link=main.locator('a[data-kind=shop]');await expect(link).toContainText('Acceptance Boutique');await link.click();await expect(page.getByText('Acceptance Boutique',{exact:true}).first()).toBeVisible();}
 if(kind==='properties'){await expect(main.getByRole('link',{name:'Ma recherche d’emploi'})).toHaveAttribute('href',/view=job-search/);await main.locator('button[data-kind=apartment]').click();const link=main.locator('#overview-apartment a').filter({hasText:'Résidence du parc'});await expect(link).toContainText('Lemba');await link.click();await expect(page.locator('h2').filter({hasText:'Résidence du parc'})).toContainText('APT_overview1');}
});

test('a failed request never shows the new-account welcome',async({context,page})=>{
 await signIn(context,'empty');
 await page.route('**/personal/apartments/manage/**',route=>route.fulfill({status:503,json:{}}));
 await page.goto('/fr/shida/space?view=overview');
 await expect(page.locator('.activity-overview [role=alert]')).toBeVisible();
 await expect(page.locator('.overview-welcome')).toHaveCount(0);
});
