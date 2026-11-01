// Controlled test process only. Never imported into application code or production startup.
const origin=process.env.SHIDA_API_BASE_URL;
if(process.env.STAY_TRAVEL_FIXTURE_MODE!=='1'||!/^https:\/\/stay-[a-f0-9-]{36}\.fixture\.invalid$/.test(origin??''))throw new Error('Isolated stay/travel fixtures required');
const originalFetch=globalThis.fetch;
const apartment={public_ref:'APT-test',slug:'test-home',title:'Two bedroom home — controlled test listing',city:'Kinshasa',area:null,commune:'Gombe',quartier:null,rent:250,currency:'USD',number_of_rooms:2,description:'Controlled test data. No production records.',property_type:'apartment',availability_state:'available',images:[],owner:null,public_detail_url:'https://nihiloba.com/shida/test-listing',visit_url:null};
const hotel={public_ref:'HOT-test',slug:'test-hotel',name:'Controlled test hotel',description:'Test room collection',country_code:'CD',city:'Goma',area:null,commune:null,quartier:null,address_line:null,landmark:null,room_types:[{name:'Room',price:80,currency:'USD',rental_period:'night',capacity:2,total_rooms:4,image_reference:null,image_references:[],description:null}],public_detail_url:'https://nihiloba.com/shida/test-listing',booking_url:null};
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin!==origin){if(['localhost','127.0.0.1'].includes(url.hostname))return originalFetch(input,init);throw new Error('External network disabled in fixture process');}
 if(url.searchParams.get('query')==='failure')return Response.json({detail:'unavailable'},{status:503});
 if(url.pathname.endsWith('/apartments')){const items=url.searchParams.get('query')==='empty'?[]:[apartment];return Response.json({items,count:items.length,total:items.length,page:1,page_size:12,filters:{property_types:['apartment','house','studio']}});}
 if(url.pathname.endsWith('/hotels')){const items=url.searchParams.get('query')==='populated'?[hotel]:[];return Response.json({items,count:items.length});}
 return Response.json({detail:'not_found'},{status:404});
};
