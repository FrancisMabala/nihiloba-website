import {test,expect,type Page} from '@playwright/test';
import {medaCopy} from '../../app/lib/meda-copy';
import {medaParticipationCopy} from '../../app/lib/meda-participation-copy';

async function fixtures(page:Page){
 await page.route('**/api/shida/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname.replace(/\/$/,'');
  if(path==='/api/shida/employment/session')return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Isolated Meda fixture'}}});
  if(path==='/api/shida/registration-reference'){
   const code=url.searchParams.get('q')==='FR'?'FR':'CD';
   return route.fulfill({json:{matched_code:code,items:[{code,name:code==='FR'?'France':'République démocratique du Congo'}]}});
  }
  if(path==='/api/shida/personal/job-offer')return route.fulfill({json:{rows:[],values:{},profile:null}});
  if(path==='/api/shida/personal/meda/listings')return route.fulfill({json:{items:[],total:0,page:1,has_more:false}});
  return route.fulfill({status:404,json:{}});
 });
}

async function fieldBounds(page:Page){
 const overflow=await page.locator('.meda-form').evaluate(form=>{
  const area=form.getBoundingClientRect(),style=getComputedStyle(form);
  const left=area.left+parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth);
  const right=area.right-parseFloat(style.paddingRight)-parseFloat(style.borderRightWidth);
  return Array.from(form.querySelectorAll('input,select,textarea,fieldset,legend,.registration-country'))
   .filter(element=>element.getClientRects().length>0)
   .flatMap(element=>{const rect=element.getBoundingClientRect();return rect.left<left-1||rect.right>right+1?[{tag:element.tagName,name:element.getAttribute('name'),type:element.getAttribute('type'),left:rect.left,right:rect.right,container:{left,right}}]:[];});
 });
 expect(overflow).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
}

for(const locale of ['fr','en','ln','sw'] as const)for(const width of [320,375,1440])test(`Meda fields remain inside every step ${locale} ${width}`,async({page},info)=>{
 await fixtures(page);await page.setViewportSize({width,height:844});
 await page.goto(`${locale==='en'?'':'/'+locale}/shida/space/?view=listings&tab=meda&meda_view=create`);
 const form=page.locator('.meda-form'),t=medaCopy[locale],x=medaParticipationCopy[locale];
 await expect(form).toBeVisible();await form.locator('select').nth(1).selectOption('container');
 await form.locator('#meda-from-country').fill('FR');await expect(form.locator('#meda-from-country')).toHaveValue('France');
 await form.locator('#meda-to-country').fill('CD');await expect(form.locator('#meda-to-country')).toHaveValue('République démocratique du Congo');
 await form.locator('[name=origin_city]').fill('Saint-Quentin-en-Yvelines');await form.locator('[name=destination_city]').fill('Kinshasa – Mont-Ngafula');
 await form.locator('[name=collection_area]').fill('Centre-ville');
 for(const name of ['deadline_at','departure_at','arrival_from','arrival_to'])await form.locator(`[name=${name}]`).fill('2027-02-20T14:00');
 await fieldBounds(page);await page.screenshot({path:info.outputPath('route.png'),fullPage:true});
 await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('[data-step="1"]')).toBeVisible();
 await form.locator('[name=capacity]').fill('3');await form.locator('[name=description]').fill('Books packed in small boxes.');
 await form.getByRole('combobox',{name:t.basis,exact:true}).selectOption('package');await form.locator('[name=price]').fill('20');
 await fieldBounds(page);await page.screenshot({path:info.outputPath('objects.png'),fullPage:true});
 await form.getByRole('button',{name:t.next,exact:true}).click();await expect(form.locator('[data-step="2"]')).toBeVisible();
 await fieldBounds(page);await page.screenshot({path:info.outputPath('review.png'),fullPage:true});
 await form.getByRole('button',{name:t.previous,exact:true}).click();await expect(form.locator('[name=capacity]')).toHaveValue('3');
 await expect(form.getByRole('checkbox',{name:x.unknown,exact:true})).not.toBeChecked();
 await form.getByRole('button',{name:t.previous,exact:true}).click();await form.locator('select').first().selectOption('request');
 await form.getByRole('button',{name:t.next,exact:true}).click();
 await form.getByLabel(x.contents,{exact:true}).fill('Books packed in small boxes.');
 await form.getByLabel(x.weight,{exact:true}).fill('3');await form.getByLabel(x.packages,{exact:true}).fill('2');
 await form.getByLabel(x.dimensions,{exact:true}).fill('20 x 30 x 40');
 await fieldBounds(page);await page.screenshot({path:info.outputPath('request-objects.png'),fullPage:true});
 // No save, publication, upload or provider call is performed by this layout regression.
});
