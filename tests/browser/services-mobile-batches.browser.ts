import {test,expect,type Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {servicesProviderOffering} from './fixtures/services-provider';
import {localDate} from '../../app/lib/shida-calendar';
const evidence=process.env.SERVICES_EVIDENCE_DIR??process.env.SERVICES_TEST_OUTPUT!;
const day=()=>localDate(new Date().toISOString(),'Africa/Kinshasa');
async function fixture(page:Page){
 const state={empty:false,failed:false,delay:0,previewFail:false,saveFail:false,noEligible:false,denied:false,failPath:"",timezone:"Africa/Kinshasa",conflict:false,writes:[] as {path:string;body:Record<string,unknown>}[],reads:[] as string[]};
 const services=[{...servicesProviderOffering,booking_mode:'time_slots',service_name:'Consultation et accompagnement professionnel',category:'beauty_wellness',professional_profile:{name:'Cabinet de soins et accompagnement de proximité',photo:null},offer_terms:{delivery:{modes:['customer'],communes:['Limete','Lemba','Matete']}}},{...servicesProviderOffering,public_ref:'SVC_two',service_name:'Entretien à domicile',booking_mode:'flexible'}];
 const requests=[{request_ref:'SWR_new',offering_ref:'SVC_one',offering:services[0].service_name,requester:'Client de démonstration',status:'SUBMITTED',created_at:day()+'T09:00:00Z',revision:1,can_create_quote:true,actions:['review']},{request_ref:'SWR_quote',offering_ref:'SVC_two',offering:'Devis entretien',status:'IN_REVIEW',draft_quote_ref:'SQT_one',revision:1}];
 const reservations=[{reservation_ref:'RSV_pending',offering_ref:'SVC_one',service_name:'Consultation',status:'pending',requested_datetime:day()+' 14:00',revision:1},{reservation_ref:'RSV_active',offering_ref:'SVC_two',service_name:'Entretien',status:'in_progress',revision:1}];
 let schedule={offering_ref:'SVC_one',revision:1,mode:'appointments',confirmation:'provider_approval',timezone:'Africa/Kinshasa',duration_minutes:60,hours:[{day:'monday',start:'09:00',end:'12:00'},{day:'monday',start:'13:00',end:'17:00'}],personal_calendar:{shared_revision:1,week:[],inherit_week:false,absences:[],travel_minutes:15}};
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  state.reads.push(path+url.search);
  if(state.denied&&path.includes('/personal/services/transactions'))return reply({},403);
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Fixture Provider'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','reservations','messages','structured_availability','requests_quotes','manual_journal','bills','basic_totals']});
  if(path.endsWith('/services/onboarding'))return reply({progress:[],remaining_capacity:3,professional_profile:{public_ref:'SVI_one',revision:1,name:'Fixture Provider',primary_category:'beauty_wellness'}});
  if(path.endsWith('/services'))return reply({profiles:services.map(row=>state.noEligible?{...row,requests_enabled:false}:row)});
  if(path.endsWith('/reviews'))return reply({reviews:[]});
  if(state.failPath&&path.endsWith(state.failPath))return reply({},503);
  if(state.delay)await new Promise(resolve=>setTimeout(resolve,state.delay));
  if(path.endsWith('/schedule')){
   if(req.method()==='PATCH'){state.writes.push({path,body:req.postDataJSON()});if(state.saveFail)return reply({},503);schedule={...schedule,...req.postDataJSON(),revision:schedule.revision+1};}
   return reply({...schedule,offering_ref:path.includes('SVC_two')?'SVC_two':'SVC_one'},state.failed?503:200);
  }
  if(path.endsWith('/manual-appointment')){state.writes.push({path,body:req.postDataJSON()});return reply({},state.conflict?409:200);}
  if(path.endsWith('/schedule-preview'))return reply({slots:[{start_time:'09:00'}]});
  if(path.endsWith('/proposals/SPF_one/save')){state.writes.push({path,body:req.postDataJSON()});return reply({proposal_ref:'SPF_one'},state.conflict?409:200);}
  if(req.method()!=='GET')throw Error('Unexpected write: '+path);
  if(state.failed)return reply({},503);
  if(path.endsWith('/today')){const queue={items:[],has_more:false};return reply({date:day(),timezone:'Africa/Kinshasa',requests:state.empty?queue:{items:requests.slice(0,1),has_more:false},pending:queue,upcoming:queue,messages:queue});}
  if(path.endsWith('/calendar'))return reply({timezone:state.timezone,items:state.empty?[]:[{reference:'RSV_one',title:'Consultation',client:'Client A',startsAt:day()+'T09:00:00+01:00',endsAt:day()+'T10:00:00+01:00',timeZone:'Africa/Kinshasa',status:'confirmed',tone:'confirmed'},{reference:'RSV_pending',title:'Consultation à confirmer',client:'Client B',startsAt:day()+'T14:00:00+01:00',endsAt:day()+'T15:00:00+01:00',timeZone:'Africa/Kinshasa',status:'pending',tone:'pending'}],unscheduled:[],has_more:false});
  if(path.endsWith('/availability'))return reply({service_ref:url.searchParams.get('service'),appointment_booking:true,timezone:'Africa/Kinshasa',requested_time_requires_provider_confirmation:true,slots:state.empty?[]:[{date:url.searchParams.get('date'),start_time:'09:00',end_time:'10:00'}]},state.previewFail?503:200);
  if(path.endsWith('/transactions/requests'))return reply({requests:state.empty?[]:requests,has_more:false});
  if(path.endsWith('/transactions/reservations'))return reply({reservations:state.empty?[]:reservations,has_more:false});
  if(path.endsWith('/transactions/messages'))return reply({threads:[],has_more:false});
  if(path.endsWith('/requests/SWR_new'))return reply(requests[0]);
  if(path.endsWith('/reservations/RSV_one'))return reply({...reservations[0],reservation_ref:'RSV_one',status:'confirmed',selected_offering_name:'Consultation'});
  if(path.endsWith('/quotes'))return reply({quotes:[],has_more:false});
  if(path.endsWith('/postings/available'))return reply({requests:state.empty?[]:[{posted_ref:'SPR_one',status:'OPEN',created_at:day()+'T08:00:00Z',expires_at:'2030-01-01T00:00:00Z',summary:{category:'beauty_wellness',description:'Accompagnement à domicile',city:'Kinshasa',commune:'Limete'}}]});
  if(path.endsWith('/proposals/SPF_one'))return reply({proposal_ref:'SPF_one',posted_ref:'SPR_one',offering_ref:'SVC_two',status:'DRAFT',request_status:'OPEN',revision:1,draft:{currency:'CDF',amount:'12500',pricing_description:'Prestation conservée',terms:'Conditions existantes'},draft_answers_current_brief:true,draft_digest:'fixture-digest',request:{posted_ref:'SPR_one',expires_at:'2030-01-01T00:00:00Z',summary:{description:'Proposition pour un autre service'}},clarifications:[]});
  if(path.endsWith('/competition/proposals'))return reply({proposals:state.empty?[]:[{proposal_ref:'SPF_one',posted_ref:'SPR_one',offering_ref:'SVC_two',status:'DRAFT',revision:1,request:{summary:{description:'Proposition pour un autre service'}}}],next_ref:null});
  if(path.endsWith('/finance/workspace'))return reply({start:day(),end:day(),currency:'CDF',totals:{billed:'0',received:'0',spent:'0',outstanding:'0'},days:[],entries:[],dues:[],methods:{},categories:{},jobs:[],previous:day(),previous_end:day(),previous_received:'0',advances:[],closes:[]});
  if(path.endsWith('/share'))return reply({name:'Fixture Provider',url:'https://example.invalid/profile',qr_image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='});
  return reply({items:[],documents:[],totals:[],entries:[],events:[],has_more:false});
 });return state;
}
async function shot(page:Page,name:string){mkdirSync(evidence,{recursive:true});await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo(0,0);});await page.screenshot({path:`${evidence}/${process.env.SERVICES_BASELINE?'before':'after'}-${name}.png`,fullPage:true});}
test('matching baseline and release screenshots',async({page})=>{
 await page.setViewportSize({width:390,height:844});await fixture(page);
 for(const view of ['overview','work','calendar','available','proposals']){
  await page.goto('/fr/shida/seller/services?view='+view);await expect(page.locator('.svc-content')).toBeVisible();await page.waitForTimeout(800);await shot(page,view+'-390');
  if(view==='calendar'){await page.getByRole('button',{name:'Disponibilités',exact:true}).click();await expect(page.locator('.svc-cal-week').first()).toBeVisible();await shot(page,'availability-390');}
 }
 await page.locator('.management-mobile-nav').getByRole('button',{name:'Plus',exact:true}).click();await expect(page.locator('.management-more-sheet')).toBeVisible();await shot(page,'more-390');
});

const route='/fr/shida/seller/services?view=';
async function fits(page:Page){const value=await page.evaluate(()=>({ok:document.documentElement.scrollWidth<=innerWidth+1,width:innerWidth,documentWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const b=el.getBoundingClientRect();return b.width>0&&b.right>innerWidth+1}).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent?.slice(0,45),width:el.getBoundingClientRect().width})).slice(0,12)}));if(!value.ok)await page.screenshot({path:evidence+"/overflow-debug.png",fullPage:true});expect(value.ok,JSON.stringify(value)).toBe(true);}
async function ready(page:Page,view:string){await page.goto(route+view);await expect(page.locator('.svc-content')).toBeVisible();await expect(page.locator('.svc-content [role=status]').filter({hasText:/Chargement/})).toHaveCount(0);}

test('responsive actual pages, touch navigation, and enlarged text',async({page})=>{
 test.setTimeout(180000);await fixture(page);
 for(const width of [320,375,390,430,768,1280]){
  await page.setViewportSize({width,height:844});
  for(const view of ['overview','work','calendar','available','proposals']){
   await ready(page,view);await fits(page);
   await expect(page.locator('#services-view-title')).toHaveCount(1);
   if(width<1024){expect(await page.locator('#services-view-title').evaluate(el=>el.parentElement!.parentElement!.getBoundingClientRect().height)).toBeLessThan(2);await expect(page.locator('.management-mobile-nav button')).toHaveCount(4);}
   else await expect(page.locator('.management-desktop-navigation')).toBeVisible();
  }
  await ready(page,'calendar');await page.getByRole('button',{name:'Mois',exact:true}).click();await fits(page);
  await page.getByRole('button',{name:'Disponibilités',exact:true}).click();await expect(page.locator('.svc-cal-week').first()).toBeVisible();await fits(page);
 }
 });
test('enlarged calendar and touch sheet',async({page})=>{
 await fixture(page);await page.setViewportSize({width:320,height:844});await ready(page,'work');
 await page.addStyleTag({content:'html{font-size:24px!important}'});await fits(page);
 const nav=page.locator('.management-mobile-nav');await nav.getByRole('button',{name:'Calendrier',exact:true}).tap();await expect(page.locator('.svc-planner')).toBeVisible();await fits(page);
 await nav.getByRole('button',{name:'Plus',exact:true}).tap();await expect(page.locator('.management-more-sheet')).toBeVisible();await fits(page);
});

test('Today real metrics, summary destinations, refresh, partial errors and share',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await fixture(page);await ready(page,'overview');
 await expect(page.locator('.svc-daily-kpi').first()).toContainText('2');await expect(page.locator('.svc-daily-kpi').nth(1)).toContainText('1');
 await expect(page.locator('.svc-daily-schedule')).toContainText('Consultation');await expect(page.locator('.svc-daily-opportunities')).toContainText('Accompagnement à domicile');
 const share=page.getByRole('button',{name:'Partager mon profil',exact:true});expect((await share.boundingBox())!.y).toBeGreaterThan((await page.locator('.svc-daily-opportunities').boundingBox())!.y);
 await share.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
 state.failPath='/today';await page.locator('.svc-daily-date button').click();await expect(page.locator('.svc-daily-attention [role=alert]')).toBeVisible();await expect(page.locator('.svc-daily-schedule')).toContainText('Consultation');await expect(page.locator('.svc-daily-clear')).toHaveCount(0);
 state.failPath='';state.empty=true;await page.locator('.svc-daily-attention').getByRole('button',{name:'Réessayer'}).click();await expect(page.locator('.svc-daily-clear')).toBeVisible();await expect(page.locator('.svc-daily-schedule')).toContainText('Aucun rendez-vous');
 state.empty=false;await page.locator('.svc-daily-kpi').nth(1).click();await expect(page.locator('.svc-work-list')).toContainText('SWR_new');await expect(page.locator('.svc-work-filters select').last()).toHaveValue('new');
});

test('work summaries match filtered lists, all tabs, details, refresh and failures',async({page})=>{
 await page.setViewportSize({width:375,height:844});const state=await fixture(page);await ready(page,'work');
 for(const [index,reference,filter] of [[0,'SWR_new','new'],[1,'SWR_quote','quotes'],[2,'RSV_pending','bookings'],[3,'RSV_active','jobs']] as const){
  await page.locator('.svc-work-kpi').nth(index).click();await expect(page.locator('.svc-work-list')).toContainText(reference);await expect(page.locator('.svc-work-filters select').last()).toHaveValue(filter);await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(1);
 }
 await page.locator('.svc-work-tabs').getByRole('button',{name:'Demandes et devis',exact:true}).click();await expect(page.locator('.svc-work-filters select').last()).toHaveValue('all');
 await page.locator('.svc-client-work').getByRole('button',{name:'Voir la demande',exact:true}).click();await expect(page.locator('.svc-work-detail')).toContainText('Client de démonstration');await page.locator('.svc-work-detail>button').first().click();await expect(page.locator('.svc-client-work')).toBeVisible();
 await page.locator('.svc-work-filters select').last().selectOption('sent');await expect(page.locator('.svc-work-empty')).toBeVisible();await page.locator('.svc-work-empty button').click();await expect(page.locator('.svc-client-work tbody tr')).toHaveCount(2);
 state.failed=true;await page.locator('.svc-work-filters .svc-icon-button').click();await expect(page.locator('.svc-work-kpi').first()).toContainText('—');await expect(page.locator('.svc-work-empty')).toHaveCount(0);
 state.failed=false;state.empty=true;await page.locator('.svc-work-filters .svc-icon-button').click();await expect(page.locator('.svc-work-empty')).toContainText('Aucune demande');await expect(page.locator('.svc-work-empty').getByRole('button',{name:'Partager mon profil'})).toBeVisible();
});

test('one calendar agenda, shared date and service, month boundaries, details and return',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await fixture(page);await ready(page,'calendar');
 await expect(page.locator('.svc-cal-event')).toHaveCount(2);await expect(page.locator('.svc-cal-event').filter({hasText:'Client B'})).toHaveCount(1);
 await page.getByRole('button',{name:'Mois',exact:true}).click();await expect(page.locator('.shida-cal-grid')).toBeVisible();await expect(page.locator('.svc-cal-event')).toHaveCount(2);await expect(page.locator('.shida-cal-agenda')).toHaveCount(0);
 await page.locator('.shida-cal-day[data-day="'+day()+'"]').click();await page.getByRole('button',{name:'Liste',exact:true}).click();await expect(page.locator('.svc-list-date')).toHaveCount(1);
 await page.locator('.svc-cal-date input').fill('2026-12-31');await page.getByRole('button',{name:'Jour',exact:true}).click();await page.locator('.svc-cal-date button').nth(1).click();await expect(page.locator('.svc-cal-date input')).toHaveValue('2027-01-01');
 await page.locator('.svc-cal-date button').last().click();await expect(page.locator('.svc-cal-date input')).toHaveValue(day());
 await page.locator('.svc-planner-toolbar select').selectOption('SVC_one');await expect.poll(()=>state.reads.some(path=>path.includes('/calendar?')&&path.includes('offering_ref=SVC_one'))).toBe(true);
 await page.locator('.svc-cal-event').first().getByRole('button').click();await expect(page.locator('.svc-work-detail')).toContainText('Consultation');
 await page.locator('.management-mobile-nav').getByRole('button',{name:'Calendrier',exact:true}).click();await expect(page.locator('.svc-cal-date input')).toHaveValue(day());await expect(page.locator('.svc-planner-toolbar select')).toHaveValue('SVC_one');
 state.failed=true;await page.locator('.svc-planner-toolbar .svc-icon-button').click();await expect(page.locator('.svc-planner [role=alert]')).toBeVisible();await expect(page.getByText('Aucune mission à planifier.',{exact:true})).toHaveCount(0);
 state.failed=false;state.empty=true;await page.locator('.svc-planner-toolbar .svc-icon-button').click();await expect(page.getByText('Aucune mission à planifier.',{exact:true})).toBeVisible();
});

test('saved availability, lazy preview errors, split hours, failed save preserves input and retry identity',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await fixture(page);await ready(page,'calendar');
 await page.getByRole('button',{name:'Disponibilités',exact:true}).click();await expect(page.locator('.svc-cal-week').first()).toContainText('Fermé');await expect(page.locator('.svc-cal-week').nth(1)).toContainText('09:00–12:00 · 13:00–17:00');await expect(page.getByText(/Les horaires personnalisés remplacent/)).toBeVisible();
 expect(state.reads.filter(path=>path.includes('/availability?'))).toHaveLength(0);
 state.previewFail=true;await page.locator('.svc-customer-preview summary').click();await expect(page.locator('.svc-customer-preview [role=alert]')).toContainText('Impossible de charger les créneaux');
 state.previewFail=false;await page.locator('.svc-customer-preview').getByRole('button',{name:'Réessayer'}).click();await expect(page.locator('.svc-preview-slots')).toContainText('09:00');
 await page.getByRole('button',{name:'Modifier les horaires du service',exact:true}).click();const dialog=page.locator('.svc-cal-drawer');await expect(dialog).toBeVisible();await dialog.locator('input[type=time]').first().fill('08:30');state.saveFail=true;
 await dialog.locator('footer button').last().click();await expect(dialog.locator('[role=alert]')).toBeVisible();await expect(dialog.locator('input[type=time]').first()).toHaveValue('08:30');await expect(dialog.locator('input[type=time]').first()).toBeDisabled();
 state.saveFail=false;await dialog.locator('footer button').last().click();await expect(dialog).not.toBeVisible();expect(state.writes).toHaveLength(2);expect(state.writes[0].body.operation_key).toBe(state.writes[1].body.operation_key);await expect(page.locator('.svc-cal-week').nth(1)).toContainText('08:30');
});

test('discovery tabs keep drafts across services, precise empty/error states and no eligible service',async({page})=>{
 await page.setViewportSize({width:430,height:844});const state=await fixture(page);await ready(page,'available&offering=SVC_one');
 await expect(page.locator('.svc-discovery-areas')).toContainText('Limete, Lemba, Matete');await page.locator('#svc-discovery-service').selectOption('SVC_two');await expect.poll(()=>state.reads.some(path=>path.includes('/postings/available?offering_ref=SVC_two'))).toBe(true);
 await page.getByRole('button',{name:'Mes propositions',exact:true}).click();await expect(page.locator('.svc-request:visible .svc-brief-card')).toContainText('Proposition pour un autre service');await expect(page.locator('.svc-request:visible .svc-request-tag')).toContainText('préparation');
 await page.getByRole('button',{name:'Demandes disponibles',exact:true}).click();await expect(page.locator('#svc-discovery-service')).toHaveValue('SVC_two');
 state.failed=true;await page.locator('.svc-request:visible .svc-discovery-controls button').click();await expect(page.locator('.svc-request:visible [role=alert]')).toBeVisible();await expect(page.locator('.svc-request:visible .svc-discovery-empty')).toHaveCount(0);
 state.failed=false;state.empty=true;await page.locator('.svc-request:visible [role=alert] button').click();await expect(page.locator('.svc-request:visible .svc-discovery-empty')).toContainText('Aucune demande pour le moment');await page.getByRole('button',{name:'Changer de service'}).click();await expect(page.locator('#svc-discovery-service')).toBeFocused();
 await page.getByRole('button',{name:'Mes propositions',exact:true}).click();await page.locator('.svc-request:visible .svc-discovery-controls button').click();await expect(page.locator('.svc-request:visible .svc-discovery-empty')).toContainText('Aucune proposition');
 state.noEligible=true;await ready(page,'available');await expect(page.locator('.svc-request:visible .svc-discovery-empty')).toContainText('Aucun service disponible');await page.locator('.svc-discovery-empty button').click();await expect(page).toHaveURL(/view=services/);
});

test('Plus destinations, one return row, locale preservation, sheet focus and safe-area clearance',async({page})=>{
 await page.setViewportSize({width:320,height:844});await fixture(page);await ready(page,'overview');
 for(const [label,view] of [['Trouver des missions','available'],['Services et tarifs','services'],['Comptoir','counter'],['Finances','finance']]){
  await page.locator('.management-mobile-nav').getByRole('button',{name:'Plus',exact:true}).tap();const sheet=page.locator('.management-more-sheet');await expect(sheet.getByRole('button',{name:'Mon activité',exact:true})).toHaveCount(0);await sheet.getByRole('button',{name:label,exact:true}).tap();await expect(sheet).not.toBeVisible();await expect(page).toHaveURL(new RegExp('view='+view));await expect(page.locator('.svc-content')).toBeVisible();
 }
 await ready(page,'overview');await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
 const share=await page.locator('.svc-profile-share').boundingBox(),nav=await page.locator('.management-mobile-nav').boundingBox();expect(share!.y+share!.height).toBeLessThanOrEqual(nav!.y);
 await page.locator('.management-mobile-nav').getByRole('button',{name:'Plus',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('.management-mobile-nav').getByRole('button',{name:'Plus',exact:true})).toBeFocused();
 await page.locator('.management-mobile-nav').getByRole('button',{name:'Plus',exact:true}).click();await page.getByRole('button',{name:'Retour à mon espace',exact:false}).click();await expect(page).toHaveURL(/\/fr\/shida\/space/);
});

test('FR EN LN SW labels fit and denied responses cannot show empty work',async({page})=>{
 await page.setViewportSize({width:320,height:844});const state=await fixture(page);
 for(const lang of ['fr','en','ln','sw']){await page.goto(`${lang==='en'?'':'/'+lang}/shida/seller/services?view=work`);await expect(page.locator('.svc-work-kpi').first()).toContainText('1');await fits(page);await expect(page.locator('.management-mobile-nav button')).toHaveCount(4);}
 state.denied=true;await page.goto(route+'available');await expect(page.getByRole('alert').filter({hasText:'L’accès aux Services est indisponible'})).toBeVisible();await expect(page.locator('.svc-content')).toHaveCount(0);await page.goto(route+'work');await expect(page.getByRole('alert').filter({hasText:'L’accès aux Services est indisponible'})).toBeVisible();await expect(page.locator('.svc-work-list')).toHaveCount(0);await expect(page.locator('.svc-work-empty')).toHaveCount(0);
});

test('loading prevents refresh storms; failed availability does not invent closed hours',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await fixture(page);state.delay=500;
 await page.goto(route+'available');await expect(page.locator('.svc-request:visible [role=status]')).toContainText('Chargement');await expect(page.locator('.svc-discovery-controls button')).toBeDisabled();await expect(page.locator('.svc-discovery-empty')).toHaveCount(0);await expect(page.locator('.svc-brief-card')).toBeVisible();
 const count=()=>state.reads.filter(path=>path.includes('/postings/available?')).length,before=count();await page.locator('.svc-discovery-controls button').evaluate((el:HTMLButtonElement)=>{el.click();el.click();el.click();});await expect(page.locator('.svc-discovery-controls button')).toBeDisabled();await expect(page.locator('.svc-brief-card')).toBeVisible();expect(count()-before).toBe(1);
 state.delay=0;state.failPath='/schedule';await ready(page,'calendar');await page.getByRole('button',{name:'Disponibilités',exact:true}).click();await expect(page.locator('.svc-planner .svc-notice')).toBeVisible();await expect(page.locator('.svc-cal-week')).toHaveCount(0);await expect(page.getByRole('button',{name:'Modifier les horaires du service',exact:true})).toHaveCount(0);
});

test('manual booking conflict keeps input and rechecks slots; provider-wide block saves explicitly',async({page})=>{
 await page.setViewportSize({width:390,height:844});const state=await fixture(page);await ready(page,'calendar');
 await page.getByRole('button',{name:'Ajouter un rendez-vous',exact:false}).click();const form=page.locator('.svc-cal-panel').filter({has:page.locator('select')}).last();
 await form.getByLabel('Créneaux libres').selectOption('09:00');await form.getByRole('radio').first().check();await form.getByLabel('Client',{exact:true}).fill('Client synthétique');state.conflict=true;
 await form.getByRole('button',{name:'Ajouter un rendez-vous',exact:true}).click();await expect(form.locator('[role=alert]')).toBeVisible();await expect(form.getByLabel('Client',{exact:true})).toHaveValue('Client synthétique');expect(state.writes).toHaveLength(1);state.conflict=false;
 await form.getByRole('button',{name:'Ajouter un rendez-vous',exact:true}).click();await expect(form).not.toBeVisible();expect(state.writes).toHaveLength(2);expect(state.writes[0].body.operation_key).toBe(state.writes[1].body.operation_key);
 await page.getByRole('button',{name:'Disponibilités',exact:true}).click();await page.getByRole('button',{name:'Bloquer une période',exact:true}).click();const drawer=page.locator('.svc-cal-drawer');await drawer.getByRole('button',{name:'Bloquer une période',exact:true}).click();await drawer.locator('input[type=date]').nth(0).fill('2027-02-01');await drawer.locator('input[type=date]').nth(1).fill('2027-02-02');await drawer.locator('footer button').last().click();await expect(drawer).not.toBeVisible();expect(state.writes.at(-1)?.body.personal_calendar).toMatchObject({absences:[{start:'2027-02-01',end:'2027-02-02'}],inherit_week:false});
});
