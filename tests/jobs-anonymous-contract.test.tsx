import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getJobs, getJob, getJobEmployer } from '../app/services/shida/public-client';
import { publicJobEmployerKey } from '../app/lib/job-employer';
import { DiscoveryListings } from '../app/components/pages/shida-discovery-listings';

const employer={public_ref:null,slug:null,name:'Private employer',identity_type:'individual',profile_image:null,city:null,area:null,owner_phone:'PRIVATE'};
const job={public_ref:'JOB_anon_fixture',slug:'JOB_anon_fixture',title:'Public individual opportunity',offer_type:'individual',origin:'direct',employer,location:{country_code:'CD',city:'Kinshasa',area:null,commune:'Gombe',quartier:null,display:'Gombe'},status:'open',lifecycle_state:'published',public_url:'https://nihiloba.com/shida/emplois/JOB_anon_fixture',apply_label:'Apply on SHIDA',requirements_document:{available:false,url:null},public_social_link:null};
const response=(items:unknown[])=>({items,pagination:{page:1,page_size:3,total_items:items.length,total_pages:1}});
const mock=(value:unknown)=>vi.stubGlobal('fetch',vi.fn().mockImplementation(()=>Promise.resolve(Response.json(value))));
afterEach(()=>vi.unstubAllGlobals());
it('accepts anonymous individual posters in collections and detail without exposing extra fields',async()=>{
 mock(response([job]));const parsed=(await getJobs()).items[0];
 expect(parsed.employer.public_ref).toBeNull();expect(parsed.employer.slug).toBeNull();
 expect(parsed.employer).not.toHaveProperty('owner_phone');expect(parsed.relationship_capabilities.can_follow_employer).toBe(false);
 expect(publicJobEmployerKey(parsed.employer)).toBeNull();
 mock(job);expect((await getJob('anonymous-detail-fixture')).employer.public_ref).toBeNull();
});
it.each([
 {identity_type:'shida_employer',public_ref:null},
 {identity_type:'organization_directory',public_ref:null},
 {identity_type:'unknown',public_ref:null},
 {identity_type:'individual',public_ref:'12'},
 {identity_type:'individual',public_ref:undefined},
 {identity_type:'individual',public_ref:null,slug:'invented-profile'},
])('still rejects invalid employer identities %j',async change=>{
 mock(response([{...job,employer:{...employer,...change}}]));await expect(getJobs()).rejects.toMatchObject({kind:'malformed'});
});
it.each([{offer_type:'enterprise'},{origin:'external'},{relationship_capabilities:{can_save:true,save_target_type:'job',save_target_ref:job.public_ref,can_share:true,can_follow_employer:true,follow_target_type:'company',follow_target_ref:'EMP_wrong'}}])('does not extend the anonymous exception to invalid contexts %j',async change=>{
 mock(response([{...job,...change}]));await expect(getJobs()).rejects.toMatchObject({kind:'malformed'});
});
it('requires a real identity on public employer detail endpoints',async()=>{
 mock({...employer,description:null,open_job_count:1,jobs:[job]});await expect(getJobEmployer('anonymous-employer-fixture')).rejects.toMatchObject({kind:'malformed'});
});
it('keeps organization profile links and suppresses legacy personal profile links',async()=>{
 mock(response([{...job,offer_type:'enterprise',employer:{...employer,public_ref:'EMP_fixture',slug:'fixture',identity_type:'shida_employer'}}]));const parsed=(await getJobs()).items[0];
 expect(publicJobEmployerKey(parsed.employer)).toBe('fixture');
 expect(publicJobEmployerKey({...parsed.employer,identity_type:'individual'})).toBeNull();
});
it('renders actual parsed anonymous jobs in discovery while services remain independently empty',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockImplementation((url:string)=>Promise.resolve(Response.json(url.includes('/jobs?')?response([job]):{items:[],count:0,total:0,page:1,page_size:3}))));
 const html=renderToStaticMarkup(await DiscoveryListings({locale:'en'}));
 expect(html).toContain('Public individual opportunity');expect(html).toContain('/shida/emplois/JOB_anon_fixture');
 expect(html).not.toContain('temporarily unavailable');expect(html).not.toContain('/employeurs/');expect(html).not.toContain('PRIVATE');
});
