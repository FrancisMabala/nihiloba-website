import {test,expect,type Page} from '@playwright/test';
import {providerCopy} from '../../app/lib/services-provider-copy';

const capabilities=['profile','offerings','packages','pilot_publication','reviews_read','requests_quotes','reservations','messages','bills','bill_reminders','manual_journal','basic_totals','operational_reports','financial_reports','quote_templates','bill_templates'];
async function fixture(page:Page,{empty=false,bundle='personal_free'}={}){
 const state={signedIn:true,binding:'a'.repeat(64),failCreate:false,failed:false,rows:empty?[]:[{public_ref:'SVC_one',provider_ref:'SVI_one',name:'Atelier Kin',service_name:'Home repair',category:'repair_maintenance',description:'Careful repairs around the home.',service_duration_minutes:60,commune:'Gombe',service_location_type:'public_place',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}}],writes:[] as {path:string;method:string;body:Record<string,unknown>;key:string|undefined}[]};
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  if(path.endsWith('/employment/session')){
   if(req.method()==='DELETE'){state.signedIn=false;return reply({ok:true});}
   return state.signedIn?reply({binding:state.binding,user:{display_name:'Atelier Kin'}}):reply({},401);
  }
  if(!state.signedIn)return reply({},401);
  if(path.endsWith('/services/capabilities'))return reply({bundle,access_policy:'pilot',purchase_required:false,capabilities});
  if(path.endsWith('/services')&&req.method()==='POST'){
   const body=req.postDataJSON();state.writes.push({path,method:req.method(),body,key:req.headers()['idempotency-key']});
   if(state.failCreate&&!state.failed){state.failed=true;return reply({},503);}
   const row={public_ref:'SVC_new',provider_ref:'SVI_one',...body,service_duration_minutes:null,commune:null,service_location_type:'public_place',home_service_available:'no',booking_mode:'flexible',availability:null,publication_origin:'unclassified',requests_enabled:false,is_active:'yes',revision:1,missing_fields:['description'],packages:[],rating:{average:null,count:0}};state.rows.push(row);return reply(row);
  }
  if(path.endsWith('/services'))return reply({profiles:state.rows});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(path.includes('/services/SVC_')&&req.method()!=='GET'){
   const body=req.postDataJSON();state.writes.push({path,method:req.method(),body,key:req.headers()['idempotency-key']});
   const row=state.rows.find(item=>path.includes('/'+item.public_ref))!;
   if(req.method()==='DELETE'||path.endsWith('/reactivate')){expect(url.searchParams.get('expected_revision')).toBe(String(row.revision));row.is_active=req.method()==='DELETE'?'no':'yes';row.revision++;return reply(row);}
   if(body.expected_revision!==row.revision)return reply({},409);
   Object.assign(row,body,{revision:row.revision+1});return reply(row);
  }
  if(path.endsWith('/transactions/reservations'))return reply({reservations:[]});
  if(path.endsWith('/transactions/requests'))return reply({requests:[],has_more:false});
  if(path.endsWith('/transactions/messages'))return reply({threads:[]});
  if(path.endsWith('/transactions/templates'))return reply({templates:[]});
  if(path.endsWith('/transactions/finance/entries'))return reply({entries:[],next_offset:null});
  if(path.endsWith('/transactions/finance/totals')){const bucket={billed:'0.00',declared_received:'0.00',outstanding:'0.00',unbilled_receipts:'0.00',declared_excess:'0.00',job_expenses:'0.00',services_overhead:'0.00',recorded_expenses:'0.00',declared_surplus:'0.00'};return reply({currencies:{CDF:bucket,USD:bucket}});}
  if(path.endsWith('/transactions/bill-presentation'))return reply({display_name:null,accent:'green',revision:1,fallback_display_name:'Atelier Kin',preview:{display_name:'Atelier Kin',accent:'green'}});
  return reply({},404);
 });
 return state;
}
for(const [locale,width] of [['en',360],['fr',1440],['ln',820],['sw',390]] as const)test(`Personal workspace navigation ${locale} ${width}`,async({page})=>{
 await page.setViewportSize({width,height:950});
 await page.addInitScript(lang=>localStorage.setItem('shida-language',lang),locale);
 await fixture(page,{bundle:locale==='en'?'personal_free':'personal_pro'});
 await page.goto(`${locale==='en'?'':`/${locale}`}/shida/seller/services`);
 const t=providerCopy[locale],nav=page.getByRole('navigation',{name:t.navigation});
 await expect(page.getByRole('heading',{name:t.overview,exact:true})).toBeVisible();
 await expect(nav.getByRole('button')).toHaveCount(7);
 await expect(page.getByText(t.pilot).last()).toBeVisible();
 await page.screenshot({path:`docs/evidence/services-provider/overview-${locale}-${width}.png`,fullPage:true});
 for(const section of ['services','work','finance','reports','templates','settings'] as const){
  await nav.getByRole('button',{name:t[section],exact:true}).click();
  await expect(nav.getByRole('button',{name:t[section],exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('#services-view-title')).toHaveText(t[section]);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await nav.getByRole('button',{name:t.services,exact:true}).click();
 const editor=page.locator('.svc-service-editor');await editor.getByRole('textbox').first().fill('Draft provider name');
 await nav.getByRole('button',{name:t.overview,exact:true}).click();
 await nav.getByRole('button',{name:t.services,exact:true}).click();
 await expect(editor.getByRole('textbox').first()).toHaveValue('Draft provider name');
 await page.screenshot({path:`docs/evidence/services-provider/services-${locale}-${width}.png`,fullPage:true});
});
test('empty setup retries exactly once with the same creation key, then archives and restores',async({page})=>{
 const state=await fixture(page,{empty:true});state.failCreate=true;
 await page.goto('/shida/seller/services');await expect(page.locator('.svc-sidebar')).toHaveCount(0);await page.getByRole('button',{name:'Create my provider profile'}).click();
 const form=page.locator('.svc-new-service');await form.getByLabel('Provider name').fill('Atelier Kin');await form.getByLabel('Service',{exact:true}).fill('Home repair');await form.getByLabel('Category').selectOption('repair_maintenance');await form.getByRole('button',{name:'Add service'}).click();
 await expect(page.getByText(/save could not be confirmed/)).toBeVisible();await expect(form.getByRole('textbox').first()).toBeDisabled();
 await page.getByRole('button',{name:'Try again',exact:true}).click();await expect(page.locator('.svc-service-editor h2')).toHaveText('Home repair');
 expect(state.writes).toHaveLength(2);expect(state.writes[0]).toEqual(state.writes[1]);
 page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Archive service',exact:true}).click();await expect(page.getByRole('button',{name:'Restore service',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Restore service',exact:true}).click();await expect(page.getByRole('button',{name:'Archive service',exact:true})).toBeVisible();expect(state.rows).toHaveLength(1);
});
test('session replacement clears private drafts and expired sessions return to WhatsApp sign-in',async({page})=>{
 const state=await fixture(page);await page.goto('/shida/seller/services?view=services');
 const editor=page.locator('.svc-service-editor');await editor.getByRole('textbox').first().fill('Private draft');
 state.binding='b'.repeat(64);state.rows=[];await page.evaluate(()=>window.dispatchEvent(new Event('shida-personal-session-changed')));
 await expect(editor).toHaveCount(0);await expect(page.locator('input[value="Private draft"]')).toHaveCount(0);
 state.signedIn=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.svc-workspace')).toHaveCount(0);await expect(page.locator('.rst-signin')).toBeVisible();
});
