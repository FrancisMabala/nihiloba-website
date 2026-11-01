import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {professionalCategory,professionalBase,professionalAction} from '../app/lib/professional-storefront';
import {ProfessionalStorefront} from '../app/components/shida/professional-storefront';
import type {PublicServiceProvider,PublicServiceSummary} from '../app/types/shida-public';
const location={country_code:'SE',city:'Stockholm',commune:'Limete, Lemba, Matete',quartier:null,area:null,address_visibility:'private' as const,address:'PRIVATE HOME',landmark:'PRIVATE LANDMARK'};
const provider={public_ref:'SVI_brand',slug:'cabinet-horizon',name:'Cabinet Horizon',profile_image:null};
const service:PublicServiceSummary={public_ref:'SVC_legal',slug:'legal-consultation',provider,service_name:'Consultation',category:'professional_services',short_description:null,duration_minutes:60,starting_price:{public_ref:'SPK_legal',name:'Consultation',duration_minutes:60,price:'50',currency:'USD',description:null,booking_url:null},location,location_type:'public_place',external_intervention_available:false,availability_mode:'time_slots',rating:{average_rating:null,rating_count:0},image_preview:null,public_detail_url:'https://nihiloba.com/shida/services/legal-consultation',booking_url:null};
const profile:PublicServiceProvider={...provider,location,categories:['professional_services'],service_count:1,rating:service.rating,services:[service]};
const labels={category:(s:string)=>s,mode:()=>null,duration:(n:number)=>`${n} min`,unavailable:'Unavailable',empty:'No services',external:'Website'};
describe('professional identity and offerings',()=>{
 it('keeps mixed identity independent of service ordering and unknown categories neutral',()=>{expect(professionalCategory({...profile,categories:['professional_services','education_training']})).toBe('general');expect(professionalCategory({...profile,categories:['education_training','professional_services']})).toBe('general');expect(professionalCategory({...profile,categories:[]})).toBe('general');expect(professionalCategory(profile)).toBe('professional_services');});
 it('does not combine legacy service coverage with the base city',()=>{expect(professionalBase(profile)).toBe('Stockholm');expect(professionalBase({...profile,workplace:{city:'Kinshasa',commune:'Gombe'}})).toBe('Gombe, Kinshasa');});
 it('selects actions by actual modes rather than professional category',()=>{expect(professionalAction(service)).toBe('book');expect(professionalAction({...service,availability_mode:'flexible',requests_enabled:true})).toBe('quote');expect(professionalAction({...service,availability_mode:'flexible',requests_enabled:false})).toBe('details');});
 it.each(['en','fr','ln','sw'] as const)('renders canonical identity, all services and scoped links in %s',locale=>{
  const html=renderToStaticMarkup(<ProfessionalStorefront profile={{...profile,categories:['professional_services','education_training'],services:[service,{...service,public_ref:'SVC_tutor',slug:'tutor',service_name:'Tutoring',category:'education_training',availability_mode:'flexible',requests_enabled:true}]}} reviews={{items:[],total:0,count:0,page:1,page_size:10}} locale={locale} labels={labels}/>);
  const prefix=locale==='en'?'':`/${locale}`;
  expect(html).toContain('<h1>Cabinet Horizon</h1>');expect(html).toContain('data-category="general"');expect(html).toContain(`${prefix}/shida/services/tutor#booking`);expect(html).toContain(`${prefix}/shida/services/legal-consultation#booking`);expect(html).toContain('50 USD');expect(html).not.toContain('PRIVATE');expect(html).not.toContain('Limete');expect(html).not.toContain('Verified professional');
 });
 it('renders genuine review text and date but no invented reviewer name',()=>{const html=renderToStaticMarkup(<ProfessionalStorefront profile={profile} reviews={{items:[{rating:4,comment:'Useful consultation',reviewer_display:'verified_customer',created_at:'2026-10-20'}],total:1,count:1,page:1,page_size:10}} locale="en" labels={labels}/>);expect(html).toContain('Useful consultation');expect(html).toContain('Verified customer');expect(html).toContain('2026');});
});
