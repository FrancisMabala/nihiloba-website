import {test,expect,type Page,type BrowserContext,type APIRequestContext} from '@playwright/test';
import {guestText} from '../../app/lib/restaurant-guest-copy';
import {checkoutCopy} from '../../app/lib/restaurant-checkout-copy';
test.skip(process.env.RESTAURANT_SERVICE_BACKEND!=='1','Requires isolated real Backend');
const backend='https://localhost:3443';
async function control(api:APIRequestContext,path:string){const r=await api.post(backend+'/__service/'+path);expect(r.ok(),await r.text()).toBe(true);return r.json();}
async function login(context:BrowserContext,api:APIRequestContext){
 const {token}=await control(api,'session/personal');await context.addCookies([{name:'nihiloba_personal_session',value:token,domain:'localhost',path:'/api/shida',secure:true,httpOnly:true,sameSite:'Lax'}]);
}
const service=(page:Page)=>page.locator('.rst-service'),guest=(page:Page)=>page.locator('#guest-order');
async function owner(page:Page,data:{name:string;ref:string}){
 await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card').filter({hasText:data.name}).first().getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Service',exact:true}).click();
 await service(page).getByRole('button',{name:'Open staff-only group'}).click();
}
async function compose(page:Page){
 const s=service(page);await s.getByRole('button',{name:'Add another round'}).click();await s.locator('.rst-menu-row').filter({hasText:'Fufu'}).getByRole('button',{name:'Add',exact:true}).click();
 await s.getByRole('textbox',{name:'Food preference'}).fill('No salt');await s.getByRole('button',{name:'Calculate exact total'}).click();await expect(s.getByRole('button',{name:'Send for preparation'})).toBeEnabled();
}
async function enter(page:Page,data:{qr:string}){
 await page.goto(data.qr);await guest(page).getByRole('button',{name:guestText('en','start')}).click();
 await expect(guest(page).getByRole('heading',{name:checkoutCopy.en.basket,exact:true})).toBeVisible();
}
async function guestRound(page:Page){
 const g=guest(page),t=checkoutCopy.en;await g.getByRole('article').filter({has:page.getByRole('heading',{name:'Fufu',exact:true})}).getByRole('button',{name:t.add,exact:true}).click();
 await g.getByRole('combobox',{name:t.window}).selectOption({index:1});await g.getByRole('button',{name:t.quote,exact:true}).click();await g.getByRole('button',{name:t.confirm,exact:true}).click();
 const r=g.locator('.rst-guest-round[aria-label]');await expect(r).toHaveCount(1);return (await r.first().getAttribute('aria-label'))!.replace(t.orderRef+' ','');
}
test('real Personal Pro Service: stale quote, grouped repeat rounds, handover and Free recovery',async({page,context,request})=>{
 test.setTimeout(120000);page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());const data=await control(request,'seed/personal');await login(context,request);await owner(page,data);await compose(page);
 await request.post(backend+'/__guest/'+data.ref+'/price/'+data.food);
 await service(page).getByRole('button',{name:'Send for preparation'}).click();await expect(service(page).getByText(/This action conflicted/)).toBeVisible();
 await expect(service(page).getByRole('button',{name:'Send for preparation'})).toHaveCount(0);
 await service(page).getByRole('button',{name:'Calculate exact total'}).click();await service(page).getByRole('button',{name:'Send for preparation'}).click();
 await expect(service(page).locator('.rst-service-round')).toHaveCount(1);
 const ref=(await service(page).locator('.rst-service-round p').first().textContent())!.split(' · ')[0];
 await compose(page);await service(page).getByRole('button',{name:'Send for preparation'}).click();await expect(service(page).locator('.rst-service-round')).toHaveCount(2);
 await control(request,'personal/prepare/'+ref);await service(page).getByRole('button',{name:'Refresh',exact:true}).click();await service(page).getByRole('button',{name:'Attest physical handover'}).click();
 await expect(service(page).locator('.rst-service-round').filter({hasText:ref})).toContainText('Handed over');
 const refs=await service(page).locator('.rst-service-round p:first-child').allTextContents();const second=refs.map(value=>value.split(' · ')[0]).find(value=>value!==ref)!;await control(request,'personal/prepare/'+second);
 await control(request,'personal/paid/off');await service(page).getByRole('button',{name:'Refresh',exact:true}).click();await expect(service(page).getByText(/Service access ended/)).toBeVisible();
 await page.getByRole('button',{name:'Orders',exact:true}).click();await page.getByRole('combobox',{name:'Orders',exact:true}).selectOption('active');await page.getByRole('button',{name:'Review',exact:true}).first().click();await expect(page.getByText(second,{exact:true}).first()).toBeVisible();await page.getByRole('button',{name:'Attest physical handover',exact:true}).click();await page.getByRole('button',{name:'Confirm',exact:true}).click();await expect(page.getByText(/Current state: Handed over/)).toBeVisible();
});
test('real guest consent: two same-QR visits, explicit decline/approval, cookie isolation and assisted read-only rounds',async({page,context,browser,request})=>{
 test.setTimeout(180000);page.setDefaultTimeout(15000);page.on('dialog',d=>d.accept());const data=await control(request,'seed/personal');await login(context,request);await owner(page,data);await compose(page);await service(page).getByRole('button',{name:'Send for preparation'}).click();
 await expect(service(page).locator('.rst-service-round')).toHaveCount(1);
 const guestContext=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
 const gp=await guestContext.newPage();gp.setDefaultTimeout(15000);await enter(gp,data);const anchor=await guestRound(gp);
 const another=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true});const other=await another.newPage();await enter(other,data);
 const gc=(await guestContext.cookies()).find(c=>c.name==='__Secure-restaurant-visit')!,oc=(await another.cookies()).find(c=>c.name==='__Secure-restaurant-visit')!;
 expect(gc.httpOnly&&gc.secure&&gc.sameSite==='Strict').toBe(true);expect(gc.value===oc.value).toBe(false);expect(gc.path).not.toBe(oc.path);
 const propose=async()=>{const input=service(page).getByRole('textbox',{name:'Guest order reference'});await input.fill(anchor);const [response]=await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'&&r.url().includes('/service/groups/')&&/\/proposals\/?$/.test(r.url())),service(page).getByRole('button',{name:'Propose a guest link',exact:true}).click()]);expect(response.ok()).toBe(true);await expect(input).toHaveValue('');await expect(service(page).getByText(/Awaiting guest approval until/)).toBeVisible();};
 await propose();await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(guest(gp).getByRole('button',{name:'Approve',exact:true})).toBeVisible();await expect(guest(gp).getByText('Staff-entered round',{exact:false})).toHaveCount(0);
 await other.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(guest(other).getByRole('button',{name:'Approve'})).toHaveCount(0);
 const currentProposal=(await (await guestContext.request.get(gc.path+'/service-proposals/?language=en')).json()).items[0].proposal_ref;await control(request,'expire/'+currentProposal);await guest(gp).getByRole('button',{name:'Approve',exact:true}).click();await expect(guest(gp).getByText(/expired or changed/i)).toBeVisible();
 await propose();await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(guest(gp).getByRole('button',{name:'Approve',exact:true})).toBeVisible();const stale=(await (await guestContext.request.get(gc.path+'/service-proposals/?language=en')).json()).items[0];
 await compose(page);await service(page).getByRole('button',{name:'Send for preparation'}).click();await expect(service(page).locator('.rst-service-round')).toHaveCount(2);
 await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(guest(gp).getByRole('button',{name:'Approve',exact:true})).toHaveCount(0);await expect(guest(gp).getByText(/expired or changed/i).first()).toBeVisible();const rejected=await guestContext.request.post(gc.path+'/service-proposals/'+stale.proposal_ref+'/approve/',{headers:{Origin:'https://localhost:3014'},data:{operation_key:'stale-'+Date.now(),group_revision:stale.group_revision,visit_revision:stale.visit_revision,confirm:true}});expect(rejected.status()).toBe(409);
 await propose();await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));await guest(gp).getByRole('button',{name:'Decline',exact:true}).click();await expect(guest(gp).getByText(/Declined on this device/)).toBeVisible();
 await propose();await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));let original:string|null=null,tries=0;await gp.route('**/service-proposals/*/approve/',async route=>{tries++;if(tries===1){original=route.request().postData();await route.fetch();return route.abort();}expect(route.request().postData()).toBe(original);await route.continue();});
 await guest(gp).getByRole('button',{name:'Approve',exact:true}).click();await expect(guest(gp).getByRole('button',{name:guestText('en','retry')})).toBeVisible();await guestContext.setOffline(true);await guestContext.setOffline(false);await guest(gp).getByRole('button',{name:guestText('en','retry')}).click();await expect(guest(gp).getByRole('button',{name:guestText('en','retry')})).toHaveCount(0);expect(tries).toBe(2);
 await expect(guest(gp).getByRole('heading',{name:'Guest link approved'})).toBeVisible();const group=guest(gp).getByRole('region',{name:'Service groups'});await expect(group.getByText(/Order entered by staff/)).toHaveCount(2);
 await expect(guest(gp).locator('.rst-guest-payment')).toBeVisible();await expect(guest(gp).locator('.rst-guest-payment').getByText(/Balance due/).first()).toBeVisible();
 expect(await group.getByRole('button').count()).toBe(0);
 const approvedUrl=gc.path+'/service-group/';expect((await another.request.get(approvedUrl)).status()).toBe(404);
 expect((await another.request.get(gc.path+'/service-payment/?language=en')).status()).toBe(404);
 const deny=await guestContext.request.post(gc.path+'/service-proposals/forged/approve/',{data:{operation_key:'bad',group_revision:1,visit_revision:1,confirm:true}});expect(deny.status()).toBe(403);
 expect(await gp.evaluate(()=>document.cookie.includes('__Secure-restaurant-visit'))).toBe(false);
 expect(await gp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await gp.screenshot({path:'.s3a-local/rm-v11-10f1/guest-phone.png',fullPage:true});const storage=await gp.evaluate(()=>Object.values(sessionStorage).join(' '));expect(storage).not.toContain('No salt');expect(storage).not.toContain('receipt_terms');
 await guestContext.clearCookies();await gp.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(guest(gp).getByText(guestText('en','lost'))).toBeVisible();await expect(guest(gp).locator('.rst-guest-payment')).toHaveCount(0);
 await another.close();await guestContext.close();
});

test('real original counter POS remains an immediately handed-over sale',async({page,context,request})=>{
 test.setTimeout(60000);page.setDefaultTimeout(15000);const data=await control(request,'seed/personal');await login(context,request);await page.goto('/shida/seller/restaurants');await page.locator('.rst-grid .rst-card').filter({hasText:data.name}).first().getByRole('button',{name:'Edit',exact:true}).click();await page.getByRole('button',{name:'Point of sale',exact:true}).click();
 const pos=page.locator('.rst-work').filter({has:page.getByRole('heading',{name:'Point of sale',exact:true})});await pos.getByRole('button',{name:'New counter sale'}).click();await pos.locator('.rst-menu-row').filter({hasText:'Fufu'}).getByRole('button',{name:'Add',exact:true}).click();await pos.getByRole('button',{name:'Calculate exact total'}).click();expect(await pos.getByRole('button',{name:'Send for preparation'}).count()).toBe(0);await pos.getByRole('button',{name:'Confirm food handoff'}).click();await expect(pos.getByText(/Current state: Handed over/).first()).toBeVisible();expect(await pos.getByRole('button',{name:'Attest physical handover'}).count()).toBe(0);
});
