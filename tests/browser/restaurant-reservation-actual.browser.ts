import {test,expect,request} from '@playwright/test';

test.skip(process.env.RESTAURANT_RESERVATION_BACKEND !== '1', 'Requires isolated real Backend reservation fixture');

test('real Backend: customer, Personal seller and Organization seller reservations',async({browser})=>{
  test.setTimeout(90000);
  const api=await request.newContext({baseURL:'https://127.0.0.1:3443',ignoreHTTPSErrors:true});
  const seed=await api.post('/__reservation/seed');
  expect(seed.ok(),await seed.text()).toBeTruthy();
  const data=await seed.json() as {personal:string;organization:string;business:string;date:string;personal_name:string;organization_name:string};
  async function session(label:'owner'|'buyer'){
    const issued=await api.post(`/__reservation/session/${label}`);
    expect(issued.ok(),await issued.text()).toBeTruthy();
    return (await issued.json() as {token:string}).token;
  }
  const customer=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true});
  await customer.addCookies([{name:'nihiloba_personal_session',value:await session('buyer'),domain:'localhost',path:'/api/shida',httpOnly:true,sameSite:'Lax',secure:true}]);
  const buyer=await customer.newPage();
  await buyer.setViewportSize({width:390,height:844});
  await buyer.goto(`/shida/restaurants/${data.personal}`);
  await expect(buyer.getByRole('link',{name:'Request a reservation'})).toHaveAttribute('href',new RegExp(`establishment=${data.personal}`));
  await buyer.goto(`/shida/restaurant-reservations?establishment=${data.personal}`);
  await expect(buyer.getByRole('heading',{name:'Request a reservation',exact:true})).toBeVisible();
  await buyer.getByLabel(/Local date and time/).fill(data.date.slice(0,10));
  await buyer.getByLabel('Requested time').fill(data.date.slice(11));
  await buyer.getByLabel('Guests').fill('3');
  await buyer.evaluate(()=>window.scrollTo(0,0));
  await buyer.screenshot({path:'docs/evidence/calendar-customer-390.png',fullPage:true});
  await buyer.getByRole('button',{name:'Send request'}).click();
  await expect(buyer.getByText('Request recorded. The seller must still accept it.')).toBeVisible();
  await expect(buyer.getByText('Awaiting seller response').first()).toBeVisible();

  const personal=await browser.newContext({baseURL:'https://localhost:3014',ignoreHTTPSErrors:true});
  await personal.addCookies([{name:'nihiloba_personal_session',value:await session('owner'),domain:'localhost',path:'/api/shida',httpOnly:true,sameSite:'Lax',secure:true}]);
  const owner=await personal.newPage();
  await owner.goto('/shida/seller/restaurants');
  await expect(owner.locator('.rst-management-identity').getByRole('heading',{name:data.personal_name})).toBeVisible();
  await owner.locator('.rst-nav-group').filter({hasText:'Reservations'}).locator('summary').click();
  await owner.getByRole('button',{name:'Reservations',exact:true}).click();
  await owner.getByRole('region',{name:'Awaiting seller response'}).getByRole('button').first().click();
  await expect(owner.getByRole('button',{name:'Accept this request'})).toBeVisible();
  await owner.getByRole('button',{name:'Accept this request'}).click();
  await expect(owner.getByText(/Guests.*Accepted/)).toBeVisible();
  await buyer.getByRole('button',{name:'Refresh'}).click();
  await expect(buyer.getByText('Accepted',{exact:true}).first()).toBeVisible();
  for(const [lang,label] of [['fr','Demander une réservation'],['ln','Senga esika'],['sw','Omba nafasi']]){
    await buyer.goto(`/${lang}/shida/restaurant-reservations?establishment=${data.personal}`);
    await expect(buyer.getByRole('heading',{name:label,exact:true})).toBeVisible();
  }

  await buyer.goto(`/shida/restaurant-reservations?establishment=${data.organization}`);
  await buyer.getByLabel(/Local date and time/).fill(data.date.slice(0,10));
  await buyer.getByLabel('Requested time').fill(data.date.slice(11));
  await buyer.getByLabel('Guests').fill('4');
  await buyer.getByRole('button',{name:'Send request'}).click();
  await expect(buyer.getByText('Request recorded. The seller must still accept it.')).toBeVisible();

  const business=await browser.newContext({baseURL:'https://localhost:3015',ignoreHTTPSErrors:true});
  await business.addCookies([{name:'shida_dashboard_session',value:await session('owner'),domain:'localhost',path:'/',httpOnly:true,sameSite:'Lax',secure:true}]);
  await business.addInitScript(()=>localStorage.setItem('shida-language','en'));
  const manager=await business.newPage();
  await manager.goto(`/businesses/${data.business}/restaurants`);
  await expect(manager.getByRole('heading',{name:data.organization_name})).toBeVisible();
  await manager.locator('.rst-nav-group').filter({hasText:'Reservations'}).locator('summary').click();
  await manager.getByRole('button',{name:'Reservations',exact:true}).click();
  await manager.getByRole('region',{name:'Awaiting seller response'}).getByRole('button').first().click();
  await expect(manager.getByRole('button',{name:'Accept this request'})).toBeVisible();
  await manager.getByRole('button',{name:'Accept this request'}).click();
  await expect(manager.getByText(/Guests.*Accepted/)).toBeVisible();
  await buyer.getByRole('button',{name:'Refresh'}).click();
  await expect(buyer.getByText('Accepted',{exact:true}).first()).toBeVisible();
  await business.close();await personal.close();await customer.close();await api.dispose();
});
