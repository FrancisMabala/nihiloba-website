import {test,expect,type APIRequestContext,type BrowserContext} from '@playwright/test';

test.skip(process.env.RESTAURANT_SERVICE_BACKEND!=='1','Requires isolated real B6b Backend');
const backend='https://localhost:3443';
async function control(api:APIRequestContext,path:string){const response=await api.post(backend+'/__service/'+path);expect(response.ok(),await response.text()).toBe(true);return response.json();}
async function login(context:BrowserContext,api:APIRequestContext){const {token}=await control(api,'session/personal');await context.addCookies([{name:'nihiloba_personal_session',value:token,domain:'localhost',path:'/api/shida',secure:true,httpOnly:true,sameSite:'Lax'}]);}

test('real Personal owner records expense and closes an elapsed day with distinct zero cash',async({page,context,request})=>{
 test.setTimeout(180000);page.setDefaultTimeout(15000);await page.setViewportSize({width:390,height:844});page.on('dialog',dialog=>dialog.accept());
 const data=await control(request,'seed/personal');await login(context,request);const initial=await control(request,'day/clock');await page.clock.setFixedTime(new Date(initial.now));
 await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card').filter({hasText:data.name}).first().getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByRole('button',{name:'Configure payment methods'}).click();const config=page.locator('.rst-money');await config.getByRole('textbox',{name:'Label'}).fill('Cash desk');await config.getByRole('checkbox',{name:'CDF'}).check();await config.getByRole('checkbox',{name:'USD'}).check();await config.getByRole('button',{name:'Save method'}).click();
 await page.getByRole('button',{name:'Daily operations'}).click();const daily=page.locator('.rst-daily');await expect(daily.getByText(/restaurant-recorded, not provider-verified/)).toBeVisible();
 await expect(daily.getByRole('button',{name:'Confirm this zone'})).toBeEnabled();await daily.getByRole('button',{name:'Confirm this zone'}).click();await expect(daily.getByText('Africa/Kinshasa')).toBeVisible();
 await expect(daily.getByText(/Final closing is available after local midnight/)).toBeVisible();
 await daily.getByLabel('Actual method').selectOption({label:'Cash desk · Cash'});await daily.getByLabel('Amount').fill('10.50');await daily.getByLabel('Category').fill('Supplies');await daily.getByRole('button',{name:'Record',exact:true}).first().click();await expect(daily.getByText(/Paid expense · 10.50 CDF/)).toBeVisible();
 const date=await daily.locator('input[type=date]').inputValue();
 for(const [currency,opening] of [['CDF','10.50'],['USD','0']] as const){const section=daily.locator('.rst-daily-grid section').filter({has:page.getByRole('heading',{name:currency,exact:true})}).last();await section.getByRole('textbox',{name:/Attested opening cash/}).fill(opening);await section.getByRole('button',{name:'Record'}).first().click();await expect(section.getByRole('definition').first()).toContainText(opening==='0'?'0.00':'10.50');}
 const advanced=await request.post(backend+'/__guest/advance/1440');expect(advanced.ok()).toBe(true);const later=await control(request,'day/clock');await page.clock.setFixedTime(new Date(later.now));await daily.getByRole('button',{name:'Day preview'}).click();await expect(daily.getByText(`${date} · Africa/Kinshasa`)).toBeVisible();
 for(const currency of ['CDF','USD']){const section=daily.locator('.rst-daily-grid section').filter({has:page.getByRole('heading',{name:currency,exact:true})}).last();await section.getByRole('textbox',{name:/Counted closing cash/}).fill('0');await section.getByRole('button',{name:'Record'}).last().click();await expect(section.getByRole('definition').filter({hasText:'0.00'}).first()).toBeVisible();}
 await expect(daily.getByRole('button',{name:'Close day'})).toBeEnabled();await daily.getByRole('button',{name:'Close day'}).click();await expect(daily.getByText(/Close day ·/)).toBeVisible();await expect(daily.getByRole('button',{name:date})).toBeVisible();
 await daily.getByRole('combobox',{name:'Action'}).selectOption('reversal');await daily.getByRole('combobox',{name:'Entry to correct'}).selectOption({index:1});await daily.getByRole('textbox',{name:'Reason'}).first().fill('Mistaken paid entry');await daily.getByRole('button',{name:'Record',exact:true}).first().click();await expect(daily.getByText(/Reverse an error · 10.50 CDF/)).toBeVisible();await daily.getByRole('button',{name:date}).click();await expect(daily.getByRole('heading',{name:'Linked later adjustments'})).toBeVisible();await expect(daily.getByText(/financial/).last()).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.clock.resume();
});
