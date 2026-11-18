import type {Page} from '@playwright/test';
import {servicesProviderOffering} from './services-provider';

export async function workPilotFixture(page:Page){
 const state={empty:false,failed:false,denied:false,loading:false,long:false,count:2,reads:[] as string[]};
 await page.clock.setFixedTime(new Date('2026-11-18T10:00:00Z'));
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname.replace(/\/$/,'');
  const reply=(json:unknown,status=200)=>route.fulfill({json,status});
  state.reads.push(path);
  if(request.method()!=='GET')throw Error('This read-only pilot fixture rejects writes: '+path);
  const name=state.long?'Cabinet de consultation et accompagnement professionnel de proximité à Kinshasa':'Cabinet de soins de proximité';
  const services=[{...servicesProviderOffering,service_name:'Consultation et accompagnement',category:'beauty_wellness',professional_profile:{name,photo:null}}, {...servicesProviderOffering,public_ref:'SVC_two',service_name:'Entretien à domicile'}];
  const requests=Array.from({length:state.count},(_,i)=>({request_ref:i===0?'SWR_new':i===1?'SWR_quote':`SWR_${i}`,offering_ref:i===1?'SVC_two':'SVC_one',offering:i===1?'Entretien à domicile':state.long?'Consultation et accompagnement professionnel pour les familles et les petites entreprises':services[0].service_name,requester:i===0?'Client de démonstration':`Client ${i+1}`,status:i===1?'IN_REVIEW':'SUBMITTED',created_at:'2026-11-18T09:00:00Z',revision:1,can_create_quote:true,...(i===1?{draft_quote_ref:'SQT_one'}:{}),actions:['review','decline'],description:'Description synthétique de la demande.'}));
  const reservations=[{reservation_ref:'RSV_pending',offering_ref:'SVC_one',service_name:'Consultation prévue',requester:'Client rendez-vous',status:'pending',requested_datetime:'2026-11-19 14:00',revision:1},{reservation_ref:'RSV_active',offering_ref:'SVC_two',service_name:'Mission entretien',status:'in_progress',revision:1}];
  if(path.endsWith('/employment/session'))return reply({binding:'a'.repeat(64),user:{display_name:'Fixture Provider'}});
  if(path.endsWith('/capabilities'))return reply({capabilities:['profile','packages','reservations','messages','structured_availability','requests_quotes','manual_journal','bills','basic_totals']});
  if(path.endsWith('/services/onboarding'))return reply({progress:[],remaining_capacity:3,professional_profile:{public_ref:'SVI_one',revision:1,name,primary_category:'beauty_wellness'}});
  if(path.endsWith('/services'))return reply({profiles:services});
  if(path.includes('/transactions/')){
   if(state.loading)await new Promise(resolve=>setTimeout(resolve,5000));
   if(state.denied)return reply({},403);
   if(state.failed)return reply({},503);
  }
  if(path.endsWith('/transactions/requests'))return reply({requests:state.empty?[]:requests,has_more:false});
  if(path.endsWith('/transactions/reservations'))return reply({reservations:state.empty?[]:reservations,has_more:false});
  if(path.endsWith('/transactions/messages'))return reply({threads:state.empty?[]:[{thread_ref:'MSG_one',offering_ref:'SVC_one',activity_ref:'SWR_new',title:'Suivi de la consultation',status:'writable',last_message_at:'2026-11-18T09:00:00Z'}],has_more:false});
  if(path.endsWith('/requests/SWR_new'))return reply(requests[0]);
  if(path.endsWith('/requests/SWR_quote'))return reply(requests[1]);
  if(path.endsWith('/quotes'))return reply({quotes:[],has_more:false});
  if(path.endsWith('/reservations/RSV_pending'))return reply(reservations[0]);
  if(path.endsWith('/reservations/RSV_active'))return reply(reservations[1]);
  if(path.endsWith('/lifecycle'))return reply({revision:1,actions:[],rescheduling:{actions:[]}});
  if(path.endsWith('/messages/MSG_one'))return reply({thread_ref:'MSG_one',title:'Suivi de la consultation',status:'closed',messages:[{body:'Message lié à la demande.',created_at:'2026-11-18T09:00:00Z'}],actions:[]});
  if(path.endsWith('/today')){const queue={items:[],has_more:false};return reply({date:'2026-11-18',timezone:'Africa/Kinshasa',requests:queue,pending:queue,upcoming:queue,messages:queue});}
  if(path.endsWith('/calendar'))return reply({timezone:'Africa/Kinshasa',items:[],unscheduled:[],has_more:false});
  if(path.endsWith('/postings/available'))return reply({requests:[]});
  if(path.endsWith('/schedule'))return reply({offering_ref:'SVC_one',revision:1,mode:'appointments',confirmation:'provider_approval',timezone:'Africa/Kinshasa',duration_minutes:60,hours:[],personal_calendar:{shared_revision:1,week:[],inherit_week:false,absences:[],travel_minutes:0}});
  return reply({items:[],documents:[],totals:[],entries:[],events:[],reviews:[],has_more:false});
 });
 return state;
}
