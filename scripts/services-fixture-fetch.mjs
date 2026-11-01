// Explicit, process-local public fixtures. Never imported by application code.
const fixtureOrigin=process.env.SHIDA_API_BASE_URL;
if(process.env.SERVICES_FIXTURE_MODE!=="1"||!/^https:\/\/services-[a-f0-9-]{36}\.fixture\.invalid$/.test(fixtureOrigin??""))throw new Error("Services fixtures require the isolated test configuration");
const originalFetch=globalThis.fetch;
const location={country_code:"CD",city:"Kinshasa",commune:"Gombe",quartier:null,area:null,address_visibility:"private",address:null,landmark:null};
const provider={public_ref:"SVI_fixture",slug:"atelier-kin",name:"Atelier Kin",profile_image:null};
const service={requests_enabled:true,public_ref:"SVC_fixture",slug:"home-repair",provider,service_name:"Home repair",category:"repair_maintenance",short_description:"Careful repairs for the small things that make a home.",duration_minutes:60,starting_price:{public_ref:"SPK_fixture",name:"Standard visit",duration_minutes:60,price:"25",currency:"USD",description:null,booking_url:null},location,location_type:"public_place",external_intervention_available:true,availability_mode:"flexible",rating:{average_rating:null,rating_count:0},image_preview:null,public_detail_url:"https://nihiloba.com/shida/services/home-repair",booking_url:null};
const fixturePhoto={url:"https://res.cloudinary.com/dbrxpvmzp/image/upload/shida/services/fixture-beauty.png",alt:"Controlled salon layout fixture"};
const items=[service,{...service,public_ref:"SVC_clean",slug:"cleaning",service_name:"Home cleaning",category:"cleaning",short_description:"A fresh start for your space.",starting_price:{...service.starting_price,price:"35000",currency:"CDF"}},{...service,public_ref:"SVC_tutor",slug:"tutoring",service_name:"Private tutoring",category:"education_training",short_description:"Learn at your own pace, with individual support."}].map(item=>({...item,public_detail_url:`https://nihiloba.com/shida/services/${item.slug}`}));
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==="string"||input instanceof URL?input:input.url);
 if(url.origin!==fixtureOrigin){
  if(["localhost","127.0.0.1"].includes(url.hostname))return originalFetch(input,init);
  throw new Error("External network disabled in Services fixture process");
 }
 const path=url.pathname.replace(/\/$/,"");
 if(path==="/api/public/shida/services"){
  if(url.searchParams.get("query")==="partial"&&url.searchParams.get("mode")==="professionals")return Response.json({detail:"unavailable"},{status:503});
  if(url.searchParams.get("query")==="failure")return Response.json({detail:"unavailable"},{status:503});
  const selected=url.searchParams.get("query")==="empty"?[]:items.filter(row=>!url.searchParams.get("category")||row.category===url.searchParams.get("category"));
  if(url.searchParams.get("mode")==="professionals"){const profiles=selected.length?[{...provider,location,categories:[...new Set(selected.map(row=>row.category))],service_count:items.length,rating:service.rating,services:[]}]:[];return Response.json({items:profiles,count:profiles.length,total:profiles.length,page:1,page_size:12});}
  return Response.json({items:selected,count:selected.length,total:selected.length,page:1,page_size:12});
 }
 if(path.endsWith("/providers/professional-beauty")||path.endsWith("/providers/professional-legal")){
  const beauty=path.endsWith("professional-beauty"),identity={...provider,profile_image:beauty?fixturePhoto:null,name:beauty?"Studio Grace (test)":"Cabinet Horizon (test)",slug:beauty?"professional-beauty":"professional-legal"};
  const offered=(beauty?["Haircut","Hair care","Nail care"]:["Legal consultation","Contract preparation","Business advice"]).map((name,index)=>({...service,public_ref:`SVC_professional_${index}`,slug:service.slug,provider:identity,availability_mode:beauty?"time_slots":"flexible",image_preview:beauty?fixturePhoto:null,service_name:name,short_description:beauty?"Care adapted to your needs.":"Discuss your needs and agree the scope before work begins.",category:beauty?"beauty_wellness":"professional_services",starting_price:index===1?null:service.starting_price}));
  return Response.json({...identity,bio:beauty?"A calm place for personal care.":"Independent advice for individuals and small businesses.",social_link:null,location,categories:[beauty?"beauty_wellness":"professional_services"],service_count:offered.length,rating:service.rating,services:offered});
 }
 if(path.endsWith('/providers/professional-loading'))await new Promise(resolve=>setTimeout(resolve,2000));
 if(path.endsWith('/providers/professional-error'))return Response.json({detail:'unavailable'},{status:503});
 if(/\/providers\/professional-(repairs|education|mixed|single|empty|reviews)$/.test(path)){
  const scenario=path.split('-').at(-1),category=scenario==='education'?'education_training':'repair_maintenance';
  const identity={...provider,slug:'professional-'+scenario,name:scenario==='mixed'?'Independent practice (test)':scenario==='education'?'Learning Studio (test)':'Repair Studio (test)'};
  const offered=scenario==='empty'?[]:(scenario==='single'?[service]:items).map((s,i)=>({...s,provider:identity,category:scenario==='mixed'?s.category:category,availability_mode:i===0?'time_slots':'flexible',requests_enabled:i!==2,location:{...location,commune:'Limete, Lemba, Matete'},slug:scenario==='reviews'?'reviewed-service':i===0?'appointments':s.slug}));
  return Response.json({...identity,bio:scenario==='single'?null:'Public professional description for this controlled test.',location:{...location,city:scenario==='single'?null:'Stockholm',commune:'Limete, Lemba, Matete'},categories:scenario==='mixed'?['repair_maintenance','education_training','professional_services']:[category],service_count:offered.length,rating:service.rating,services:offered});
 }
 if(path.startsWith("/api/public/shida/services/providers/"))return Response.json({...provider,location,categories:["repair_maintenance","cleaning","education_training"],service_count:3,rating:service.rating,services:items});
 if(path==="/api/public/shida/services/beauty-packages")return Response.json({...service,slug:"beauty-packages",service_name:"Hair care (test)",category:"beauty_wellness",provider:{...provider,name:"Studio Grace (test)",slug:"professional-beauty",profile_image:fixturePhoto},description:"Controlled package selection fixture.",images:[fixturePhoto],image_preview:fixturePhoto,offerings:[{...service.starting_price,public_ref:"SPK_basic",name:"Basic styling",price:"20",duration_minutes:30},{...service.starting_price,public_ref:"SPK_care",name:"Hair treatment",price:"35",duration_minutes:60}],availability_endpoint:path+"/availability"});
 if(path==="/api/public/shida/services/appointments/availability"){
  const day=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
  return Response.json({service_ref:'SVC_appointments',appointment_booking:true,timezone:'Africa/Kinshasa',availability_mode:'time_slots',requested_time_requires_provider_confirmation:false,from:day,to:day,booking_url:null,slots:[{date:day,start_time:'09:00',end_time:'09:30',is_available:true,booking_url:null},{date:day,start_time:'09:30',end_time:'10:00',is_available:true,booking_url:null}]});
 }
 if(path==="/api/public/shida/services/appointments")return Response.json({...service,public_ref:'SVC_appointments',slug:'appointments',service_name:'Haircut appointments',availability_mode:'time_slots',duration_minutes:30,description:'Book a time at Studio Kin.',offerings:[],images:[],social_link:null,completion_mode:null,availability_endpoint:path+'/availability'});
 if(path.endsWith("/availability"))return Response.json({service_ref:service.public_ref,availability_mode:"flexible",requested_time_requires_provider_confirmation:true,from:"2026-10-16",to:"2026-11-16",slots:[],booking_url:null});
 if(path.endsWith('/reviewed-service/reviews'))return Response.json({items:[{rating:5,comment:'A clear and helpful consultation. Controlled review fixture.',reviewer_display:'verified_customer',created_at:'2026-10-20'}],count:1,total:1,page:1,page_size:10});
 if(path.endsWith("/reviews"))return Response.json({items:[],count:0,total:0,page:1,page_size:10});
 if(path.startsWith("/api/public/shida/services/")){const item=items.find(row=>path.endsWith('/'+row.slug));return item?Response.json({...item,description:item.short_description,offerings:[],images:[],social_link:null,completion_mode:null,availability_endpoint:path+"/availability"}):Response.json({detail:"missing"},{status:404});}
 return Response.json({detail:"fixture_unavailable"},{status:401});
};
