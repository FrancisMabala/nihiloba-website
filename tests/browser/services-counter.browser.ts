import {test,expect} from '@playwright/test';
import {servicesProviderOffering} from './fixtures/services-provider';
import {providerCopy} from '../../app/lib/services-provider-copy';
import {workplaceCopy} from "../../app/lib/services-workplace-copy";
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
  if(path.endsWith('/document.pdf'))return route.fulfill({contentType:"application/pdf",body:"%PDF-fixture"});
  if(path.endsWith('/counter')){if(route.request().method()==='POST'){body=route.request().postDataJSON();saved=true;return reply(sale);}return reply({sales:saved?[sale]:[],next_offset:null});}
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(path.endsWith('/services/onboarding'))return reply({progress:[],remaining_capacity:4,professional_profile:{public_ref:'SVI_one',revision:1,name:'Provider',primary_category:'repair_maintenance'}});
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services?view=counter`);
 await expect(page.getByRole('heading',{name:t.title,exact:true}).first()).toBeVisible();
 await expect(page.locator('.svc-view-heading button').filter({hasText:navCopy.share})).toHaveCount(0);
 const form=page.locator('.svc-counter-form').first();
 await form.getByRole("button",{name:/Hair styling/}).click();
 await form.getByRole("button",{name:/Wash and braids/}).click();
 await form.getByRole('button',{name:t.checkout,exact:true}).click();
 const payment=page.getByRole('dialog');
 await payment.getByRole('button',{name:t.back,exact:true}).click();
 await expect(form.locator('.svc-counter-basket')).toContainText("Wash and braids");
 await form.getByRole('button',{name:t.checkout}).click();
 await payment.getByLabel(t.paid,{exact:true}).fill('10');
 await page.screenshot({path:`test-results/counter-basket-${locale}-${width}.png`,fullPage:true});
 await payment.getByRole('button',{name:t.pay,exact:true}).click();
 await page.getByRole('button',{name:workplaceCopy[locale].receipt,exact:true}).click();
 await expect(page.locator('.svc-counter-receipt')).toContainText('Belleza Salon');
 await expect(page.locator('.svc-counter-receipt')).toContainText('Wash and braids');
 await expect(page.locator('.svc-counter-receipt')).toContainText('25.00');
 expect(body?.cash_tendered).toBe('10.00');
 expect(body?.paid_amount).toBe('10.00');
 expect(body?.lines).toEqual([{offering_ref:'SVC_one',package_ref:'SPK_one',quantity:1,unit_price:'35.00'}]);
 await page.getByRole("combobox",{name:t.format,exact:true}).selectOption('58');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/services-counter-${locale}-${width}.png`,fullPage:true});
 const downloading=page.waitForEvent("download");
 await page.getByRole("button",{name:t.pdf,exact:true}).click();
 expect((await downloading).suggestedFilename()).toBe("SCR_one.pdf");
 if(width<=900){await page.getByRole("button",{name:t.backSales}).click();}
 await page.locator(".svc-counter-history select").selectOption("due");
 await page.locator(".svc-counter-history li button").first().click();
 if(width<=900){
  await page.getByRole("button",{name:t.backSales}).click();
  await expect(page.locator(".svc-counter-history select")).toHaveValue("due");
  await page.locator(".svc-counter-history li button").first().click();
 }
 await page.evaluate(()=>{window.print=()=>{};});
 await page.getByRole('button',{name:t.print,exact:true}).click();
 await page.emulateMedia({media:'print'});
 await expect(page.locator('.svc-counter-print .svc-counter-receipt')).toBeVisible();
 await expect(page.locator('.svc-view-heading')).toBeHidden();
});

test("empty provider can add a first service from the counter",async({page})=>{
 await page.route("**/api/**",route=>{
  const path=new URL(route.request().url()).pathname.replace(/\/$/,"");
  const payload=path.endsWith("/employment/session")?{binding:"a".repeat(64),user:{display_name:"Owner"}}:
   path.endsWith("/capabilities")?{capabilities:["profile","manual_journal","bills"]}:
   path.endsWith("/services")?{profiles:[]}:path.endsWith("/services/onboarding")?{progress:[],remaining_capacity:4}:null;
  return route.fulfill({status:payload?200:404,json:payload??{}});
 });
 await page.goto("/fr/shida/seller/services/?view=counter");
 await expect(page.getByText(counterCopy.fr.noServices)).toBeVisible();
 await expect(page.getByRole("link",{name:counterCopy.fr.addService})).toHaveAttribute("href",/view=services/);
 await expect(page.getByRole("button",{name:counterCopy.fr.checkout})).toBeDisabled();
});

test("quoted ticket, mixed currencies and retry after a lost sale response",async({page})=>{
 const t=counterCopy.fr,attempts:{key:string;body:string}[]=[];
 const pkg={public_ref:"SPK_day",name:"Maquillage de jour",price:"À partir de 30 000",currency:"CDF"};
 const service={...servicesProviderOffering,service_name:"Maquillage",professional_settings:{modes:["remote"],counter_enabled:false},
  packages:[pkg,{...pkg,public_ref:"SPK_usd",name:"Forfait USD",price:"20",currency:"USD"}]};
 const doc={sale_ref:"SCS_one",customer_name:null,presentation:{display_name:"Atelier Grâce",cash_tendered:"50000.00",cash_change:"10000.00"},currency:"CDF",
  total:"40000.00",received:"40000.00",outstanding:"0.00",effective_date:"2026-11-12",payments:[{receipt_ref:"SCR_one",amount:"40000.00",method:"cash",effective_date:"2026-11-12"}],
  lines:[{offering_ref:"SVC_one",package_ref:"SPK_day",quantity:1,unit_price:"40000.00",amount:"40000.00",service_name:"Maquillage",package_name:pkg.name}]};
 await page.route("**/api/**",async route=>{
  const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,""),reply=(data:unknown)=>route.fulfill({json:data});
  if(path.endsWith("/employment/session"))return reply({binding:"a".repeat(64),user:{display_name:"Owner"}});
  if(path.endsWith("/capabilities"))return reply({capabilities:["profile","manual_journal","bills"]});
  if(path.endsWith("/services"))return reply({profiles:[service]});
  if(path.endsWith("/reviews"))return reply({reviews:[]});
  if(path.endsWith("/services/onboarding"))return reply({progress:[],remaining_capacity:4,professional_profile:{public_ref:"SVI_one",revision:1,name:"Provider",primary_category:"repair_maintenance"}});
  if(path.endsWith("/stores"))return reply({stores:[{public_ref:"STORE_one",status:"active",store_type:"online_and_physical",selling_mode:"shop"}]});
  if(path.endsWith("/bill-presentation"))return reply({preview:{display_name:"Atelier Grâce"}});
  if(path.endsWith("/counter")&&route.request().method()==="POST"){
   attempts.push({key:route.request().headers()["idempotency-key"],body:route.request().postData()!});
   return attempts.length===1?route.fulfill({status:503,json:{}}):reply(doc);
  }
  if(path.endsWith("/counter"))return reply({sales:attempts.length&&!url.searchParams.has("outstanding_only")?[doc]:[],next_offset:null});
  return route.fulfill({status:404,json:{}});
 });
 await page.goto("/fr/shida/seller/services/?view=counter");
 await expect(page.locator(".svc-secondary-tools").getByRole("button",{name:t.title})).toBeVisible();
 await page.getByRole("button",{name:/Maquillage/}).first().click();
 await page.getByRole("button",{name:/Maquillage de jour/}).click();
 await page.getByLabel(t.agreed).fill("40000");
 await page.getByRole("button",{name:t.add}).click();
 await expect(page.getByRole("button",{name:/Forfait USD/})).toBeDisabled();
 await expect(page.getByText(/Ce ticket est en CDF/)).toBeVisible();
 for(const link of [page.locator(".svc-counter-signature a"),page.getByRole("link",{name:/Ouvrir la caisse Wenze/})]){
  const popup=page.waitForEvent("popup");await link.click();await (await popup).close();
  await expect(page.locator(".svc-counter-basket")).toContainText(pkg.name);
 }
 await page.getByRole("button",{name:t.checkout}).click();
 const dialog=page.getByRole("dialog");
 await dialog.getByRole("button",{name:t.mobile_money,exact:true}).click();
 await expect(dialog.getByText(t.note)).toBeVisible();
 await dialog.getByRole("button",{name:t.cash,exact:true}).click();
 for(const [cash,label,value] of [["30000",t.balance,"10000"],["40000",t.balance,"0"],["50000",t.change,"10000"]]){
  await dialog.getByLabel(t.paid).fill(cash);
  expect((await dialog.locator("output").innerText()).replace(/\s/g,"")).toBe((label+"·"+value+"CDF").replace(/\s/g,""));
 }
 await dialog.getByRole("button",{name:t.pay}).dblclick();
 await expect(dialog.getByLabel(t.paid)).toHaveValue("50000");
 await dialog.getByRole("button",{name:t.retry}).click();
 await page.getByRole("button",{name:workplaceCopy.fr.receipt}).click();
 expect(attempts).toHaveLength(2);expect(attempts[1]).toEqual(attempts[0]);
 expect(JSON.parse(attempts[0].body)).toMatchObject({paid_amount:"40000.00",cash_tendered:"50000.00"});
 await expect(page.locator(".svc-counter-receipt")).toContainText("SCR_one");
 await page.locator(".svc-counter-history select").selectOption("due");
 await expect(page.getByRole("button",{name:t.showAll})).toBeVisible();
 await page.getByRole("button",{name:t.showAll}).click();
 await expect(page.locator(".svc-counter-history li")).toHaveCount(1);
});
