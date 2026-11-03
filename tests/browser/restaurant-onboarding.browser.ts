import {test,expect,type Page} from '@playwright/test';
async function fixture(page:Page,locale='en'){
  let version=1,completed=false;
  const draft={draft_ref:'RON_'+ 'a'.repeat(48),revision:'1'.repeat(64),status:'active',establishment_ref:null as string|null,fields:{food_business_type:'restaurant',address_visibility:'broad',confirm_location:false} as Record<string,unknown>};
  const writes:{path:string;body:Record<string,unknown>}[]=[];
  await page.route('**/*',route=>{
    const url=new URL(route.request().url()),path=url.pathname.replace(/\/$/,'');
    if(url.origin!=='http://127.0.0.1:3088')return route.abort();
    if(!path.startsWith('/api/'))return route.continue();
    const reply=(json:unknown,status=200)=>route.fulfill({json,status});
    if(path.endsWith('/employment/session'))return reply({user:{display_name:'Isolated seller'},binding:'a'.repeat(64)});
    if(path.includes('/onboarding')){
      const method=route.request().method();if(method==='GET')return reply(path.endsWith('/current')?{draft}:draft);
      const body=route.request().postDataJSON();writes.push({path,body});
      if(path.endsWith('/confirm')){completed=true;draft.status='completed';draft.establishment_ref='RST_fixture';return reply(draft);}
      if(method==='PATCH'){Object.assign(draft.fields,body.fields);draft.revision=String(++version).repeat(64);}
      return reply(draft);
    }
    const establishment={public_ref:'RST_fixture',revision:'2026-11-03T10:00:00Z',status:'draft',profile:draft.fields,location_confirmed:false,missing_publication_fields:['description','city','commune','quartier','timezone_name'],menu_currency:null,actions:['read','edit','menu','hours','preview']};
    if(path.endsWith('/personal/restaurants'))return reply({items:completed?[establishment]:[],total:completed?1:0,page:1,page_size:20,actions:['create']});
    if(path.endsWith('/RST_fixture'))return reply(establishment);
    if(path.endsWith('/capabilities'))return reply({capabilities:[]});
    return reply({items:[],total:0,count:0,result:{items:[],total:0},capabilities:[]});
  });
  await page.goto(`${locale==='en'?'':'/'+locale}/shida/seller/restaurants?create=restaurant`);
  await expect(page.locator('.rc-content form')).toBeVisible();
  return {writes,draft};
}
for(const width of [360,390,768,1024,1440])test(`private three-step creation at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});const state=await fixture(page);
  await page.getByRole('textbox',{name:'Name *',exact:true}).fill('Controlled Malewa');
  await page.getByRole('radio',{name:/Malewa/}).check();
  await page.screenshot({path:`test-results/restaurant-onboarding/identity-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Continue/}).click();
  expect(state.draft.fields.confirm_location).toBe(false);
  await page.getByRole('combobox',{name:/Timezone/}).selectOption('Africa/Kinshasa');
  await page.screenshot({path:`test-results/restaurant-onboarding/location-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Continue/}).click();
  await expect(page.locator('.rc-review')).toContainText('Controlled Malewa');
  await expect(page.getByRole('button',{name:/Create my private establishment/})).toBeDisabled();
  await page.getByRole('checkbox',{name:/I confirm these details/}).check();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/restaurant-onboarding/review-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:/Create my private establishment/}).click();
  await expect(page.getByRole('heading',{name:'Prepare your establishment'})).toBeVisible();
  expect(state.writes.filter(write=>write.path.endsWith('/confirm'))).toHaveLength(1);
  expect(state.writes.find(write=>write.path.endsWith('/confirm'))?.body).toMatchObject({confirmed:true});
  expect(state.writes.some(write=>JSON.stringify(write.body).includes('"status":"active"'))).toBe(false);
});
test('saved draft survives reload and preserves supported additional types',async({page})=>{
  const state=await fixture(page);await page.getByRole('textbox',{name:'Name *',exact:true}).fill('Cafe draft');
  await page.getByRole('combobox',{name:'Establishment type',exact:true}).selectOption('cafe');
  await page.getByRole('button',{name:/Continue/}).click();await page.reload();
  await expect(page.getByRole('textbox',{name:'Name *',exact:true})).toHaveValue('Cafe draft');
  await expect(page.getByRole('combobox',{name:'Establishment type',exact:true})).toHaveValue('cafe');
  expect(state.writes.filter(w=>w.path.endsWith('/onboarding'))).toHaveLength(1);
});
for(const locale of ['fr','ln','sw'])test(`localized private wizard ${locale}`,async({page})=>{
  await fixture(page,locale);await expect(page.locator('.rc-content h1')).not.toHaveText('Create my establishment');
  expect(await page.locator('.rc-content').innerText()).not.toMatch(/undefined|restaurant_r1_/);
});
