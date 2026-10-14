import {test,expect} from '@playwright/test';
import {servicesText} from '../../app/components/shida/services-transaction-copy';


for(const locale of ['en','fr','ln','sw'] as const)test(`provider transaction journey ${locale}`,async({page})=>{
 const t=(key:string)=>servicesText(locale,key);
 await page.setViewportSize({width:390,height:850});
 await page.addInitScript(language=>localStorage.setItem('shida-language',language),locale);
 let withdrawn=false,denied=false,empty=true;
 const offering={public_ref:'SVC_saved',provider_ref:'SVI_provider',name:'Provider',service_name:'Repairs A',category:'repair_maintenance',description:'Careful repairs',service_duration_minutes:60,commune:'Gombe',service_location_type:'private_home',home_service_available:'yes',booking_mode:'flexible',availability:'Weekdays',publication_origin:'pilot',requests_enabled:true,is_active:'yes',revision:1,missing_fields:[],packages:[],rating:{average:null,count:0}};
 let parent={request_ref:'SWR_one',offering_ref:'SVC_saved',offering:'Repairs A',requester:'Customer',description:'Repair a sink',status:'SUBMITTED',revision:1,actions:['review','decline'],can_create_quote:false,draft_quote_ref:'SQT_private'};
 let quote={quote_ref:'SQT_private',request_ref:'SWR_one',offering:'Repairs A',status:'DRAFT',revision:1,amount:'50.00',currency:'USD',duration_minutes:60,proposed_start:'2030-01-16T10:00:00Z',proposed_end:null,terms:'Materials included',actions:['edit','send']};
 let booking={reservation_ref:'RSV_one',offering_ref:'SVC_saved',service_name:'Repairs A',requester_name:'Customer',requested_datetime:'2030-01-15 10:00',status:'pending',revision:1,can_respond:true};
 let thread={thread_ref:'MSG_one',reservation_ref:'RSV_one',title:'Repairs A',status:'writable',revision:'a'.repeat(64),actions:['read','send','close'],messages:[{sender:'other',body:'Which materials?',created_at:'2026-10-13T10:00:00Z'}]};
 const writes:{path:string;body:Record<string,unknown>}[]=[];
 await page.route('**/api/shida/**',async route=>{
  const request=route.request(),url=new URL(request.url()),path=url.pathname;
  if(path.endsWith('/employment/session/'))return route.fulfill({json:{binding:'a'.repeat(64),user:{display_name:'Provider'}}});
  if(path.endsWith('/services/capabilities'))return route.fulfill({json:{bundle:'personal_pro',access_policy:'pilot',purchase_required:false,capabilities:['profile','packages','reservations','messages']}});
  if(path.includes('/services')){
   if(denied)return route.fulfill({status:403,json:{detail:'unavailable'}});
   const tx=path.split('/transactions/')[1];
   if(!tx){if(path.endsWith('/reviews'))return route.fulfill({json:{reviews:[]}});return route.fulfill({json:{profiles:empty?[]:[{...offering,publication_origin:withdrawn?'historical':'pilot'}]}});}
   if(request.method()!=='GET'){
    const body=request.postDataJSON();writes.push({path,body});
    if(tx==='requests/SWR_one/review'){expect(body.revision).toBe(parent.revision);parent={...parent,status:'IN_REVIEW',revision:2,actions:['decline']};}
    if(tx==='quotes/SQT_private'){expect(body.revision).toBe(quote.revision);quote={...quote,...body,revision:quote.revision+1};}
    if(tx==='quotes/SQT_private/send'){expect(body.revision).toBe(quote.revision);quote={...quote,status:'SENT',revision:quote.revision+1,actions:['withdraw']};parent={...parent,status:'QUOTED',revision:3,actions:[]};}
    if(tx==='reservations/RSV_one/decision'){expect(body.revision).toBe(booking.revision);booking={...booking,status:'confirmed',revision:2,can_respond:false};}
    if(tx==='messages/MSG_one/actions'){expect(body.revision).toBe(thread.revision);thread={...thread,revision:'b'.repeat(64),messages:[...thread.messages,{sender:'you',body:body.body,created_at:'2026-10-13T11:00:00Z'}]};}
    return route.fulfill({json:{stored:true}});
   }
   const responses:Record<string,unknown>={requests:{requests:empty?[]:[parent],has_more:false},'requests/SWR_one':parent,'requests/SWR_one/quotes':{quotes:[quote],has_more:false},'quotes/SQT_private':quote,reservations:{reservations:empty?[]:[booking]},'reservations/RSV_one':booking,'reservations/RSV_one/lifecycle':{...booking,actions:booking.status==='confirmed'?['start','complete','cancel']:[],rescheduling:{actions:[],proposal:null}},messages:{threads:empty?[]:[thread]},'messages/MSG_one':thread};
   return route.fulfill({json:responses[tx]??{}});
  }
  return route.fulfill({status:404,json:{detail:'unavailable'}});
 });
 const destination=()=>`${locale==='en'?'':`/${locale}`}/shida/seller/services`;
 await page.goto(destination());
 const workspace=page.getByRole('region',{name:t('workspace')});
 await expect(workspace.getByText(t('empty'))).toBeVisible();
 empty=false;await page.goto(destination()+'?offering=SVC_saved');
 await workspace.getByRole('button',{name:/Repairs A/}).click();
 await workspace.getByRole('button',{name:t('review'),exact:true}).click();
 await workspace.getByRole('button',{name:t('confirm'),exact:true}).click();
 await expect(workspace.getByText(t('in_review'),{exact:true})).toBeVisible();
 await workspace.getByRole('button',{name:new RegExp(t('quote'))}).click();
 await expect(workspace.getByText(t('private'))).toBeVisible();
 await workspace.getByRole('button',{name:t('edit'),exact:true}).click();
 await workspace.getByLabel(t('amount'),{exact:true}).fill('75.00');
 await workspace.getByRole('button',{name:t('save'),exact:true}).click();
 await workspace.getByRole('button',{name:new RegExp(t('quote'))}).click();
 await workspace.getByRole('button',{name:t('send'),exact:true}).click();
 await workspace.getByRole('button',{name:t('confirm'),exact:true}).click();
 await expect(workspace.getByText(t('quoted'),{exact:true})).toBeVisible();
 await workspace.getByRole('button',{name:t('reservations'),exact:true}).click();
 await workspace.getByRole('button',{name:/Repairs A/}).click();
 await expect(workspace.getByText(t('pending_note'))).toBeVisible();
 await workspace.getByRole('button',{name:t('accept'),exact:true}).click();
 await workspace.getByRole('button',{name:t('confirm'),exact:true}).click();
 await expect(workspace.getByText(t('confirmed'),{exact:true})).toBeVisible();
 await workspace.getByRole('button',{name:t('messages'),exact:true}).click();
 await workspace.getByRole('button',{name:/Repairs A/}).click();
 await expect(workspace.getByText('Which materials?')).toBeVisible();
 await workspace.getByRole('button',{name:t('reply'),exact:true}).click();
 await workspace.getByLabel(t('body'),{exact:true}).fill('Materials included.');
 await workspace.getByRole('button',{name:t('confirm'),exact:true}).click();
 await expect(workspace.getByText('Materials included.',{exact:true})).toBeVisible();
 withdrawn=true;await workspace.getByRole('button',{name:t('requests'),exact:true}).click();
 await workspace.getByRole('button',{name:/Repairs A/}).click();
 await expect(workspace.getByRole('button',{name:new RegExp(t('quote'))})).toBeVisible();
 expect(writes).toHaveLength(5);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 denied=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('alert').first()).toBeVisible();
 await expect(page.getByText('Repair a sink')).toHaveCount(0);
 
});
