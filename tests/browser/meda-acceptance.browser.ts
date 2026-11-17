import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {medaDiscoveryCopy} from '../../app/lib/meda-discovery-copy';
import {medaCopy} from '../../app/lib/meda-copy';
import {medaParticipationCopy} from '../../app/lib/meda-participation-copy';
import {mkdirSync} from 'node:fs';
const t=medaCopy.en,x=medaParticipationCopy.en;
async function identity(context:BrowserContext,kind:string){await context.addCookies([{name:'nihiloba_personal_session',value:`meda-acceptance-${kind}-session`,domain:'127.0.0.1',path:'/'}]);}
async function origin(page:Page){await page.route('**/api/shida/**',async route=>{const response=await route.fetch({headers:{...route.request().headers(),origin:'https://nihiloba.com','sec-fetch-site':'same-origin'}});await route.fulfill({response})});}
async function api(page:Page,path:string,body?:object){return page.evaluate(async({path,body})=>{const session=await fetch('/api/shida/employment/session/').then(r=>r.json());const response=await fetch('/api/shida/personal/meda/'+path,{method:body?'POST':'GET',headers:{'x-shida-session':session.binding,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()}},{path,body})}
async function acknowledge(page:Page){await page.getByRole('checkbox',{name:x.acknowledge}).check();await page.getByRole('button',{name:x.acknowledge,exact:true}).click();await page.getByRole('button',{name:x.confirm,exact:true}).click();}
test('real two-user photos, agreement, intake closure, privacy and account switching',async({browser})=>{
 const owner=await browser.newContext({viewport:{width:390,height:844}}),sender=await browser.newContext({viewport:{width:390,height:844}});
 await identity(owner,'owner');await identity(sender,'sender');const a=await owner.newPage(),b=await sender.newPage();await origin(a);await origin(b);
 await b.goto('/shida/meda/');await b.getByRole('button',{name:t.details}).click();await expect(b.getByRole('button',{name:x.send,exact:true})).toBeDisabled();
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAN0lEQVR4nO3RMQ0AMAzEQLf8OacQ3CWbD8BHcg4Mm+7qOh340A9UiVSJVIlUiVSJVIlUiVSJMA+hxgE/8m7SpQAAAABJRU5ErkJggg==','base64');
 const uploaded=b.waitForResponse(r=>r.url().endsWith('/meda/photos/')&&r.request().method()==='POST');
 await b.locator('input[type=file]').setInputFiles({name:'books.png',mimeType:'image/png',buffer:png});
 const photoResponse=await uploaded;expect(photoResponse.status(),JSON.stringify(await photoResponse.json())).toBe(200);await expect(b.getByRole('button',{name:x.send,exact:true})).toBeEnabled();
 await b.getByLabel(x.contents,{exact:true}).fill('Printed books shown in the photo');await b.getByLabel(x.weight,{exact:true}).fill('2');await b.getByLabel(x.packages,{exact:true}).fill('1');
 await b.getByRole('button',{name:x.send,exact:true}).click();await expect(b.locator('.meda-conversation')).toBeVisible();await expect(b).toHaveURL(/view=messages.*market=meda.*meda_view=conversation/);const enquiry=new URL(b.url()).searchParams.get('ref')!;await expect(b.locator('.meda-hero')).toHaveCount(0);
 await a.goto('/shida/meda/');await a.getByRole('button',{name:t.details}).click();await expect(a.getByRole('button',{name:t.close,exact:true})).toBeVisible();await expect(a.getByRole('button',{name:x.send,exact:true})).toHaveCount(0);
 await a.goto('/shida/meda/?view=conversation&ref='+enquiry);await expect(a.getByText('Printed books shown in the photo').first()).toBeVisible();
 await a.getByRole('button',{name:x.propose,exact:true}).click();await a.locator('input[name=price]').fill('12');await a.locator('textarea[name=collection]').fill('Collect at the station');await a.locator('textarea[name=destination]').fill('Collect on arrival');await a.locator('textarea[name=conditions]').fill('Inspect the contents together');await a.locator('.meda-agreement form').getByRole('button',{name:x.propose,exact:true}).click();
 await acknowledge(a);await b.reload();await acknowledge(b);await expect(b.getByText(x.mutual,{exact:true})).toBeVisible();
 const mine=await api(a,'listings/');expect(mine.status).toBe(200);const listing=mine.data.items[0];
 await a.goto('/shida/meda/?view=review&ref='+listing.reference);await a.reload();await expect(a.getByRole('button',{name:t.close,exact:true})).toBeVisible();
 expect((await api(a,`listings/${listing.reference}/`,{action:'close',revision:listing.revision})).status).toBe(200);
 await b.reload();await b.getByLabel(t.message,{exact:true}).fill('We can still coordinate arrival');await b.getByRole('button',{name:t.reply,exact:true}).click();await expect(b.getByText('We can still coordinate arrival',{exact:true})).toBeVisible();
 expect(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 mkdirSync('docs/evidence/meda-improvements',{recursive:true});await b.screenshot({path:'docs/evidence/meda-improvements/two-user-mobile.png',fullPage:true});
 const detail=await api(b,`enquiries/${enquiry}/`);const photo=detail.data.agreement.values.objects.photos[0];await identity(sender,'stranger');await b.reload();await expect(b.locator('.meda-conversation')).toHaveCount(0);expect((await api(b,`enquiries/${enquiry}/`)).status).toBe(404);
 const unauthorizedPhoto=await b.evaluate(async(ref)=>{const session=await fetch('/api/shida/employment/session/').then(r=>r.json());return (await fetch('/api/shida/personal/meda/photos/'+ref+'/',{headers:{'x-shida-session':session.binding}})).status},photo);expect(unauthorizedPhoto).toBe(404);
 await owner.close();await sender.close();
});
test('real anonymous gateway blocks listings and preserves explanation',async({page})=>{await page.goto('/shida/meda/');await expect(page.getByRole('heading',{name:medaDiscoveryCopy.en.access})).toBeVisible();expect((await page.request.get('/api/shida/meda/listings/')).status()).toBe(401)});

test('real Mes annonces container draft, back navigation and explicit publication',async({page,context})=>{
 await identity(context,'owner');await origin(page);await page.goto('/shida/space/?view=listings&tab=meda&meda_view=create');
 await expect(page.locator('.meda-form')).toBeVisible();const form=page.locator('.meda-form');
 await form.locator('select').nth(1).selectOption('container');
 await page.getByLabel(t.fromCountry,{exact:true}).fill('FR');await expect(page.getByLabel(t.fromCountry,{exact:true})).toHaveValue('France');
 await page.getByLabel(t.toCountry,{exact:true}).fill('CD');await expect(page.getByLabel(t.toCountry,{exact:true})).toHaveValue(/Congo/);
 await page.getByLabel(x.collectionArea,{exact:true}).fill('Paris central collection area');await page.getByLabel(t.fromCity,{exact:true}).fill('Paris');await page.getByLabel(t.toCity,{exact:true}).fill('Kinshasa');
 await page.getByLabel(t.departure,{exact:true}).fill('2027-02-20T14:00');await page.getByLabel(t.deadline,{exact:true}).fill('2027-02-19T14:00');
 await form.getByRole('button',{name:t.next,exact:true}).click();await page.getByRole('checkbox',{name:x.unknown}).check();
 await page.getByLabel(t.goods,{exact:true}).fill('Container space for books and clothing');await page.getByRole('combobox',{name:t.basis,exact:true}).selectOption('package');await page.getByLabel(t.price,{exact:true}).fill('30');
 await form.getByRole('button',{name:t.previous,exact:true}).click();await expect(page.getByLabel(t.fromCity,{exact:true})).toHaveValue('Paris');await form.getByRole('button',{name:t.next,exact:true}).click();await expect(page.getByLabel(t.price,{exact:true})).toHaveValue('30');
 await form.getByRole('button',{name:t.next,exact:true}).click();await page.getByLabel(t.titleLabel,{exact:true}).fill('Container Paris to Kinshasa');
 await form.getByRole('button',{name:t.publish,exact:true}).click();await expect(page.getByRole('button',{name:t.close,exact:true})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:t.close,exact:true})).toBeVisible();await expect(page.locator('.meda-detail').getByText(t.published,{exact:true})).toBeVisible();await expect(page.getByText(x.unknown,{exact:true})).toBeVisible();
 const image='docs/evidence/meda-improvements/container-mobile.png';await page.setViewportSize({width:390,height:844});await page.screenshot({path:image,fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
