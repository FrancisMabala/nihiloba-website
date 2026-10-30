import {test,expect,type BrowserContext} from '@playwright/test';
const output=process.env.ACTIVITIES_EVIDENCE_DIR||'test-results/activities-evidence';
async function signIn(context:BrowserContext,kind:string){await context.addCookies([{name:'nihiloba_personal_session',value:`activities-acceptance-${kind}-session`,domain:'127.0.0.1',path:'/'}]);}
for(const kind of ['empty','one','many'])for(const width of [360,390,768,1440])test(`normal APIs ${kind} ${width}`,async({page,context})=>{
 await signIn(context,kind);await page.setViewportSize({width,height:950});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/shida/space?view=management');
 const cards=page.locator('.activity-cards article');
 if(kind==='empty'){
  await expect(page.getByRole('heading',{name:'Start using SHIDA'})).toBeVisible({timeout:20000});
  await expect(cards).toHaveCount(0);await expect(page.getByRole('link',{name:'Open a shop'})).toBeVisible();
 }else{
  await expect(cards).toHaveCount(kind==='one'?1:4);
  await expect(page.getByRole('heading',{name:'Start using SHIDA'})).toHaveCount(0);
  await expect(page.getByRole('link',{name:'Open a shop'})).toHaveCount(0);
  await expect(page.locator('.activities-section-heading')).toContainText(kind==='one'?'1 activity':'4 activities');
  expect((await page.locator('.activity-cards').boundingBox())!.y).toBeLessThan((await page.locator('.activities-other').boundingBox())!.y);
  if(kind==='many'){
   await expect(cards.filter({hasText:'Earlier Kitchen'})).toContainText('Inactive');
   await expect(cards.filter({hasText:'Draft Malewa'})).toContainText('Complete activity');
   const kitchen=cards.filter({hasText:'Acceptance Kitchen'});
   await expect(kitchen.getByRole('link',{name:/Manage/})).toHaveAttribute('href',/seller\/restaurants\?establishment=/);
   const publicHref=await kitchen.getByRole('link',{name:/View listing/}).getAttribute('href');
   const response=await page.request.get(publicHref!);expect(response.status()).toBe(200);
  }
 }
 await expect(page.locator('.activities-error')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'SHIDA Business'})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${output}/activities-${kind}-${width}.png`,fullPage:true});
 if(kind!=='empty'){
  await page.getByRole('button',{name:'+ New activity',exact:true}).click();
  await expect(page.getByRole('link',{name:'Open a shop'})).toBeVisible();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await expect(page.getByRole('link',{name:'Open a shop'})).toHaveCount(0);
 }
 expect(errors).toEqual([]);
});
for(const [locale,start] of [['fr','Commencez sur SHIDA'],['ln','Banda kosalela SHIDA'],['sw','Anza kutumia SHIDA']])test(`localized ${locale}`,async({page,context})=>{
 await signIn(context,'empty');await page.goto(`/${locale}/shida/space?view=management`);
 await expect(page.getByRole('heading',{name:start})).toBeVisible();
 await expect(page.locator('.activities-dashboard')).not.toContainText('Start using');
});
test('permission failure cannot become a false empty state',async({page,context})=>{
 await signIn(context,'empty');await page.route('**/api/shida/personal/security/navigation/**',route=>route.fulfill({status:503,json:{}}));
 await page.goto('/shida/space?view=management');await expect(page.locator('.activities-error')).toBeVisible();
 await expect(page.getByRole('heading',{name:'Start using SHIDA'})).toHaveCount(0);
});
test('different Personal accounts cannot retrieve each other’s activity',async({page,context})=>{
 await signIn(context,'many');await page.goto('/shida/space?view=management');
 await expect(page.locator('.activity-cards article')).toHaveCount(4);
 const href=await page.getByRole('link',{name:/Manage · Acceptance Kitchen/}).getAttribute('href');
 const ref=new URL(href!,'https://nihiloba.com').searchParams.get('establishment');
 await signIn(context,'empty');
 const session=await (await page.request.get('/api/shida/employment/session/')).json();
 const response=await page.request.get(`/api/shida/personal/restaurants/${ref}`,{headers:{'X-Shida-Session':session.binding}});
 expect([403,404]).toContain(response.status());
 await page.reload();await expect(page.locator('.activities-welcome')).toBeVisible();await expect(page.locator('.activity-cards article')).toHaveCount(0);
});
test('restaurant pagination exposes all records and stops at the reported total',async({page,context})=>{
 await signIn(context,'one');
 await page.route('**/api/shida/personal/restaurants/**',route=>{
  const second=new URL(route.request().url()).searchParams.get('page')==='2';
  return route.fulfill({json:{items:Array.from({length:second?1:20},(_,i)=>({public_ref:`RST_page_${second?20:i}`,profile:{name:`Page activity ${second?20:i}`},status:'draft'})),total:21,actions:['create']}});
 });
 await page.goto('/shida/space?view=management');await expect(page.locator('.activity-cards article')).toHaveCount(21);
 await expect(page.locator('.activities-section-heading')).toContainText('Showing 21');
 await page.getByRole('button',{name:'Show more activities'}).click();
 await expect(page.locator('.activity-cards article')).toHaveCount(22);await expect(page.getByRole('button',{name:'Show more activities'})).toHaveCount(0);
});
test('creation controls are keyboard-operable and use supported localized WhatsApp commands',async({page,context})=>{
 await signIn(context,'one');await page.goto('/shida/space?view=management');
 const button=page.getByRole('button',{name:'+ New activity'});await button.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('button',{name:'Close',exact:true})).toHaveAttribute('aria-expanded','true');
 const shop=page.getByRole('link',{name:'Open a shop'});await shop.focus();await expect(shop).toBeFocused();await expect(shop).toHaveAttribute('href','/shida/seller/wenze');
 await expect(page.getByRole('link',{name:/Create my job-seeker profile/})).toHaveAttribute('href',/text=create\+candidate\+profile/);
 await expect(page.getByRole('link',{name:/Offer a job/})).toHaveAttribute('href',/text=employment\+menu/);
});
