import {writeFileSync} from 'node:fs';
import {test,expect,request,type BrowserContext} from '@playwright/test';
test.skip(process.env.RESTAURANT_ACTUAL_BACKEND!=='1','Requires isolated actual Backend');
async function session(context:BrowserContext,label='personal'){
 const api=await request.newContext({baseURL:'https://127.0.0.1:3443',ignoreHTTPSErrors:true});
 const r=await api.post(`/__s3a/session/${label}`);expect(r.ok()).toBeTruthy();
 const {token}=await r.json();await context.addCookies([{name:'nihiloba_personal_session',value:token,domain:'localhost',path:'/api/shida',httpOnly:true,sameSite:'Lax',secure:true}]);return api;
}
test('actual Backend: order handling, counter handoff, protected receipts, gate and feed',async({page,context},info)=>{
 test.setTimeout(120000);
 page.setDefaultTimeout(15000);
 page.on('response',r=>{if(r.url().includes('/api/shida/personal/') && r.status()>=400)console.log(new URL(r.url()).pathname,r.status());});
 const api=await session(context);const seed=await api.post('/__c1e/seed');expect(seed.ok(),await seed.text()).toBeTruthy();const data=await seed.json();
 await context.route(/https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/]).*/,route=>route.abort());
 const measurements:{path:string;bytes:number;at:number}[]=[];
 page.on('response',async r=>{if(r.url().includes('/api/shida/personal/restaurants/'))measurements.push({path:new URL(r.url()).pathname,bytes:(await r.body().catch(()=>Buffer.alloc(0))).length,at:Date.now()});});
 await page.goto('/shida/seller/restaurants');
 await page.locator('.rst-grid .rst-card').filter({hasText:data.name}).first().getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByRole('button',{name:'Orders',exact:true}).click();await page.getByRole('button',{name:'Review',exact:true}).click();
 await expect(page.getByText(/Fufu · 2/)).toBeVisible();
 await expect(page.getByText(/Respond before/)).toBeVisible();
 for(const action of ['Accept order','Start preparation','Food is ready','Confirm food handoff']){
  await page.getByRole('button',{name:action,exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await expect(page.getByRole('button',{name:'Confirm',exact:true})).toHaveCount(0);
 }
 await expect(page.getByText('Current state: Handed over · Pickup')).toBeVisible();
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('orders-desktop.png'),fullPage:true});
 const reconciled=page.waitForResponse(r=>r.url().includes('/orders/'+data.order.order_ref+'/') && r.request().method()==='GET');await page.getByRole('button',{name:'Refresh',exact:true}).click();await reconciled;await page.waitForTimeout(500);await page.screenshot({path:info.outputPath('orders-desktop.png'),fullPage:true});const start=Date.now();await page.waitForTimeout(31000);const idle=measurements.filter(m=>m.at>=start);console.log('C1E idle',JSON.stringify(idle));expect(idle.filter(m=>m.path.includes('order-feed')).length).toBe(2);expect(idle.some(m=>/\/orders\//.test(m.path))).toBe(false);
 const reconnectStart=Date.now();await context.setOffline(true);await expect(page.getByText(/Connection interrupted/)).toBeVisible();await context.setOffline(false);await expect(page.getByText(/Current state: Handed over.*Pickup/)).toBeVisible();await expect(page.getByRole('button',{name:'Counter sale',exact:true})).toBeEnabled();await page.waitForTimeout(1000);const reconnect=measurements.filter(m=>m.at>=reconnectStart);
 await page.getByRole('button',{name:'Counter sale',exact:true}).click();await page.getByRole('button',{name:'New counter sale',exact:true}).click();await page.getByRole('button',{name:'Add',exact:true}).click();
 await page.getByRole('button',{name:'Calculate exact total',exact:true}).click();await expect(page.getByText('1000.25 CDF',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Confirm food handoff',exact:true}).click();await expect(page.getByRole('link',{name:'Receipt',exact:true})).toBeVisible();await expect(page.getByText('Payment not verified. This receipt is not proof of payment.')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:info.outputPath('counter-phone.png'),fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const receipt=await page.getByRole('link',{name:'Receipt',exact:true}).getAttribute('href');
 await page.getByRole('button',{name:'My menu',exact:true}).click();await page.getByRole('button',{name:'Add several foods',exact:true}).click();
 await page.getByRole('combobox',{name:'Category',exact:true}).selectOption({label:'Synthetic foods'});
 const batchRows=page.locator('.rst-batch-row');
 for(let i=0;i<2;i++){await batchRows.nth(i).getByLabel('Food name',{exact:true}).fill(['Fufu','Rice'][i]);await batchRows.nth(i).getByRole('textbox',{name:'Price',exact:true}).fill('1000.25');await batchRows.nth(i).getByLabel('Unit (e.g. bowl)',{exact:true}).fill('bowl');}
 await batchRows.first().getByRole('combobox',{name:'Review',exact:true}).selectOption(data.food);
 await page.getByRole('button',{name:'Review',exact:true}).click();await api.post(`/__s3a/cross-channel/${data.ref}`);
 await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText('Things changed. Refresh, review your inputs and confirm again.')).toBeVisible();
 await page.getByRole('button',{name:'Review',exact:true}).click();await expect(batchRows.first().getByLabel('Food name',{exact:true})).toBeEnabled();await expect(batchRows.first().getByLabel('Food name',{exact:true})).toHaveValue('Fufu');
 await page.getByRole('button',{name:'Review',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText('Saved',{exact:true})).toBeVisible();
 await page.goto(receipt!);await expect(page.getByText('Payment not verified. This receipt is not proof of payment.')).toBeVisible();await page.getByRole('button',{name:'Show receipt QR',exact:true}).click();await expect(page.getByRole('img',{name:'Show receipt QR'})).toBeVisible();
 // Same owner has no customer receipt right. Forwarded counter receipt denied.
 await page.goto(`/shida/restaurant-orders/${data.order.order_ref}/receipt`);await expect(page.getByText('Unavailable. Try refreshing.')).toBeVisible();
 await session(context,'other');await page.reload();await expect(page.getByText('Payment not verified. This receipt is not proof of payment.')).toBeVisible();
 await page.goto(receipt!);await expect(page.getByText('Unavailable. Try refreshing.')).toBeVisible();
 await context.clearCookies();await page.reload();await expect(page.getByRole('button',{name:'Continue with WhatsApp',exact:true})).toBeVisible();
 await session(context);await api.post('/__c1e/close');await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card').filter({hasText:data.name}).first().getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Counter sale',exact:true}).click();await expect(page.getByRole('button',{name:'New counter sale',exact:true})).toBeDisabled();
 writeFileSync(info.outputPath('measurements.json'),JSON.stringify({idle,reconnect,all:measurements},null,2));
 await info.attach('request-measurements',{body:JSON.stringify({idle,reconnect,all:measurements},null,2),contentType:'application/json'});
 await api.dispose();
});
