import './refinement-fixture-fetch.mjs';
const prior=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 const response=await prior(input,init);
 if(process.env.SERVICES_FIXTURE_MODE!=='1'||!/^https:\/\/services-[a-f0-9-]{36}\.fixture\.invalid$/.test(url.origin)||url.pathname.replace(/\/$/,'')!=='/api/public/shida/jobs'||!response.ok)return response;
 const data=await response.json(),job=data.items[0];
 return Response.json({...data,items:[job,{...job,public_ref:'JOB_COMPACT',title:'Assistant',published_at:'2026-10-20T10:00:00Z',location:{city:'Kinshasa',commune:'Gombe',address:'PRIVATE_ADDRESS_SENTINEL',landmark:'PRIVATE_LANDMARK_SENTINEL',address_visibility:'private'}},{...job,public_ref:'JOB_LONG',title:'Long translated title with extraordinarilylongunbrokenwordfortesting',published_at:'2026-10-21T10:00:00Z'}],pagination:{page:1,page_size:3,total_items:3,total_pages:1}});
};
