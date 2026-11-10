import {test,expect,type Page} from '@playwright/test';
import {jobSearchCopy} from '../../app/lib/job-search-copy';
import {candidateCopy} from '../../app/lib/candidate-profile-copy';

async function fixture(page:Page,{guest=false,directory=false,expired=false,initialSaved=false,initialFollowing=false}={}) {
  let signedIn=!guest,account='a',saved=initialSaved,following=initialFollowing,notifications=false;
  const writes:{path:string;body:Record<string,unknown>|null}[]=[];
  await page.addInitScript(()=>{window.open=()=>null;});
  await page.route('**/api/**',async route=>{
    const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,''),method=request.method();
    const reply=(json:unknown,status=200)=>route.fulfill({json,status});
    if(path.endsWith('/employment/session'))return reply(signedIn?{binding:account.repeat(64),user:{display_name:'Synthetic candidate'}}:{},signedIn?200:401);
    if(path.endsWith('/auth/whatsapp')&&method==='POST')return reply({challenge_ref:'challenge_fixture',whatsapp_url:'https://wa.me/00000000000',expires_at:new Date(Date.now()+120000).toISOString()});
    if(path.endsWith('/challenge_fixture'))return reply({status:'verified'});
    if(path.endsWith('/challenge_fixture/session')){signedIn=true;return reply({ok:true});}
    if(path.endsWith('/employment/applications'))return reply({applications:[{reference:'APP_fixture',job_title:'Existing application',employer_name:'Fixture employer',status:'received',created_at:'2026-11-01T10:00:00Z',interview:{},messages:[],status_history:[]}]});
    if(path.endsWith('/personal/candidate'))return reply({profiles:[{reference:'CND_fixture',type:'professional',version:'2026-11-01T10:00:00Z',archived:false,visibility:'private',has_cv:false,values:{city:'Kinshasa'}}],progress:[],metadata:{categories:[],required:{professional:[],occasional_work:[]}}});
    if(!path.includes('/job-search/'))return reply({},404);
    if(!signedIn)return reply({},401);
    if(method!=='GET')writes.push({path,body:method==='DELETE'?null:request.postDataJSON()});
    const employer={kind:directory?'organization_directory':'company',reference:directory?'DIR_fixture':'BUS_fixture',name:'Fixture organisation',following};
    if(path.includes('/jobs/')){
      if(method==='PUT'){const body=request.postDataJSON();if(body.action==='save')saved=body.enabled;else following=body.enabled;}
      return reply({saved:account==='a'&&saved,can_save:!expired,employer:{...employer,following:account==='a'&&following}});
    }
    if(path.endsWith('/notifications')){notifications=request.postDataJSON().enabled;return reply({enabled:notifications});}
    if(path.includes('/relations/')){saved=false;following=false;notifications=false;return reply({removed:true});}
    if(path.endsWith('/alerts'))return reply({profile_count:0,enabled_count:0,external_application_tracking:false});
    const items=path.endsWith('/saved')&&saved?[{relation_ref:'REL_'+'1'.repeat(64),kind:'job',reference:'JOB_fixture',name:'Saved assistant job',available:true,status:expired?'expired':'open',origin:'direct'}]:path.endsWith('/following')&&following?[{relation_ref:'REL_'+'2'.repeat(64),...employer,available:true,notifications}]:[];
    return reply({items,total:items.length,page:1,has_more:false});
  });
  return {writes,switchAccount:()=>{account='b';},expireSession:()=>{signedIn=false;}};
}

for(const locale of ['fr','en','ln','sw'] as const){
  const prefix=locale==='en'?'':`/${locale}`,t=jobSearchCopy[locale];
  test(`persisted saves, repeated clicks and isolated accounts ${locale}`,async({page})=>{
    const data=await fixture(page);
    await page.goto(`${prefix}/shida/emplois/JOB_fixture`);
    const save=page.getByRole('button',{name:t.save,exact:true});
    await expect(save).toBeEnabled();
    await save.evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
    await expect(page.getByRole('button',{name:t.unsave,exact:true})).toHaveAttribute('aria-pressed','true');
    expect(data.writes).toHaveLength(1);
    await expect(page.getByRole('link',{name:t.saved+" →"})).toHaveAttribute('href',`${prefix}/shida/space?view=job-search&section=saved`);
    await page.reload();await expect(page.getByRole('button',{name:t.unsave,exact:true})).toBeVisible();
    data.switchAccount();await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
    await expect(page.getByRole('button',{name:t.save,exact:true})).toHaveAttribute('aria-pressed','false');
  });
  test(`follows remain opt-in and directory navigation is distinct ${locale}`,async({page})=>{
    const data=await fixture(page,{directory:true});
    await page.goto(`${prefix}/shida/emplois/JOB_fixture`);
    await page.getByRole('button',{name:t.follow,exact:true}).click();
    await page.getByRole('link',{name:t.following+" →"}).click();
    await expect(page.getByText(t.directory,{exact:true})).toBeVisible();
    await expect(page.getByText(`${t.notifications}: ${t.disabled}`,{exact:true})).toBeVisible();
    await expect(page.getByRole('link',{name:new RegExp(t.organisation)})).toHaveAttribute('href',`${prefix}/shida/emplois/employeurs/DIR_fixture`);
    expect(data.writes.map(w=>w.body)).toEqual([{action:'follow',enabled:true}]);
    await page.getByRole('button',{name:t.unfollow,exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:t.unfollow,exact:true}).click();
    await expect(page.getByText(t.emptyFollowing,{exact:true})).toBeVisible();
  });
  test(`expired offers, applications and existing profiles ${locale}`,async({page})=>{
    const data=await fixture(page,{initialSaved:true,expired:true});
    await page.goto(`${prefix}/shida/space?view=job-search&section=saved`);
    await expect(page.getByText(t.expired,{exact:true})).toBeVisible();
    await expect(page.getByRole('link',{name:new RegExp(t.open)})).toHaveAttribute('href',`${prefix}/shida/emplois/JOB_fixture`);
    await page.getByRole('button',{name:t.remove,exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:t.remove,exact:true}).click();
    await expect(page.getByText(t.emptySaved,{exact:true})).toBeVisible();
    await page.getByRole('link',{name:t.applications,exact:true}).click();
    await expect(page.getByText('Existing application',{exact:true})).toBeVisible();
    await expect(page.getByText(t.externalGap,{exact:true})).toBeVisible();
    await expect(page.locator('a[href*="APP_fixture"]')).toHaveAttribute('href',`${prefix}/shida/${locale==='fr'?'mes-candidatures':'my-applications'}/APP_fixture`);
    await page.getByRole('link',{name:t.profiles,exact:true}).click();
    await expect(page.getByRole('heading',{name:candidateCopy[locale].professional,exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:candidateCopy[locale].edit,exact:true})).toBeVisible();
    expect(data.writes).toHaveLength(1);
  });
  test(`job-page unfollow requires confirmation ${locale}`,async({page})=>{
    const data=await fixture(page,{initialFollowing:true});
    await page.goto(`${prefix}/shida/emplois/JOB_fixture`);
    await page.getByRole('button',{name:t.unfollow,exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:t.cancel,exact:true}).click();
    expect(data.writes).toHaveLength(0);
    await page.getByRole('button',{name:t.unfollow,exact:true}).click();
    await page.getByRole('dialog').getByRole('button',{name:t.unfollow,exact:true}).click();
    await expect(page.getByRole('status')).toContainText(t.unfollowedAction);
    await page.reload();await expect(page.getByRole('button',{name:t.follow,exact:true})).toHaveAttribute('aria-pressed','false');
    expect(data.writes.map(w=>w.body)).toEqual([{action:'follow',enabled:false}]);
  });
}

test('embedded WhatsApp sign-in keeps intended save and stays on the job',async({page})=>{
  const data=await fixture(page,{guest:true}),t=jobSearchCopy.en;
  await page.goto('/shida/emplois/JOB_fixture');
  await page.getByRole('button',{name:t.save,exact:true}).click();
  await expect(page).toHaveURL(/job-action=save/);
  await page.reload();
  await expect(page.locator('a[href*="register"]')).toHaveAttribute('href',/returnTo=%2Fshida%2Femplois%2FJOB_fixture%3Fjob-action%3Dsave/);
  await page.getByRole('button',{name:/WhatsApp/,exact:false}).first().click();
  const code=page.locator('input[name="code"]');
  await expect(code).toBeVisible();
  await code.fill('123456');
  await code.locator('..').locator('..').getByRole('button',{name:/Verify|Continue|Confirm/i}).click();
  await expect(page.getByRole('button',{name:t.unsave,exact:true})).toBeVisible();
  await expect(page).toHaveURL('/shida/emplois/JOB_fixture');
  expect(data.writes.map(w=>w.body)).toEqual([{action:'save',enabled:true}]);
});

test('alerts require an explicit choice and survive refresh',async({page})=>{
  const data=await fixture(page,{initialFollowing:true}),t=jobSearchCopy.en;
  await page.goto('/shida/space?view=job-search&section=alerts');
  await expect(page.getByText(t.needProfile,{exact:true})).toBeVisible();
  await page.getByRole('button',{name:t.enable,exact:true}).click();
  await expect(page.getByRole('button',{name:t.disable,exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:t.disable,exact:true})).toBeVisible();
  expect(data.writes.map(w=>w.body)).toEqual([{enabled:true}]);
});

test('failed lists show retry instead of a misleading empty state',async({page})=>{
  await fixture(page);
  let fail=true;
  await page.route('**/job-search/saved?*',route=>fail?route.fulfill({json:{},status:503}):route.fallback());
  await page.goto('/shida/space?view=job-search&section=saved');
  await expect(page.getByRole('alert')).toContainText(jobSearchCopy.en.error);
  await expect(page.getByText(jobSearchCopy.en.emptySaved,{exact:true})).toBeHidden();
  fail=false;await page.getByRole('button',{name:jobSearchCopy.en.retry,exact:true}).click();
  await expect(page.getByText(jobSearchCopy.en.emptySaved,{exact:true})).toBeVisible();
});

test('an expired session preserves the intended unsave through sign-in',async({page})=>{
  const data=await fixture(page,{initialSaved:true}),t=jobSearchCopy.en;
  await page.goto('/shida/emplois/JOB_fixture');
  await expect(page.getByRole('button',{name:t.unsave,exact:true})).toBeEnabled();
  data.expireSession();
  await page.getByRole('button',{name:t.unsave,exact:true}).click();
  await expect(page).toHaveURL(/job-action=unsave/);
  await page.getByRole('button',{name:/WhatsApp/}).first().click();
  const code=page.locator('input[name="code"]');await code.fill('123456');
  await code.locator('..').locator('..').getByRole('button',{name:/Verify|Continue|Confirm/i}).click();
  await expect(page.getByRole('button',{name:t.save,exact:true})).toBeVisible();
  await expect(page.getByRole('status')).toContainText(t.removedAction);
  expect(data.writes.map(w=>w.body)).toEqual([{action:'save',enabled:false}]);
});

test('overview preserves loaded sections if follows fail on mobile',async({page})=>{
 await page.setViewportSize({width:375,height:740});await fixture(page,{initialSaved:true});
 await page.route('**/job-search/following?**',r=>r.fulfill({status:503,json:{}}));
 await page.goto('/fr/shida/space?view=job-search&section=overview');
 await expect(page.getByText('Saved assistant job')).toBeVisible();
 await expect(page.getByText('Existing application')).toBeVisible();
 await expect(page.getByRole('alert')).toContainText(jobSearchCopy.fr.error);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

for(const width of [820,1440])test('populated overview at '+width+'px',async({page},info)=>{
 await page.setViewportSize({width,height:900});await fixture(page,{initialSaved:true,initialFollowing:true});
 await page.goto('/fr/shida/space?view=job-search&section=overview');
 await expect(page.getByText('Saved assistant job')).toBeVisible();
 await expect(page.getByText('Fixture organisation',{exact:true})).toBeVisible();
 await expect(page.getByText('Existing application')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:info.outputPath('overview.png'),fullPage:true});
});
test('new account gets a welcome and access to profiles',async({page})=>{
 await fixture(page);
 await page.route('**/employment/applications*',r=>r.fulfill({json:{applications:[]}}));
 await page.route('**/personal/candidate?*',r=>r.fulfill({json:{profiles:[],progress:[]}}));
 await page.goto('/fr/shida/space?view=job-search&section=overview');
 const welcome=page.locator('section').filter({has:page.getByRole('heading',{name:'Votre recherche commence ici.'})}).last();
 await expect(welcome.getByRole('link',{name:candidateCopy.fr.start})).toHaveAttribute('href',/section=profiles/);
});
