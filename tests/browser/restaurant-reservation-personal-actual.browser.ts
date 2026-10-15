import {test,expect,request} from '@playwright/test';
import {managementNavigation} from './restaurant-management-navigation';
test.skip(process.env.RESTAURANT_RESERVATION_BACKEND!=='1','Requires isolated real Backend reservation fixture');
test('real Personal request, accept, decline, refresh and calendar',async({browser})=>{
 test.setTimeout(120000);
 const api=await request.newContext({baseURL:'https://127.0.0.1:3443',ignoreHTTPSErrors:true});
 const seeded=await api.post('/__reservation/seed');expect(seeded.ok(),await seeded.text()).toBeTruthy();
 const data=await seeded.json() as {personal:string;personal_name:string;date:string};
 async function session(label:'owner'|'buyer'){const r=await api.post(`/__reservation/session/${label}`);expect(r.ok()).toBeTruthy();return (await r.json() as {token:string}).token;}
 const buyerContext=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
 await buyerContext.addCookies([{name:'nihiloba_personal_session',value:await session('buyer'),domain:'localhost',path:'/api/shida',httpOnly:true,sameSite:'Lax',secure:true}]);
 const buyer=await buyerContext.newPage();
 async function make(date:string){await buyer.goto(`/shida/restaurant-reservations?establishment=${data.personal}`);await buyer.getByLabel(/Local date and time/).fill(date.slice(0,10));await buyer.getByLabel('Requested time').fill(date.slice(11));await buyer.getByLabel('Guests').fill('3');await buyer.getByRole('button',{name:'Send request'}).click();await expect(buyer.getByText('Request recorded. The seller must still accept it.')).toBeVisible();}
 await make(data.date);
 const ownerContext=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true,viewport:{width:390,height:844}});
 await ownerContext.addCookies([{name:'nihiloba_personal_session',value:await session('owner'),domain:'localhost',path:'/api/shida',httpOnly:true,sameSite:'Lax',secure:true}]);
 const owner=await ownerContext.newPage();await owner.goto('/shida/seller/restaurants');await owner.getByRole('article').filter({hasText:data.personal_name}).getByRole('button',{name:'Edit'}).click();await managementNavigation(owner,'Reservations');
 const queue=owner.getByRole('region',{name:'Requests to answer'});await expect(queue.locator('.rst-res-row')).toHaveCount(1);
 const ref=await queue.locator('.rst-res-row code').innerText();expect(ref).toMatch(/^RRS_/);
 await queue.getByRole('button',{name:'Accept',exact:true}).click();await owner.getByRole('dialog').getByRole('button',{name:'Accept'}).click();
 await expect(queue.locator('.rst-res-row')).toHaveCount(0);await expect(owner.locator('.rst-res-row').filter({hasText:ref}).first()).toContainText('Accepted');
 await buyer.getByRole('button',{name:'Refresh'}).click();await expect(buyer.getByText('Accepted',{exact:true}).first()).toBeVisible();
 await owner.locator('.rst-res-view').getByRole('button',{name:'Calendar'}).click();await owner.locator(`.shida-cal-day[data-day="${data.date.slice(0,10)}"]`).click();await expect(owner.locator('.shida-cal-agenda')).toContainText('Accepted');
 const second=new Date(data.date.slice(0,10)+'T12:00:00Z');second.setUTCDate(second.getUTCDate()+1);await make(second.toISOString().slice(0,10)+data.date.slice(10));
 await owner.locator('.rst-res-header').getByRole('button',{name:'Refresh'}).click();await owner.locator('.rst-res-view').getByRole('button',{name:'Requests and visits'}).click();
 await expect(queue.locator('.rst-res-row')).toHaveCount(1);await queue.getByRole('button',{name:'Decline'}).click();await owner.getByRole('dialog').getByRole('button',{name:'Decline'}).click();
 await expect(queue.locator('.rst-res-row')).toHaveCount(0);await buyer.getByRole('button',{name:'Refresh'}).click();await expect(buyer.getByText('Rejected',{exact:true}).first()).toBeVisible();
 await ownerContext.close();await buyerContext.close();await api.dispose();
});