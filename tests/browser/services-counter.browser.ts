import {test,expect} from '@playwright/test';
import {servicesProviderOffering} from './fixtures/services-provider';
import {providerCopy} from '../../app/lib/services-provider-copy';
import {counterCopy} from '../../app/lib/services-counter-copy';

for(const [locale,width] of [['en',1440],['fr',390],['ln',820],['sw',320]] as const)test(`Counter sale and receipt ${locale} ${width}`,async({page})=>{
 const t=counterCopy[locale],navCopy=providerCopy[locale];let saved=false,body:Record<string,unknown>|undefined;
 const sale={sale_ref:'SCS_one',customer_name:null,presentation:{display_name:'Belleza Salon'},currency:'USD',total:'35.00',received:'10.00',outstanding:'25.00',effective_date:'2026-10-26',lines:[{offering_ref:'SVC_one',package_ref:'SPK_one',service_name:'Hair styling',package_name:'Wash and braids',quantity:1,unit_price:'35.00',amount:'35.00'}],payments:[{receipt_ref:'SCR_one',amount:'10.00',method:'cash',effective_date:'2026-10-26'}]};
 await page.setViewportSize({width,height:1000});
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,'');const reply=(json:unknown)=>route.fulfill({json});
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Owner'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','bills','manual_journal','basic_totals','structured_availability']});
  if(path.endsWith('/services'))return reply({profiles:[{...servicesProviderOffering,service_name:'Hair styling',packages:[{public_ref:'SPK_one',name:'Wash and braids',price:'35.00',currency:'USD',duration_minutes:60}]}]});
  if(path.endsWith('/bill-presentation'))return reply({preview:{display_name:'Belleza Salon'}});
  if(path.endsWith('/counter')){if(route.request().method()==='POST'){body=route.request().postDataJSON();saved=true;return reply(sale);}return reply({sales:saved?[sale]:[],next_offset:null});}
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=counter`);
 await expect(page.getByRole('heading',{name:t.title,exact:true}).first()).toBeVisible();
 await expect(page.locator('.svc-view-heading button').filter({hasText:navCopy.share})).toHaveCount(0);
 const form=page.locator('.svc-counter-form').first();
 await form.getByRole("combobox",{name:t.currency,exact:true}).selectOption('USD');
 await form.getByRole("combobox",{name:t.service,exact:true}).selectOption('SVC_one');
 await form.getByRole("combobox",{name:t.package,exact:true}).selectOption('SPK_one');
 await form.getByRole('button',{name:t.add,exact:true}).click();
 await form.getByLabel(t.paid,{exact:true}).fill('10');
 await page.screenshot({path:`test-results/counter-basket-${locale}-${width}.png`,fullPage:true});
 await form.getByRole('button',{name:t.save,exact:true}).click();
 await page.getByRole('button',{name:t.confirm,exact:true}).click();
 await expect(page.locator('.svc-counter-receipt')).toContainText('Belleza Salon');
 await expect(page.locator('.svc-counter-receipt')).toContainText('Wash and braids');
 await expect(page.locator('.svc-counter-receipt')).toContainText('25.00');
 expect(body?.lines).toEqual([{offering_ref:'SVC_one',package_ref:'SPK_one',quantity:1,unit_price:'35.00'}]);
 await page.getByRole("combobox",{name:t.format,exact:true}).selectOption('58');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/services-counter-${locale}-${width}.png`,fullPage:true});
 await page.evaluate(()=>{window.print=()=>{};});
 await page.getByRole('button',{name:t.print,exact:true}).click();
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.svc-counter-print .svc-counter-receipt')).toBeVisible();
 await expect(page.locator('.svc-view-heading')).toBeHidden();
});
